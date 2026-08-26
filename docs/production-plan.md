# Produktions-Plan — von der Beta zu v1.0

> Setzt [beta-plan.md](./beta-plan.md) voraus. Was hier steht, ist **nicht**
> nötig, um 50 Tester glücklich zu machen — sondern um 5.000 Nutzer zu
> überleben, ohne nachts aufzustehen.

---

## 1. Zielarchitektur

```
                              ┌──────────────┐
                              │  Cloudflare  │  DNS, TLS-Edge, DDoS,
                              │  (kostenlos) │  Caching statischer Assets
                              └──────┬───────┘
                                     │
              ┌──────────────────────▼──────────────────────┐
              │            VPS  (4 vCPU / 8 GB)             │
              │  ┌───────────────────────────────────────┐  │
              │  │  Caddy — TLS, HTTP/2, Health-Routing   │  │
              │  └───┬──────────────────────────┬────────┘  │
              │      │ /                        │ /api      │
              │      ▼                          ▼ /socket.io│
              │  ┌────────┐            ┌────────────────┐   │
              │  │frontend│            │ backend ×2     │   │
              │  │ nginx  │            │ (NestJS)       │   │
              │  │ static │            │ stateless!     │   │
              │  └────────┘            └───┬────────┬───┘   │
              │                            │        │       │
              │                    ┌───────▼──┐  ┌──▼─────┐ │
              │                    │ mongo    │  │ qdrant │ │
              │                    │ (replica)│  │        │ │
              │                    └────┬─────┘  └────────┘ │
              └─────────────────────────┼──────────────────-┘
                                        │
             ┌──────────────┐   ┌───────▼────────┐   ┌────────────┐
             │  S3/R2       │   │  Backups       │   │  Sentry    │
             │  /uploads    │   │  täglich, 30 d │   │  Errors    │
             │  + CDN       │   │  offsite       │   │  + Uptime  │
             └──────────────┘   └────────────────┘   └────────────┘
```

**Der wichtigste Umbau gegenüber heute:** Das Backend muss **zustandslos**
werden. Zwei Dinge stehen dem im Weg:

```
  HEUTE                                  PROD
  ────────────────────────────────────   ──────────────────────────────────
  /uploads liegt im Container-FS      →  S3/R2, URLs in der DB
  (process.cwd() + '/uploads')

  Socket.IO hält Verbindungen         →  Redis-Adapter, damit Instanz A
  im Prozessspeicher                     Events an Clients von Instanz B
                                         zustellen kann
```

Ohne beides läuft nur *eine* Backend-Instanz — was bis ~2.000 Nutzern okay ist,
aber jedes Deployment zu einem sichtbaren Ausfall macht.

---

## 2. Härtungs-Checkliste — mit konkreten Fundstellen

### 2.1 Sicherheit

| # | Was | Wo | Heute |
|---|-----|-----|-------|
| S1 | `helmet()` aktivieren | `backend/src/main.ts` | fehlt |
| S2 | Rate-Limiting (`@nestjs/throttler`) global + streng auf `/auth/*` | `app.module.ts` | fehlt |
| S3 | CORS auf konkrete Origins, `credentials: true` verträgt kein `'*'` | `main.ts`, `docker-compose.yml` | `'*'` gesetzt |
| S4 | `JWT_SECRET`: Boot-Abbruch bei Default/leer | `auth.module.ts` | Default im Compose |
| S5 | Refresh-Token-Rotation + Invalidierung bei Logout | `auth.service.ts` | prüfen |
| S6 | Passwort-Policy (min. 10 Zeichen), bcrypt-Rounds ≥ 12 | `auth.service.ts` | prüfen |
| S7 | Kein Hash / keine E-Mail in Public-Payloads (`select: false`) | `user.schema.ts` | prüfen |
| S8 | Upload: MIME-Whitelist, max. 5 MB, Dateiname neu vergeben | `media/` | neu |
| S9 | Mongo mit User/Passwort, keine Ports nach außen | `docker-compose.prod.yml` | offen auf :27017 |
| S10 | Globaler Exception-Filter, keine Stacktraces nach außen | `main.ts` | fehlt |
| S11 | Secrets nur via `.env`, nie im Compose-Literal | `docker-compose.yml` | Literal |
| S12 | Dependabot / `npm audit` im CI | `.github/` | kein CI |

### 2.2 Zuverlässigkeit

| # | Was | Warum |
|---|-----|-------|
| R1 | Mongo-Indizes: `quests` geo (2dsphere), `users.username` unique, `friendships` compound | Ohne Index wird jede Karten-Abfrage ein Full-Scan |
| R2 | Health-Endpoint prüft Mongo + Qdrant, nicht nur „Prozess lebt" | Sonst zeigt der Uptime-Check grün, während nichts geht |
| R3 | Graceful Shutdown (`app.enableShutdownHooks()`) | Kein Verbindungsabbruch beim Deploy |
| R4 | Timeouts + Retry für Replicate/Anthropic, immer Fallback | Externe API hängt → sonst hängt der Request |
| R5 | Kill-Switch per Env für jede externe KI-Nutzung | Kostenbremse und Ausfallschutz in einem |
| R6 | Backup-Restore einmal pro Quartal wirklich testen | Ein ungetestetes Backup ist kein Backup |

### 2.3 Performance

```
  Quest-Abfrage heute:            Quest-Abfrage prod:
  ┌────────────────────┐          ┌──────────────────────────┐
  │ find({}) + JS-     │          │ $geoNear mit 2dsphere-   │
  │ Haversine-Filter   │   ────▶  │ Index, limit, projection │
  │ über ALLE Quests   │          │ nur benötigte Felder     │
  └────────────────────┘          └──────────────────────────┘
   O(n) pro Request                O(log n), skaliert
```

| # | Was | Ziel |
|---|-----|------|
| P1 | Geo-Query in Mongo statt in JS | < 100 ms bei 50k Quests |
| P2 | Response-Projection (keine vollen Dokumente an die Karte) | Payload < 100 KB |
| P3 | `compression()` + Cache-Header für statische Assets | Mobile-First = Datenvolumen zählt |
| P4 | Frontend-Bundle splitten (MapLibre lazy) | First Load < 300 KB gz |
| P5 | Socket-Positionen throttlen (max. 1 Update / 3 s / User) | Sonst quadratischer Broadcast |

### 2.4 Recht & Datenschutz (DE/EU)

GPS-Verläufe sind besonders sensible personenbezogene Daten. Das ist der
Bereich mit dem höchsten Risiko und den geringsten Kosten, wenn man es früh
richtig macht.

```
  [ ] Impressum (§ 5 DDG) — Name, Anschrift, Kontakt
  [ ] Datenschutzerklärung: welche Daten, wozu, wie lange, an wen
  [ ] Rechtsgrundlage für Standortdaten = Einwilligung, widerrufbar
  [ ] Auftragsverarbeitung: Replicate + Anthropic (US!) → SCCs prüfen,
      oder: niemals personenbezogene Inhalte an diese APIs schicken
  [ ] Löschkonzept: Account löschen ⇒ Quests anonymisieren, Tracks weg
  [ ] Datenexport (Art. 20) — ein JSON-Dump reicht
  [ ] Aufbewahrung: Track-Rohdaten nach X Tagen aggregieren/löschen
  [ ] Minderjährige: Altersgrenze in AGB, Standort-Sharing default AUS
```

---

## 3. Release-Prozess

```
   lane/*  ──PR──▶ develop ──PR──▶ main ──tag──▶ Deploy
      │              │               │             │
      │              │               │             ├─▶ staging.sidequest.tld
      │              │               │             │   (automatisch, jeder Tag)
      │              │               │             │
      │              │               │             └─▶ sidequest.tld
      │              │               │                 (manuell bestätigt)
      ▼              ▼               ▼
   CI: build     CI: build       CI: build
                 + smoke-tests   + smoke-tests
                                 + audit
```

**Versionierung:** SemVer auf `main`. `v0.9.x-beta` → `v1.0.0`.

**Deployment (Zero-Downtime, kleine Variante):**

```
  1. docker compose build backend           (neues Image, alte Instanz läuft)
  2. docker compose up -d --no-deps backend (Nest startet, Health wartet)
  3. Caddy health-check schaltet um
  4. Smoke-Test gegen die Live-URL
  5. Bei Fehler: docker compose up -d --no-deps backend:<vorheriger-tag>
```

**Rollback-Regel:** Kein Debugging in Produktion. Erst zurückrollen, dann
lokal reproduzieren. Vorherigen Image-Tag immer behalten.

**Datenbank-Migrationen:** Mongoose ist schemalos — deshalb gilt die
Zwei-Schritt-Regel:

```
  Release N   : neues Feld schreiben UND altes weiter lesen
  Backfill    : Skript füllt Altbestand
  Release N+1 : altes Feld nicht mehr lesen
  Release N+2 : altes Feld entfernen
```

Nie Feld umbenennen und Code gleichzeitig umstellen — das ist genau der Fehler,
der bei zwei parallelen Lanes garantiert passiert.

---

## 4. Observability

```
  ┌──────────┐    ┌───────────┐    ┌────────────┐    ┌──────────────┐
  │ Uptime-  │    │  Sentry   │    │  Logs      │    │ Business-    │
  │ Ping     │    │  FE + BE  │    │  (docker/  │    │ Metriken     │
  │ /health  │    │  Errors   │    │   loki)    │    │              │
  │ 1×/min   │    │ + Release │    │  7 Tage    │    │ DAU, Quests/ │
  └────┬─────┘    └─────┬─────┘    └─────┬──────┘    │ Tag, Retention│
       │                │                │           └──────┬───────┘
       └────────────────┴────────────────┴──────────────────┘
                             │
                             ▼
                   Telegram-/Discord-Webhook
                   (bei P0: Ping aufs Handy)
```

Alarm-Schwellen, mit denen man leben kann:

| Signal | Schwelle | Reaktion |
|--------|----------|----------|
| `/health` rot | 2 Checks in Folge | sofort |
| Fehlerrate 5xx | > 2 % über 5 min | < 1 h |
| Antwortzeit p95 | > 1,5 s über 10 min | am selben Tag |
| Mongo-Disk | > 80 % | diese Woche |
| Replicate-Kosten | > Tagesbudget | Kill-Switch greift automatisch |

---

## 5. Kosten (Größenordnung, monatlich)

```
  ┌────────────────────────┬──────────┬──────────────────────────────┐
  │ VPS 4 vCPU / 8 GB      │  15–25 € │ Hetzner CPX31 o. ä.          │
  │ Object Storage (R2/S3) │   1–5 €  │ Uploads + CDN                │
  │ Domain                 │   1–2 €  │                              │
  │ Backups (offsite)      │   3–5 €  │ Storage Box                  │
  │ Sentry                 │   0–26 € │ Free-Tier reicht lange       │
  │ Replicate (KI-Bilder)  │  ??      │ ← das ist die Wildcard       │
  │ Anthropic (Pet-Brain)  │  ??      │ ← ebenfalls                  │
  ├────────────────────────┼──────────┼──────────────────────────────┤
  │ Fix                    │  20–60 € │ planbar                      │
  │ Variabel               │  ohne Cap unbegrenzt → HARTES LIMIT!   │
  └────────────────────────┴──────────┴──────────────────────────────┘
```

Konkret: pro Nutzer und Tag maximal N KI-Bilder, global ein Tagesbudget, das
den Feature-Flag automatisch abschaltet. Diese Bremse einbauen, **bevor** die
App öffentlich ist.

---

## 6. Skalierungsstufen

```
   Stufe 0   bis     100 Nutzer   1 VPS, alles in einem Compose      ← Beta
   Stufe 1   bis   2.000 Nutzer   + Indizes, + S3, + Backups, + Sentry
   Stufe 2   bis  10.000 Nutzer   + 2. Backend-Instanz, Redis-Socket-Adapter,
                                    Mongo Replica Set
   Stufe 3   ab   10.000 Nutzer   Managed Mongo (Atlas), getrennter
                                    Worker für KI-Jobs (Queue), CDN vor allem
```

Nicht vorbauen. Jede Stufe erst umsetzen, wenn die vorherige an ihre Grenze
kommt — aber die Sachen aus Stufe 1, die *Datenverlust* verhindern (Backups),
sofort.

---

## 7. v1.0-Gate

```
  [ ] Alle S1–S12 erledigt
  [ ] R1–R6 erledigt, Restore einmal erfolgreich getestet
  [ ] Recht: Impressum, Datenschutz, Löschung, Export live
  [ ] Staging-Umgebung existiert und wird vor jedem Release benutzt
  [ ] Rollback einmal geprobt
  [ ] Sentry + Uptime + Alarmkanal aktiv
  [ ] Kosten-Kill-Switch getestet (künstlich auslösen!)
  [ ] p95 < 500 ms auf den drei Kern-Endpunkten
  [ ] Beta-Feedback: keine offenen P0/P1
```

---

## Siehe auch

- [beta-plan.md](./beta-plan.md) — der Schritt davor
- [workflow.md](./workflow.md) — wie das Team dabei parallel arbeitet
- [architecture.md](./architecture.md) — Ist-Architektur
- [blockchain-rollout-plan.md](./blockchain-rollout-plan.md) — separater Track, **nach** v1.0

# Beta-Plan — von „läuft bei mir" zu „läuft bei 50 Leuten"

> **Zielbild:** In 4 Wochen eine Closed Beta mit 20–50 echten Testern, auf einer
> echten URL, mit echter Datenbank, ohne dass jemand `npm run dev` braucht.
> **Nicht** Zielbild: fertig, hübsch, vollständig, skalierbar.

---

## 1. Was „Beta" hier bedeutet

```
   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────┐
   │  PROTOTYP    │──▶│  CLOSED BETA │──▶│  OPEN BETA   │──▶│   PROD   │
   │  (heute)     │   │  (Ziel: 4 W) │   │  (später)    │   │  (v1.0)  │
   ├──────────────┤   ├──────────────┤   ├──────────────┤   ├──────────┤
   │ localhost    │   │ eine URL     │   │ Registrierung│   │ SLA, TLS,│
   │ dev-DB       │   │ echte Mongo  │   │ offen        │   │ Backups, │
   │ Feature-Flut │   │ + Backups    │   │ Monitoring   │   │ Support  │
   │ 2 Nutzer     │   │ 20–50 Tester │   │ 500+ Nutzer  │   │ Impressum│
   │ keine Tests  │   │ Smoke-Tests  │   │ Sentry       │   │ DSGVO OK │
   └──────────────┘   └──────────────┘   └──────────────┘   └──────────┘
        ▲                    ▲
        │                    └── dieses Dokument
        └── Layer 0: Arbeitsbaum aufräumen (workflow.md §2)
```

**Beta ist erreicht, wenn ein Fremder auf dem Handy** die App öffnen, sich
registrieren, eine Quest auf der Karte finden, hingehen, abschließen und XP
bekommen kann — ohne dass jemand aus dem Team danebensteht.

---

## 2. Scope-Schnitt — was rein muss und was wartet

```
  ┌─────────────────── BETA-KERN (muss) ──────────────────────┐
  │  ✔ Registrierung / Login / Refresh-Token                  │
  │  ✔ Karte + Quests laden + Clustering                      │
  │  ✔ Quest erstellen, annehmen, GPS-verifiziert abschließen │
  │  ✔ XP / Streak / Coins                                    │
  │  ✔ Profil (öffentlich + eigenes), Emblems                 │
  │  ✔ Freundschaften + Profil-Wall                           │
  │  ✔ Pet: Portrait, Basis-Interaktion                       │
  │  ✔ Legal-Seiten (Impressum, Datenschutz, AGB-Stub)        │
  └───────────────────────────────────────────────────────────┘
  ┌─────────────── BETA-NICE (wenn Zeit bleibt) ──────────────┐
  │  ○ Chat / Realtime-Positionen                             │
  │  ○ Semantische Quest-Suche (Qdrant)                       │
  │  ○ Tracks aufzeichnen                                     │
  │  ○ Treasures / Compass-Routing                            │
  └───────────────────────────────────────────────────────────┘
  ┌──────────────── NACH DER BETA (Flag: aus) ────────────────┐
  │  ✘ Blockchain / on-chain Tausch  → docs/blockchain-*.md   │
  │  ✘ Dungeon-Minispiel                                      │
  │  ✘ Guilds                                                 │
  │  ✘ KI-generierte Bilder in großem Stil (Replicate-Kosten) │
  └───────────────────────────────────────────────────────────┘
```

**Regel:** Alles aus „nach der Beta" bleibt im Code, wird aber per Feature-Flag
ausgeblendet (`VITE_FEATURE_CHAIN=false` etc.). Nicht löschen, nicht anzeigen.

---

## 3. Der 4-Wochen-Plan

```
        W0            W1            W2            W3            W4
   ┌───────────┬─────────────┬─────────────┬─────────────┬───────────┐
P  │ AUFRÄUMEN │ HÄRTEN      │ DEPLOY      │ TESTER      │ FIX       │
L  │           │             │             │             │           │
A  │ ▓▓▓▓▓▓▓▓▓ │             │             │             │           │
T  │ commits   │ ▓▓▓▓▓▓▓▓▓▓▓ │ ▓▓▓▓▓▓▓▓▓▓  │             │ ▓▓▓▓▓     │
F  │ splitten  │ helmet,     │ VPS, Caddy, │             │ Hotfixes  │
O  │ branches  │ throttler,  │ compose-    │             │           │
R  │ aufräumen │ .env, CORS  │ prod, DNS   │             │           │
M  │           │             │             │             │           │
   ├───────────┼─────────────┼─────────────┼─────────────┼───────────┤
Q  │           │ ▓▓▓▓▓▓▓▓▓▓  │ ▓▓▓▓▓       │             │ ▓▓▓▓▓▓▓   │
U  │           │ Fehlerfälle │ Seed-Quests │  FEATURE    │ Bugs aus  │
E  │           │ Empty-States│ Berlin      │  FREEZE     │ Feedback  │
S  │           │             │             │             │           │
T  │           │             │             │  ▓▓▓▓▓▓▓▓▓  │           │
   ├───────────┼─────────────┼─────────────┤  Onboarding ├───────────┤
S  │           │ ▓▓▓▓▓▓▓     │ ▓▓▓▓▓       │  20–50      │ ▓▓▓▓▓     │
O  │           │ Profil-Flow │ Moderation: │  Tester     │           │
C  │           │ Freunde     │ Report-Btn  │             │           │
   ├───────────┼─────────────┼─────────────┤  ▓▓▓▓▓▓▓▓▓  ├───────────┤
R  │           │ ▓▓▓▓▓       │ ▓▓▓         │  Feedback   │ ▓▓▓       │
P  │           │ Pet-Kosten  │ Replicate   │  sammeln    │           │
G  │           │ deckeln     │ Budget-Cap  │             │           │
   └───────────┴─────────────┴─────────────┴─────────────┴───────────┘
                                            ▲
                                            └── ab hier: nur noch Fixes
```

### W0 — Aufräumen (blockiert alles andere)

| # | Aufgabe | Lane | Warum |
|---|---------|------|-------|
| 0.1 | 59 offene Dateien in ~6 thematische Commits splitten | platform | workflow.md §2 |
| 0.2 | Remote-Branches aufräumen (20 Stück → gemergte weg, Rest `archive/*`) | platform | Übersicht |
| 0.3 | `docs/BOARD.md` scharfschalten, Lanes verteilen | beide | Parallelarbeit möglich |
| 0.4 | `.github/workflows/ci.yml`: Build FE + BE bei jedem PR | platform | develop bleibt grün |
| 0.5 | `scripts/lane.sh` testen (beide Rechner) | beide | Setup-Reibung raus |

### W1 — Härten

| # | Aufgabe | Lane | Fundstelle |
|---|---------|------|------------|
| 1.1 | `helmet` + `compression` in `main.ts` | platform | `backend/src/main.ts` |
| 1.2 | `@nestjs/throttler`: global 100 req/min, Auth-Routen 5/min | platform | fehlt komplett |
| 1.3 | CORS: `origin: '*'` + `credentials: true` ist kaputt → echte Origin-Liste | platform | `docker-compose.yml` |
| 1.4 | `JWT_SECRET` aus `.env`, Startabbruch wenn Default | platform | `docker-compose.yml:35` |
| 1.5 | Upload-Limits (Größe, MIME) im `media`-Modul | platform | neu |
| 1.6 | Globaler Error-Filter → keine Stacktraces an Clients | platform | fehlt |
| 1.7 | Empty-/Error-/Offline-States im Frontend (Karte ohne GPS, kein Netz) | quest | UX-Killer #1 |
| 1.8 | Replicate-Aufrufe deckeln (pro User pro Tag), Fallback prüfen | rpg | Kostenrisiko |
| 1.9 | Smoke-Test-Suite: 8–10 e2e-Tests für die Kernpfade | platform | 0 Tests aktuell |

**Zu 1.9 — die minimale Testliste** (mehr braucht Beta nicht):

```
  ① POST /api/auth/register  → 201 + Cookie
  ② POST /api/auth/login     → 200 + Access-Token
  ③ GET  /api/quests         → 200 + Array
  ④ POST /api/quests         → 201  (auth)
  ⑤ POST /api/quests         → 401  (ohne auth)
  ⑥ GET  /api/quests?lat&lng&radius → nur Quests im Radius
  ⑦ POST /api/quests/:id/complete   → XP steigt
  ⑧ GET  /api/users/:id      → keine E-Mail, kein Hash im Payload
  ⑨ GET  /api/health         → 200
  ⑩ Frontend: `npm run build` ohne TS-Fehler
```

### W2 — Deployen

```
        Internet
           │  https://beta.sidequest.<tld>
           ▼
   ┌───────────────┐
   │  Caddy        │  automatisches Let's-Encrypt-TLS
   │  Reverse-Proxy│
   └───┬───────┬───┘
       │       │  /api/* + /socket.io/*
       │       └──────────────┐
       ▼ /*                   ▼
   ┌─────────┐          ┌──────────┐      ┌──────────┐
   │ frontend│          │ backend  │─────▶│  mongo   │
   │ (nginx, │          │ (Nest)   │      │  :27017  │
   │  Vite-  │          │  :3000   │      └────┬─────┘
   │  Build) │          └────┬─────┘           │ nightly
   └─────────┘               │                 ▼ mongodump
                             │            ┌──────────┐
                             ├───────────▶│  qdrant  │
                             │            └──────────┘
                             ▼
                        ┌──────────┐
                        │ /uploads │ ← Docker-Volume, NICHT im Container!
                        └──────────┘
```

| # | Aufgabe | Lane |
|---|---------|------|
| 2.1 | `docker-compose.prod.yml`: keine Ports nach außen außer Caddy, alle Secrets aus `.env` | platform |
| 2.2 | Named Volume für `/uploads` — sonst sind generierte Bilder nach jedem Deploy weg | platform |
| 2.3 | VPS aufsetzen (2 vCPU / 4 GB reichen), Docker, Firewall, SSH-Keys | platform |
| 2.4 | DNS + `beta.`-Subdomain, Caddy-File | platform |
| 2.5 | Nightly `mongodump` in ein zweites Volume + wöchentlich runterladen | platform |
| 2.6 | Deploy-Skript: `git pull && docker compose up -d --build` | platform |
| 2.7 | 30–50 Seed-Quests für Berlin einspielen (leere Karte = tote Beta) | quest |
| 2.8 | Melde-Button an Quests und Profilen (Minimal-Moderation) | social |

### W3 — Tester

```
   Einladung (Link + Code)
         │
         ▼
   ┌──────────────┐  ┌────────────────┐  ┌──────────────────┐
   │ Registrieren │─▶│ 3 Start-Quests │─▶│ Feedback-Kanal   │
   │ (Handy!)     │  │ in ihrer Stadt │  │ (Telegram/Discord│
   └──────────────┘  └────────────────┘  │  + In-App-Button)│
                                          └────────┬─────────┘
                                                   │
                          ┌────────────────────────▼──────────┐
                          │ GitHub Issues, Label: beta-feedback│
                          │ Triage: täglich 15 Min, 2 Personen │
                          └────────────────────────────────────┘
```

- **Feature-Freeze ab W3, Montag.** Ab da nur noch `fix/*`-Branches.
- Tester-Welle 1: 10 Leute (Freunde, direktes Feedback).
  Welle 2 (W3 Mitte): +40, wenn Welle 1 nicht sofort abstürzt.
- Was wir messen (reicht erstmal, kein Analytics-Stack nötig):
  Registrierungen, abgeschlossene Quests, Crashes im Backend-Log,
  „Wie oft kam jemand bis zum ersten abgeschlossenen Quest?"

### W4 — Fixen

Nur noch drei Kategorien, in dieser Reihenfolge:

```
  P0  App unbenutzbar / Datenverlust / Sicherheitsloch   → sofort
  P1  Kernpfad kaputt (registrieren, Quest abschließen)  → < 24 h
  P2  Alles andere                                        → Backlog v1.0
```

---

## 4. Beta-Gate — Checkliste vor dem Einladen

```
  BUILD & CODE
  [ ] develop baut grün (FE + BE), CI läuft bei jedem PR
  [ ] Arbeitsbaum sauber, keine 50-Dateien-Commits mehr
  [ ] Smoke-Tests ①–⑩ grün

  SICHERHEIT
  [ ] JWT_SECRET nicht der Default, kommt aus .env
  [ ] CORS auf die Beta-Domain beschränkt (nicht '*')
  [ ] Rate-Limiting auf /api/auth/*
  [ ] Kein Passwort-Hash / keine E-Mail in öffentlichen API-Antworten
  [ ] Upload: Größen- und MIME-Limit

  BETRIEB
  [ ] HTTPS mit gültigem Zertifikat
  [ ] /uploads auf persistentem Volume
  [ ] Nightly Mongo-Backup läuft, einmal Restore GETESTET
  [ ] /api/health von außen erreichbar, Uptime-Ping (z. B. UptimeRobot)
  [ ] Backend-Logs erreichbar (docker compose logs -f)

  RECHT (DE!)
  [ ] Impressum erreichbar
  [ ] Datenschutzerklärung — GPS-Daten sind personenbezogene Daten!
  [ ] Einwilligung für Standortzugriff erklärt
  [ ] Account-Löschung funktioniert (Art. 17 DSGVO)

  PRODUKT
  [ ] Onboarding erklärt in < 30 s, was man tun soll
  [ ] Karte ist nicht leer (Seed-Quests)
  [ ] Feedback-Button in der App
```

**Wenn eine Zeile aus SICHERHEIT oder RECHT offen ist: keine Einladungen.**
Der Rest ist verhandelbar.

---

## 5. Risiken

| Risiko | Wahrscheinlichkeit | Gegenmittel |
|--------|--------------------|-------------|
| Replicate-Rechnung explodiert (Pet-Portraits, Badges, Szenen) | hoch | Hartes Tageslimit pro User + globaler Kill-Switch per Env |
| Leere Karte in anderen Städten als Berlin | hoch | Seed-Quests generisch + „Erstelle die erste Quest hier"-CTA |
| GPS-Spoofing / Fake-Completions | mittel | In Beta akzeptieren, aber Completion-Events loggen |
| Mongo ohne Auth im Container erreichbar | mittel | In prod-Compose keine Ports publishen, nur internes Netz |
| Feature-Scope wandert (Blockchain!) | hoch | Freeze ab W3, Flags aus, Vision-Docs bleiben Vision |
| Zwei Sessions zerlegen develop | mittel | workflow.md, BOARD, CI-Gate auf PRs |

---

## Siehe auch

- [workflow.md](./workflow.md) — wie parallel gearbeitet wird
- [production-plan.md](./production-plan.md) — was nach der Beta kommt
- [BOARD.md](./BOARD.md) — aktuelle Lane-Belegung

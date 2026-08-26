# Workflow — Zwei Menschen, viele Claude-Sessions, ein Repo

> **Für wen:** Simon (`sim-berg`), Dizzle (`Seakuh`) — und jede Claude-Code-Session,
> die in diesem Repo arbeitet.
> **Regel Nr. 0:** Wer hier arbeitet, trägt sich vorher in [BOARD.md](./BOARD.md) ein.

---

## 1. Die Kurzfassung (10 Regeln)

```
┌────────────────────────────────────────────────────────────────────┐
│  1. Eine Session = ein Worktree = ein Branch = eine Lane.          │
│  2. Lane vor Arbeitsbeginn in docs/BOARD.md eintragen.             │
│  3. Nur Dateien der eigenen Lane anfassen (Lane-Map, Abschnitt 4). │
│  4. Hotspot-Dateien: nur additiv, eine Zeile, nie umbauen.         │
│  5. develop ist immer grün (Build läuft) — kaputtes bleibt in Lane.│
│  6. Täglich `git fetch && git rebase origin/develop` in der Lane.  │
│  7. Kleine PRs: < ~400 geänderte Zeilen, ein Thema.                │
│  8. Kein `git push --force` auf develop/main. Niemals.             │
│  9. Schema-Änderungen (Mongo) = eigener PR, vorher im BOARD melden.│
│ 10. Session-Ende: committen oder stashen — nie dreckig verlassen.  │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. Layer 0 — Der Elefant im Raum

Stand heute liegen **31 geänderte + 28 neue Dateien** unversioniert im
Arbeitsbaum (friendship, media, track, vector, profile-comment, Emblems …).
Solange das so ist, ist paralleles Arbeiten **unmöglich** — jede zweite Session
sieht fremde, halbfertige Änderungen und baut darauf auf.

```
        JETZT                              NACH LAYER 0
  ┌──────────────────┐              ┌──────────────────┐
  │  develop         │              │  develop         │
  │  ┌────────────┐  │              │   ● feat(social) │
  │  │ 59 Dateien │  │   ────────▶  │   ● feat(track)  │
  │  │ ungetrackt │  │              │   ● feat(media)  │
  │  │ + dirty    │  │              │   ● feat(vector) │
  │  └────────────┘  │              │   ● feat(emblem) │
  │  = 1 Riesenklops │              │  = sauberer Baum │
  └──────────────────┘              └──────────────────┘
```

**Aufgabe vor allem anderen** (einmalig, ~1 Stunde, macht *eine* Person allein):

```bash
git add backend/src/friendship backend/src/profile-comment \
        frontend/src/components/profile/Friend* frontend/src/services/friend.service.ts \
        frontend/src/stores/useFriendStore.ts frontend/src/types/friendship.ts
git commit -m "feat(social): friendships, profile wall & kumpane"

git add backend/src/track frontend/src/components/track frontend/src/services/track.service.ts \
        frontend/src/stores/useTrackStore.ts frontend/src/types/track.ts
git commit -m "feat(track): GPS-Tracks aufzeichnen und anzeigen"

git add backend/src/vector backend/src/quest/dto/quest-search.dto.ts docker-compose.yml
git commit -m "feat(quest): semantische Quest-Suche über Qdrant"

git add backend/src/media
git commit -m "feat(media): Upload-Modul"

git add frontend/src/components/profile/Emblem* frontend/src/components/profile/Featured* \
        backend/src/achievement frontend/src/services/achievement.service.ts \
        frontend/src/types/achievement.ts
git commit -m "feat(achievement): Emblem-Regal & Featured-Emblems"

git status   # Rest einzeln durchgehen, nichts pauschal `git add .`
```

Erst wenn `git status` sauber ist, geht Abschnitt 5 los.

---

## 3. Branch-Modell

Drei Ebenen, mehr nicht. Kein GitFlow-Zirkus.

```
  main      ────●──────────────────────────●─────────────────●────▶
                │ v0.9.0-beta              │ v0.9.3-beta     │ v1.0.0
                │                          │                 │
                ▲ nur Merge von develop, immer getaggt       ▲
                │                                            │
  develop   ──●─┴──●────●────●────●────●────●────●────●───●──┴──▶
              ▲     ▲         ▲         ▲              ▲
              │     │         │         │              │
              │  ┌──┘         │         │              │
  lane/*      │  │            │         │              │
      quest-search  ●──●──●───┘         │              │
      social-wall        ●──●───────────┘              │
      pet-brain               ●──●──●──●───────────────┘

  Legende:  ● Commit      ▲ Merge (--no-ff, per PR)
```

| Branch | Wer darf pushen | Zustand | Zweck |
|--------|-----------------|---------|-------|
| `main` | nur per PR aus `develop` | deploybar, getaggt | Produktion / Beta-Release |
| `develop` | per PR aus `lane/*` | **muss bauen** | Integration |
| `lane/<thema>` | Owner der Lane | darf kaputt sein | aktive Arbeit |
| `fix/<thema>` | Owner | kurzlebig | Hotfix direkt auf develop |

**Alte Branches:** `master`, `rpg_impl`, `feature/sidequests`, `cyberpunk`,
`pixel`, `polish1`, `experimental` … — 20 Stück auf dem Remote. Vor Beta einmal
aufräumen: gemergte löschen, Rest in `archive/<name>` umbenennen.

---

## 4. Die Lane-Map — wem gehört was

Der Trick gegen Merge-Konflikte ist nicht Disziplin beim Mergen, sondern
**Disziplin beim Aufteilen**. Jede Lane besitzt einen vertikalen Schnitt durch
den Stack: Backend-Modul + Frontend-Komponenten + Service + Store + Typen.

```
  ┌─ LANE: QUEST ───────────────────────────────────────────────────┐
  │ backend/src/quest/**            frontend/components/quest/**    │
  │ backend/src/geo/**              frontend/components/filters/**  │
  │                                 services/quest.service.ts       │
  │                                 stores/useQuestStore|useFilter* │
  │                                 types/quest.ts                  │
  └─────────────────────────────────────────────────────────────────┘
  ┌─ LANE: SOCIAL ──────────────────────────────────────────────────┐
  │ backend/src/friendship/**       frontend/components/profile/**  │
  │ backend/src/profile-comment/**  frontend/components/chat/**     │
  │ backend/src/message/**          frontend/components/guild/**    │
  │ backend/src/comment/**          services/friend|message|comment │
  │                                 stores/useFriend|useChat|useCom │
  │                                 types/friendship|message|profil │
  └─────────────────────────────────────────────────────────────────┘
  ┌─ LANE: WORLD ───────────────────────────────────────────────────┐
  │ backend/src/track/**            frontend/components/map/**      │
  │ backend/src/treasure/**         frontend/components/compass/**  │
  │                                 frontend/components/route/**    │
  │                                 frontend/components/track/**    │
  │                                 services/track|routing|geoloc.. │
  │                                 stores/useMap|useRoute|useTrack │
  └─────────────────────────────────────────────────────────────────┘
  ┌─ LANE: RPG ─────────────────────────────────────────────────────┐
  │ backend/src/pet/**              frontend/components/pet/**      │
  │ backend/src/achievement/**      frontend/components/dragon/**   │
  │ backend/src/coin/**             frontend/components/logbook/**  │
  │                                 services/pet|coin|achievement   │
  │                                 stores/usePet|useCoin|useAchiev │
  └─────────────────────────────────────────────────────────────────┘
  ┌─ LANE: PLATFORM ────────────────────────────────────────────────┐
  │ backend/src/auth/**             frontend/components/auth/**     │
  │ backend/src/user/**             frontend/components/navigation/ │
  │ backend/src/media/**            frontend/components/layout/**   │
  │ backend/src/vector/**           services/api.ts, auth.service   │
  │ backend/src/health/**           stores/useAuthStore             │
  │ Dockerfile, docker-compose.yml, CI, docs/**                     │
  └─────────────────────────────────────────────────────────────────┘
```

**Faustregel:** Zwei Lanes dürfen gleichzeitig laufen, wenn ihre Kästen sich
nicht überschneiden. `QUEST` + `SOCIAL` = kein Problem. `PLATFORM` + irgendwas
= Vorsicht, PLATFORM fasst geteilte Dinge an (siehe nächster Abschnitt).

---

## 5. Hotspots — die Dateien, die alles kaputtmachen

Es gibt genau elf Dateien, an denen sich parallele Arbeit regelmäßig zerlegt:

```
        ┌───────────────────────────────────────────────────┐
        │              ⚠  HOTSPOT-ZONE  ⚠                   │
        ├───────────────────────────────────────────────────┤
        │  backend/src/app.module.ts        ← jedes Modul   │
        │  backend/src/main.ts              ← Bootstrap     │
        │  backend/src/user/schemas/*.ts    ← alles hängt   │
        │  frontend/src/App.tsx             ← Routen        │
        │  frontend/src/components/layout/AppShell.tsx      │
        │  frontend/src/components/navigation/*.tsx         │
        │  frontend/src/stores/useUIStore.ts ← Sheet-State  │
        │  frontend/src/services/api.ts     ← HTTP-Basis    │
        │  frontend/src/index.css           ← Tailwind      │
        │  docker-compose.yml               ← Ports/Env     │
        │  CLAUDE.md, docs/README.md        ← Doku-Index    │
        └───────────────────────────────────────────────────┘
```

**Protokoll für Hotspots:**

1. **Nur additiv.** Eine Zeile anhängen (Modul in `imports`, Route in `App.tsx`,
   Feld ans Schema). Nie umsortieren, nie formatieren, nie „aufräumen".
2. **Ans Ende.** Neue Einträge kommen unten dran, nicht alphabetisch dazwischen.
   Git löst „beide haben unten was angehängt" viel besser als „beide haben in
   der Mitte eingefügt".
3. **Umbau = eigener PR.** Wer `useUIStore` refactoren oder `app.module.ts`
   sortieren will: im BOARD als `HOTSPOT-LOCK` ankündigen, alle anderen Lanes
   pushen vorher, dann allein und schnell durch.
4. **Schema-Felder** an `user.schema.ts`: immer optional (`required: false`),
   nie ein bestehendes Feld umbenennen ohne Migrations-PR.

---

## 6. Multi-Session-Setup — Worktrees statt Branch-Wechsel

Das eigentliche Problem bei mehreren Claude-Sessions ist nicht Git, sondern der
**gemeinsame Arbeitsbaum**: Session B macht `git checkout`, während Session A
gerade eine Datei liest → A arbeitet ab da an Phantomcode.

Lösung: `git worktree`. Jede Session bekommt ein eigenes Verzeichnis auf der
Platte, aber alle teilen sich dieselbe `.git`-Datenbank.

```
  ~/dev/SIDEQUEST/
  │
  ├── SideQuest/                    ← Haupt-Tree, Branch: develop
  │   └── .git/  ●───────────┐        (Integration, Reviews, Merges)
  │                          │
  └── SideQuest-lanes/       │  gemeinsame Objekt-DB
      ├── quest/  ───────────┤     Branch: lane/quest-search
      ├── social/ ───────────┤     Branch: lane/social-wall
      └── rpg/    ───────────┘     Branch: lane/pet-brain

  Session A ──▶ SideQuest/            :3002 / :5173  DB sidequest
  Session B ──▶ SideQuest-lanes/quest :3012 / :5183  DB sidequest_quest
  Session C ──▶ SideQuest-lanes/social:3022 / :5193  DB sidequest_social
  Session D ──▶ SideQuest-lanes/rpg   :3032 / :5203  DB sidequest_rpg
```

### Port- & DB-Matrix

| Slot | Worktree | Backend `PORT` | Frontend | `MONGODB_URI` (DB-Name) |
|------|----------|----------------|----------|--------------------------|
| 0 | `SideQuest/` | 3002 | 5173 | `sidequest` |
| 1 | `SideQuest-lanes/<a>` | 3012 | 5183 | `sidequest_<a>` |
| 2 | `SideQuest-lanes/<b>` | 3022 | 5193 | `sidequest_<b>` |
| 3 | `SideQuest-lanes/<c>` | 3032 | 5203 | `sidequest_<c>` |

Mongo (`:27017`) und Qdrant (`:6343`) laufen **einmal** aus dem Haupt-Tree
(`docker compose up mongo qdrant`). Isoliert wird über den *Datenbanknamen*,
nicht über eigene Container — sonst frisst dir das RAM den Laptop.

### Lane anlegen

```bash
./scripts/lane.sh new quest-search 1     # Branch + Worktree + .env + Ports
cd ../SideQuest-lanes/quest-search
npm --prefix backend run start:dev &     # :3012
npm --prefix frontend run dev            # :5183
```

Lane wieder abräumen, wenn der PR gemergt ist:

```bash
./scripts/lane.sh drop quest-search
```

`./scripts/lane.sh list` zeigt alle aktiven Lanes samt Ports.

---

## 7. Das BOARD — der Lock-Mechanismus

Git hat keine Sperren, also machen wir sie sichtbar. [`docs/BOARD.md`](./BOARD.md)
ist eine Tabelle im Repo. Wer eine Lane startet, trägt sich ein und **committet
den Eintrag sofort auf develop** (`chore(board): claim lane/x`). Das dauert
20 Sekunden und verhindert Doppelarbeit.

```
   Session startet
        │
        ▼
   ┌────────────────┐   belegt   ┌────────────────────────┐
   │ BOARD lesen    │───────────▶│ andere Lane wählen ODER│
   │ Lane frei?     │            │ warten / absprechen    │
   └────────┬───────┘            └────────────────────────┘
            │ frei
            ▼
   ┌────────────────┐    ┌──────────────┐    ┌─────────────┐
   │ Eintrag +      │───▶│ scripts/     │───▶│ arbeiten    │
   │ push develop   │    │ lane.sh new  │    │ in Worktree │
   └────────────────┘    └──────────────┘    └──────┬──────┘
                                                    │
   ┌────────────────┐    ┌──────────────┐    ┌──────▼──────┐
   │ BOARD-Zeile    │◀───│ PR → develop │◀───│ rebase auf  │
   │ auf DONE       │    │ Review       │    │ develop     │
   └────────────────┘    └──────────────┘    └─────────────┘
```

---

## 8. Session-Protokoll für Claude Code

Das hier ist der Teil, an dem sich **jede Claude-Session** orientiert. Steht
verkürzt auch in `CLAUDE.md`, damit es automatisch geladen wird.

### Beim Start jeder Session

```
  1. git status              → dreckig? Erst klären, nichts draufsetzen.
  2. git branch --show-current
     └─ develop?  → Lane-Arbeit ist hier VERBOTEN, erst lane.sh new
     └─ lane/*?   → weiter
  3. docs/BOARD.md lesen     → welche Lanes laufen sonst noch?
  4. git fetch && git rebase origin/develop
  5. Betroffene Dateien gegen die Lane-Map (Abschnitt 4) prüfen.
     Liegt eine Datei in einer FREMDEN Lane → NICHT anfassen,
     stattdessen im Antworttext melden: "gehört zu lane/social".
```

### Während der Arbeit

```
  ✓ Änderungen bleiben im eigenen Lane-Kasten.
  ✓ Hotspot-Datei nötig? → nur eine additive Zeile, im Commit erwähnen.
  ✓ Nach jedem sinnvollen Schritt committen (nicht erst am Ende).
  ✓ Vor jedem Commit:  npm run build:backend && npm run build:frontend
  ✗ Kein `git checkout <anderer branch>` im geteilten Tree.
  ✗ Kein `git add .`  — immer explizite Pfade.
  ✗ Keine Formatierungs-Sweeps über fremde Dateien.
```

### Beim Beenden

```
  1. Build grün?           npm run build:frontend && npm run build:backend
  2. Alles committet?      git status  → muss leer sein
  3. Push:                 git push -u origin lane/<name>
  4. PR öffnen             gh pr create --base develop
  5. BOARD-Zeile updaten   (Status: IN REVIEW)
```

### Wenn zwei Sessions dieselbe Datei brauchen

```
        Session B will  frontend/src/App.tsx
                │
                ▼
        Gehört zu Lane PLATFORM (Hotspot)
                │
        ┌───────┴────────┐
        │                │
   nur eine Zeile     Umbau nötig
   anhängen?          │
        │             ▼
        ▼        Im BOARD als HOTSPOT-LOCK eintragen,
   einfach machen,  andere Sessions pushen lassen,
   im Commit        dann allein durchziehen,
   erwähnen         Lock wieder freigeben.
```

---

## 9. Merge-Train

```
  Montag        Dienstag       Mittwoch      Donnerstag     Freitag
  ─────────────────────────────────────────────────────────────────
  lane/quest    ──────────────────▶ PR ──▶ review ──▶ merge
  lane/social   ──────▶ PR ──▶ merge
  lane/rpg      ────────────────────────────────▶ PR ──▶ merge
                                                             │
  develop       ●───────●──────────●──────────●──────────●───┴─▶
                                                             │
  main          ─────────────────────────────────────────────●  tag
```

- **Reihenfolge**: Wer zuerst mergt, gewinnt. Der zweite rebased.
- **Rebase, kein Merge, in der Lane**: `git rebase origin/develop`, damit die
  Lane-History linear bleibt.
- **Merge in develop mit `--no-ff`** (bzw. „Create a merge commit" im PR),
  damit man Features als Block sieht und zurückrollen kann.
- **Konflikt in Hotspot-Datei?** Immer *beide* Seiten behalten (es sind
  additive Zeilen), dann bauen, dann committen.

---

## 10. Commit- & PR-Konventionen

```
  <type>(<lane>): <was, im Imperativ, deutsch oder englisch, konsistent>

  feat(social)     neue Funktion
  fix(quest)       Bugfix
  refactor(rpg)    Umbau ohne Verhaltensänderung
  chore(platform)  Build, Deps, Config
  docs(*)          Doku
  hotspot(*)       Änderung an einer geteilten Datei  ← extra Typ, absichtlich
```

`hotspot(...)` als eigener Typ macht in `git log --oneline | grep hotspot`
sofort sichtbar, wer wann an geteilten Dateien war. Das ist Gold beim Debuggen
von „seit gestern startet das Backend nicht mehr".

**PR-Template** (kurz halten):

```markdown
## Lane
lane/quest-search

## Was
Semantische Suche über Qdrant, Fallback auf Substring.

## Hotspots berührt
- backend/src/app.module.ts (+1 Zeile: VectorModule)

## Getestet
- [ ] npm run build:backend
- [ ] npm run build:frontend
- [ ] manuell: Suche mit/ohne REPLICATE_API_TOKEN
```

---

## 11. Anti-Patterns (real passiert, nicht theoretisch)

| Anti-Pattern | Warum es weh tut | Stattdessen |
|--------------|------------------|-------------|
| `git add . && git commit -m "wip"` | 59 Dateien in einem Commit, nicht reviewbar, nicht revertbar | Explizite Pfade, ein Thema pro Commit |
| Zwei Sessions im selben Verzeichnis | Session A liest Dateien, die B gerade weggecheckt hat | Worktrees (Abschnitt 6) |
| Alle Sessions auf DB `sidequest` | Session B löscht Testdaten von A, Schema-Migration killt beide | DB-Name pro Lane |
| „Ich formatier das kurz mit" | 400 Zeilen Diff-Rauschen, Konflikt in jeder Lane | Formatierung nur im eigenen Lane-Kasten |
| Feature-Branch 3 Wochen offen | Rebase wird zur Archäologie | Max. 3–5 Tage, dann mergen |
| Secrets in `docker-compose.yml` | `JWT_SECRET: change-me-in-production` steht heute drin | `.env` + `${VAR}`-Substitution |

---

## Siehe auch

- [BOARD.md](./BOARD.md) — wer arbeitet gerade woran
- [beta-plan.md](./beta-plan.md) — Weg zur Closed Beta
- [production-plan.md](./production-plan.md) — Weg in die Produktion
- [architecture.md](./architecture.md) — was das System eigentlich tut

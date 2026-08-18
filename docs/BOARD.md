# BOARD — wer arbeitet gerade woran

> **Pflicht vor Arbeitsbeginn.** Zeile eintragen, `chore(board): claim lane/x`
> committen, auf `develop` pushen. Dauert 20 Sekunden, spart Stunden.
> Regeln: [workflow.md](./workflow.md)

```
  ┌──────────────────────────────────────────────────────────────┐
  │  FREI      Lane ist nicht belegt, du darfst starten          │
  │  AKTIV     jemand arbeitet gerade — nicht anfassen           │
  │  REVIEW    PR offen, Dateien tabu bis gemergt                │
  │  LOCK      HOTSPOT-LOCK: geteilte Dateien werden umgebaut,   │
  │            ALLE anderen Sessions pushen und warten           │
  │  DONE      gemergt, Worktree kann weg (lane.sh drop)         │
  └──────────────────────────────────────────────────────────────┘
```

## Aktive Lanes

| Status | Lane | Branch | Wer | Slot / Ports | Seit | Betrifft |
|--------|------|--------|-----|--------------|------|----------|
| AKTIV | — | `develop` | Dizzle | 0 / 3002+5173 | — | Layer-0-Aufräumen (siehe workflow.md §2) |
| FREI | quest | `lane/…` | — | 1 / 3012+5183 | — | backend/quest, components/quest, filters |
| FREI | social | `lane/…` | — | 2 / 3022+5193 | — | friendship, message, comment, profile |
| FREI | world | `lane/…` | — | 3 / 3032+5203 | — | track, treasure, map, compass, route |
| FREI | rpg | `lane/…` | — | — | — | pet, achievement, coin, dragon, logbook |
| FREI | platform | `lane/…` | — | — | — | auth, user, media, vector, infra, docs |

## Hotspot-Locks

| Datei(en) | Wer | Von | Bis | Grund |
|-----------|-----|-----|-----|-------|
| — | — | — | — | — |

## Schema-Änderungen (Mongo) — ankündigen!

| Collection | Feld | Art | Wer | Status |
|------------|------|-----|-----|--------|
| — | — | — | — | — |

## Archiv (letzte 10 gemergte Lanes)

| Lane | Wer | Gemergt | PR |
|------|-----|---------|-----|
| — | — | — | — |

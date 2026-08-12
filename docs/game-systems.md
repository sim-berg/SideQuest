# Game-Systeme

SideQuest gamifiziert reale Aktivität über vier ineinandergreifende Systeme:
den **Drachen** (XP-Empfänger), reale **Quests**, **RPG-Zonen** (NPC-Quests) und
ein clientseitiges **Dungeon**-Minispiel mit **Inventar**.

## Drachen & XP

Jeder Nutzer wählt **einmalig** einen von fünf Drachen (`DragonSelection` →
`POST /dragons/choose`). Der Drache ist der zentrale Fortschritts-Empfänger:
sämtliches XP (reale Quests **und** RPG-Quests) läuft durch
`DragonService.recordQuestCompletion(userId, baseXp)`.

### XP-Berechnung pro Abschluss

1. `today` / `yesterday` als `YYYY-MM-DD`.
2. **Erster-Quest-des-Tages-Bonus:** `+15` XP, wenn `lastQuestDate !== today`.
3. **Streak** (ändert sich nur beim ersten Quest des Tages):
   - `lastStreakDate === yesterday` → `streak = min(currentStreak + 1, 5)`
   - bereits heute gezählt → unverändert
   - sonst → Reset auf `1`
4. **Streak-Multiplikator:** `1 + streak * 0.1` (max. ×1.5 bei Streak 5).
5. **Vergebenes XP:** `round((baseXp + firstOfDayBonus) * streakMultiplier)`.

Rückgabe: `{ xpAwarded, bonusBreakdown { baseXp, firstOfDayBonus, streakMultiplier, streak }, dragon }`.
Nutzer **ohne** Drachen erhalten `null` (Quest zählt trotzdem als abgeschlossen).

### Basis-XP nach Schwierigkeit (reale Quests)

| Schwierigkeit | Basis-XP |
|---------------|----------|
| `easy` | 25 |
| `medium` | 50 |
| `hard` | 100 |

### Evolutionsstufen (`calculateEvolutionStage(xp)`)

| Stufe | Ab XP |
|-------|-------|
| `egg` | 0 |
| `hatchling` | 100 |
| `whelp` | 500 |
| `drake` | 2000 |
| `elder_dragon` | 10000 |

### Drachen-Typen

| Type | Name (DE) | Element |
|------|-----------|---------|
| `ember` | Glutwyrm | Feuer |
| `tide` | Wellenreiter | Wasser |
| `thorn` | Dornenschuppe | Erde |
| `gloom` | Schattenklaue | Schatten |
| `spark` | Blitzschuppe | Blitz |

Die Stimmung (`DragonMood`: happy/content/lonely/sad) wird im Frontend aus der
Zeit seit dem letzten Quest abgeleitet.

## Reale Quests

Spielererstellte, ortsbasierte Quests. Lifecycle: **erstellen → akzeptieren →
(vor Ort) abschließen** bzw. **abbrechen**. Der Abschluss ist GPS-verifiziert
(innerhalb 100 m, Haversine). Erstellung über den `CreateQuestPage`-Wizard
(Karten-Pin setzen → mehrstufiges Formular). Details/Endpoints:
[backend.md](./backend.md#quest) und [api-reference.md](./api-reference.md).

## RPG-Zonen & NPC-Quests

Vier thematische Zonen, jede mit eigener Karte, NPCs und Daily-/Weekly-Quests.
Eine Zone ist nur freigeschaltet, wenn in der **echten Umgebung** des Nutzers
passende OSM-Amenities existieren (geprüft über die Overpass-API im
`unlockRadius`; `VITE_RPG_DEBUG='true'` umgeht das).

| Zone | Name (DE) | OSM-Amenities (Auszug) | Radius | NPCs |
|------|-----------|------------------------|--------|------|
| `taverne` | Die Goldene Gans | restaurant, cafe, pub, bar, fast_food | 150 m | Wirt Gottfried, Barde Silvio, Abenteurerin Mira |
| `arena` | Arena des Stahls | gym, sports_centre, fitness_centre, stadium | 200 m | Trainer Björn, Kampfmeisterin Zara |
| `bibliothek` | Bibliothek des Wissens | library, college, university, school, bookshop | 150 m | Bibliothekar Elias, Lehrerin Nadia |
| `tempel` | Tempel der Stille | place_of_worship, park, garden, monastery | 200 m | Priester Benedikt, Seherin Lyra |

### NPC-Quest-Templates

Die Quests sind **statische In-Code-Templates** (`rpg-quest-templates.ts`,
22 Stück, deutschsprachig), jeweils mit `id, zoneType, questType, npcId, npcName,
title, description, requirements, xpReward, cooldownDays`.

- **Daily** (`cooldownDays: 1`) und **Weekly** (`cooldownDays: 7`).
- XP-Bereich: Dailies ~100–200, Weeklies ~600–1000.
- Abschluss (`POST /rpg/quests/complete`) ist **selbst gemeldet**; ein
  `UserRpgQuest`-Record speichert `completedAt` und `expiresAt = now + cooldownDays`.
  Innerhalb des Cooldowns nochmal → `BadRequestException`. XP geht durch dieselbe
  Drachen-Pipeline.

Im RPG-Modus (`RPGGame`) bewegt sich der Spieler top-down über die Zonen-Karte
und spricht NPCs an (`RPGQuestModal`).

## Dungeon-Minispiel (clientseitig)

Vollständig im Browser, kein Backend:

- **`DungeonGenerator.ts`** — Seeded LCG-Generator: 31 Tile-Typen,
  50×36-Grid, Räume, Loot-Räume nach Tier, Gegner-Roster (Guard → Lich),
  deutschsprachige Loot-Tabellen.
- **`DungeonView`** — Stil-Auswahl (kerker/höhle/krypta), Vollbild.
- **`DungeonGame`** — Canvas-Action: Bewegung, Kampf gegen Gegner, Loot, Truhen.
  Truhen-Loot fließt in den **persistierten Inventar-Store** (Stat-Upgrades).
- Steuerung über `TouchControls` (virtueller Joystick + Aktionsbutton, geteilt
  mit dem RPG-Modus).

## Inventar (clientseitig, localStorage)

Waffen, Rüstung und kosmetische Effekte, persistiert unter `sidequest-inventory`
— **ohne Backend**.

- **Waffen** schalten per Level frei: sword (L1), dagger (L3), spear (L6),
  staff (L10). Stats: Schaden / Reichweite / Cooldown.
- **Rüstung:** cloth (L1, def 2), leather (L4, def 6), chain (L7, def 12),
  plate (L12, def 20).
- **Truhen-Upgrade-Chance:** common 0.15, rare 0.40, legendary 0.80; die
  Upgrade-Magnitude steigt mit der Rarität.
- **Effekte** (`EffectType`: glow/particle/trail/aura/enchant) sind rein
  kosmetisch und werden auf Items angewendet.

Anzeige/Verwaltung in `InventorySection` (Tabs Waffen/Rüstung/Effekte mit
Raritäts-Farben), eingebettet in die `ProfilePage`.

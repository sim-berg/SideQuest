# SideQuests (auto-spawnende Mini-Quests)

SideQuests sind kurzlebige Mini-Quests, die das Backend automatisch rund um den
Spieler **spawnt** ("spornt"). Technisch sind sie **dieselbe `Quest`-Entität**
wie user-erstellte Quests — markiert über drei Felder — werden aber getrennt
entdeckt, eigenständig auf der Karte gerendert und feiern Annehmen/Abschluss mit
Vollbild-Animationen.

## Datenmodell-Erweiterung

`Quest` (siehe [data-models.md](./data-models.md)) bekommt:

| Feld | Typ | Bedeutung |
|------|-----|-----------|
| `isSideQuest` | boolean (Default `false`) | markiert auto-gespawnte Quests |
| `expiresAt` | Date \| null | Despawn-Zeitpunkt |
| `templateId` | string \| null | Verweis auf das Spawn-Template |

`GET /api/quests` schließt SideQuests aus (`isSideQuest: { $ne: true }`); sie
haben ihren eigenen Endpoint und Map-Layer.

## Spawning (Backend)

Templates liegen statisch in `backend/src/quest/sidequest-templates.ts`
(`SIDEQUEST_TEMPLATES`, deutschsprachig: Titel, Beschreibung, Kategorie,
Schwierigkeit, Reward, Flavor-NPC, `ttlMinutes`).

**Endpoint:** `GET /api/sidequests/nearby?lat&lng&radius?` (öffentlich).
`QuestService.getNearbySideQuests(lat, lng, radius?)`:

1. **Despawn:** löscht abgelaufene, **nicht angenommene** SideQuests.
2. **Laden:** offene (nicht angenommen, nicht abgeschlossen, nicht abgelaufen)
   SideQuests im Radius.
3. **Auffüllen:** spawnt neue aus zufälligen Templates an zufälligen Punkten im
   Ring `[0.15 km, radius]` (flächengleich verteilt, Haversine-genau), bis
   `SIDEQUEST_TARGET_ACTIVE` (6) erreicht ist; `expiresAt = now + ttlMinutes`.
4. **Rückgabe:** offene + frisch gespawnte SideQuests im Radius.

Konfiguration (`quest.service.ts`): `SIDEQUEST_SPAWN_RADIUS_KM = 1.2`,
`SIDEQUEST_MIN_OFFSET_KM = 0.15`, `SIDEQUEST_TARGET_ACTIVE = 6`.

**Annehmen / Abschließen / Aufgeben** nutzen die bestehenden Quest-Endpoints
(`POST /api/quests/:id/accept|complete|abandon`) — inkl. der 100-m-GPS-Prüfung
und der Drachen-XP-Pipeline.

## Frontend

- **`services/sidequest.service.ts`** — `fetchNearbySideQuests(lat, lng)`.
- **`hooks/useSideQuestSpawner.ts`** — pollt alle 30 s `nearby` an der
  GPS-Position, spiegelt das Ergebnis in den Store, prunt clientseitig
  abgelaufene Spawns alle 5 s. **Merge-Logik:** vom Nutzer angenommene, noch
  laufende SideQuests bleiben auf der Karte, obwohl der stateless Endpoint sie
  ausschließt.
- **`stores/useSideQuestStore.ts`** — `sideQuests`, `seenIds` (für die
  Spawn-Animation), Update/Remove-Helfer.
- **`components/map/SideQuestMarkerLayer.tsx` + `SideQuestMarker.tsx`** —
  eigener (nicht geclusterter) Layer mit Spawn-Pop (Spring-Scale), pulsierender
  Aura und ✨-Badge. Versteckt abgeschlossene und von anderen angenommene Spawns.
- **Klick** auf einen Marker öffnet dieselbe BottomSheet → `QuestInfoPage`-Strecke
  wie normale Quests (mit ✨-SideQuest-Badge).

## Animationen

`stores/useCelebrationStore.ts` ist eine Queue; `components/effects/CelebrationOverlay.tsx`
rendert sie nacheinander als Vollbild-Overlays (mit `motion`). Ausgelöst in
`QuestInfoPage` — für **alle** Quests, nicht nur SideQuests:

| Typ | Auslöser | Effekt |
|-----|----------|--------|
| `accept` | Quest angenommen | Strahlen-Burst + „Quest angenommen!" + Titel |
| `complete` | Quest abgeschlossen | Konfetti + „Geschafft!" + animierter XP-Counter + Bonus-Aufschlüsselung |
| `evolution` | Drache erreicht neue Stufe (Vergleich `evolutionStage` vor/nach Abschluss) | Strahlen + Emoji-Morph alte→neue Stufe + Stufen-Label |
| `achievement` | Errungenschaft freigeschaltet | Strahlen + Konfetti + das (KI-)Badge-Bild + Titel/Beschreibung |

Der frühere `XpToast` ist durch die `complete`-Celebration ersetzt (Datei bleibt
ungenutzt im Repo).

## SideQuest-Modal (Google-Maps-Stil)

Klick auf einen SideQuest-Marker öffnet **nicht** mehr das generische BottomSheet,
sondern `components/sidequest/SideQuestModal.tsx`: eine von unten einfahrende Karte
mit Titel/Geber, Info-Chips (Distanz, XP, Reward, Ablauf) und einer Reihe **runder
Action-Buttons** (Icons aus `lucide-react`):

- **Route** (`Navigation`) – öffnet Google-Maps-Navigation zum Ziel
- **Annehmen** (`Swords`) bzw. **Abschließen** (`CircleCheck`) + **Aufgeben** (`Flag`)
- **Teilen** (`Share2`) – `navigator.share` / Clipboard
- **Schließen** (`X`)

Die Auswahl liegt in `useSideQuestStore.selected`; der Marker ruft `setSelected(quest)`.

## Achievements (Relation zu SideQuests, KI-Badges)

Jedes SideQuest-Template ist über den Katalog
(`backend/src/achievement/achievement-catalog.ts`) mit **genau einer Errungenschaft**
verknüpft (`ach_<templateId>`), plus Meilensteine (`ach_first_sidequest`,
`ach_daily_streak`). Beim Abschluss einer SideQuest (Karte **oder** Daily) vergibt
`AchievementService.awardForTemplate` die passende(n) Errungenschaft(en) an den
Nutzer (`UserAchievement`-Join, idempotent über Unique-Index).

**Bildgenerierung (`replicate.service.ts`):**

- Mit `REPLICATE_API_TOKEN`: transparentes PNG via Replicate (Default-Modell
  `fofr/sticker-maker`, konfigurierbar über `REPLICATE_MODEL`). Download nach
  `backend/uploads/achievements/<key>.<ext>`.
- Ohne Token / bei Fehler: deterministisches **transparentes SVG-Badge** (sofort).
- Ablauf: Definition wird beim ersten Verdienen mit Sofort-SVG angelegt; liegt ein
  Token vor, wird das KI-Bild **im Hintergrund** generiert und ersetzt das SVG
  (`aiGenerated`-Flag) — die Award-Response blockiert nie auf Replicate.

Bilder werden statisch unter `/uploads` ausgeliefert (`main.ts`
`useStaticAssets`); absolute URLs werden über `APP_URL` gebaut.

**Endpoints:** `GET /api/achievements/mine`, `GET /api/achievements/catalog` (beide JWT).

## Daily SideQuests (pro Nutzer)

`DailySideQuest`-Schema: pro Nutzer wird täglich ein Satz von **3** SideQuests aus
dem Template-Pool generiert (`getDailySideQuests`, Tagesbucket `YYYY-MM-DD`).
Abschluss per Selbstmeldung (kein GPS) über
`POST /api/sidequests/daily/:id/complete` → Drachen-XP + Achievement(s).
`GET /api/sidequests/daily` liefert/erzeugt das heutige Set (JWT).

## Logbuch

`components/logbook/LogbookPage.tsx` (Overlay, geöffnet über den `LogbookFAB`,
`BookOpen`-Icon unten rechts auf der Karte) zeigt:

- **Statistik:** XP (Drache), Anzahl Errungenschaften, abgeschlossene Quests
- **Heutige SideQuests:** Daily-Liste mit „Erledigt"-Buttons
- **Aktive SideQuests:** vom Nutzer angenommene Karten-SideQuests (Klick → Modal)
- **Errungenschaften:** Badge-Galerie (KI-/SVG-Bilder)

So sammelt der Nutzer sichtbar **XP, Achievements und (Side)Quests** an einem Ort.

## Geänderte / neue Dateien

**Backend:** `quest/schemas/quest.schema.ts`, `quest/quest.service.ts`,
`quest/quest.module.ts`, `app.module.ts`, `main.ts`, **neu**
`quest/sidequest-templates.ts`, `quest/sidequest.controller.ts`,
`quest/schemas/daily-sidequest.schema.ts`, sowie das gesamte
`achievement/`-Modul (`achievement.module|service|controller.ts`,
`replicate.service.ts`, `achievement-catalog.ts`,
`schemas/achievement.schema.ts`, `schemas/user-achievement.schema.ts`).

**Frontend:** `types/quest.ts`, `App.tsx`, `components/map/QuestMap.tsx`,
`components/quest/QuestInfoPage.tsx`, `components/quest/QuestDetail.tsx`,
`services/quest.service.ts`, **neu** `services/sidequest.service.ts`,
`services/achievement.service.ts`, `types/sidequest.ts`, `types/achievement.ts`,
`stores/useSideQuestStore.ts`, `stores/useCelebrationStore.ts`,
`stores/useAchievementStore.ts`, `stores/useDailySideQuestStore.ts`,
`stores/useLogbookStore.ts`, `hooks/useSideQuestSpawner.ts`,
`components/map/SideQuestMarkerLayer.tsx`, `components/map/SideQuestMarker.tsx`,
`components/sidequest/SideQuestModal.tsx`, `components/logbook/LogbookPage.tsx`,
`components/logbook/LogbookFAB.tsx`, `components/effects/CelebrationOverlay.tsx`.

**Dependencies:** `lucide-react` (Frontend), `replicate` (Backend).

# Architektur

## Überblick

SideQuest besteht aus zwei Anwendungen in einem Monorepo:

- **`frontend/`** — React-19-SPA (Vite), mobile-first, deutschsprachige UI.
- **`backend/`** — NestJS-11-REST-API mit MongoDB-Persistenz und einem
  Socket.IO-Gateway für Echtzeit-Features.

```
┌─────────────────────────────────────────────────────────┐
│                       Frontend (SPA)                      │
│  React 19 · Zustand · MapLibre GL · socket.io-client     │
│                                                           │
│  Views (state-driven, kein Router):                      │
│   map · rpg · dungeon · chat · profile  (+ Overlays)     │
└───────────────┬───────────────────────┬─────────────────┘
                │ REST (fetch, /api)     │ WebSocket (/socket.io)
                ▼                        ▼
┌─────────────────────────────────────────────────────────┐
│                      Backend (NestJS)                     │
│  ValidationPipe · globaler Prefix /api · CORS · Cookies  │
│                                                           │
│  Module: auth · user · quest · geo · message ·           │
│          dragon · rpg · health                           │
│  MessageGateway (Socket.IO)                              │
└───────────────┬─────────────────────────────────────────┘
                │ Mongoose
                ▼
        ┌───────────────┐        ┌──────────────────────┐
        │   MongoDB     │        │  In-Memory (Gateway) │
        │ User, Quest,  │        │  Live-Standorte,     │
        │ Message,      │        │  Socket-Map          │
        │ Dragon,       │        │  (nie persistiert)   │
        │ UserRpgQuest  │        └──────────────────────┘
        └───────────────┘
```

## Datenfluss: Quest abschließen (Beispiel)

1. Nutzer akzeptiert eine Quest → `POST /api/quests/:id/accept` (JWT).
2. Vor Ort tippt er auf „Abschließen" → Frontend sendet die aktuellen
   GPS-Koordinaten an `POST /api/quests/:id/complete` `{ lat, lng }`.
3. Backend prüft per **Haversine**, dass der Nutzer innerhalb von 100 m ist
   (sonst `BadRequestException`).
4. Basis-XP nach Schwierigkeit (`easy 25 / medium 50 / hard 100`) geht durch
   `DragonService.recordQuestCompletion` — dort werten Tages-Bonus und
   Streak-Multiplikator das XP auf.
5. `questsCompleted` des Users wird inkrementiert; Response: `{ quest, xpResult }`.
6. Frontend zeigt einen `XpToast` mit der Bonus-Aufschlüsselung und aktualisiert
   den Drachen-Store.

## Modulabhängigkeiten (Backend)

```
quest    → geo, dragon, user
dragon   → user
rpg      → dragon
message  → user, geo, jwt
auth     → user, jwt, passport
geo      → (stateless utility, kein Controller)
health   → (Controller direkt am AppModule)
```

Der zentrale **XP-Pipeline-Punkt** ist `DragonService.recordQuestCompletion`:
sowohl reale Quests (`quest.complete`) als auch RPG-NPC-Quests
(`rpg.quests/complete`) laufen hier zusammen, damit Tages-/Streak-Boni einheitlich
greifen. Nutzer ohne Drachen schließen Quests trotzdem ab, erhalten aber kein
Drachen-XP (`recordQuestCompletion` liefert `null`).

## State-Management (Frontend)

Es gibt **keinen Router**. Die aktive Ansicht steht in `useUIStore.activeTab`
(`map | chat | create | profile | rpg | dungeon`). Der Map-Tab bleibt immer
gemountet (nur `hidden`), um den Kartenzustand zu erhalten; andere Tabs werden
bedingt gerendert. Overlays (`QuestInfoPage`, `CreateQuestPage`, `AuthPrompt`,
`DragonSelection`, Chat-Wrapper) liegen darüber.

Auth ist **optional**: Die App ist ohne Login voll nutzbar (Karte/Quests
ansehen). Geschützte Tabs (`chat`, `create`, `profile`, `rpg`, `dungeon`) lösen
einen `AuthPrompt` aus. Details siehe [frontend.md](./frontend.md).

## Persistenz

- **MongoDB (Mongoose):** `User`, `Quest`, `Message`, `Dragon`, `UserRpgQuest` —
  alle mit `{ timestamps: true }`.
- **In-Memory (nur im `MessageGateway`):** Live-Standorte der Nutzer und die
  Socket-Zuordnung. Bewusst flüchtig, wird nie in die DB geschrieben.
- **localStorage (nur Frontend):** das Inventar (`sidequest-inventory`) und die
  Dark-Mode-Präferenz (`sidequest-dark`).

Geo-Radius-Filterung läuft **applikationsseitig** per Haversine (kein
geografischer DB-Index). Siehe [backend.md](./backend.md#geo).

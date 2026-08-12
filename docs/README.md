# SideQuest — Dokumentation

SideQuest ist eine mobile-first Web-App, die Quests in die echte Welt bringt.
Nutzer erkunden eine interaktive OpenStreetMap-Karte, entdecken Quests in ihrer
Umgebung, schließen sie GPS-verifiziert ab und sammeln dabei XP für ihren
persönlichen Drachen-Begleiter. Dazu kommen ein RPG-Modus mit ortsbasierten
NPC-Quests, ein prozedural generiertes Dungeon-Minispiel, Echtzeit-Chat und
Standort-Sharing zwischen Spielern.

## Inhalt dieser Doku

| Dokument | Inhalt |
|----------|--------|
| [getting-started.md](./getting-started.md) | Setup, Installation, Dev-Server, Umgebungsvariablen |
| [architecture.md](./architecture.md) | Gesamtarchitektur, Datenfluss, Modulabhängigkeiten |
| [frontend.md](./frontend.md) | React-App: Navigation, Stores, Services, Hooks, Komponenten |
| [backend.md](./backend.md) | NestJS-API: Module, Business-Logik, Auth, Persistenz |
| [api-reference.md](./api-reference.md) | Vollständige REST-Endpoint- und WebSocket-Referenz |
| [data-models.md](./data-models.md) | Schemas, Typen und Enums (Frontend + Backend) |
| [game-systems.md](./game-systems.md) | Drachen, XP/Streaks, RPG-Zonen, Dungeon, Inventar |
| [sidequests.md](./sidequests.md) | Auto-spawnende SideQuests + Game-Animationen |
| [realtime.md](./realtime.md) | Socket.IO: Chat, Typing, Standort-Sharing |
| [sidequest_master_plan.md](./sidequest_master_plan.md) | Produkt-Vision & Roadmap (Brainstorm) |
| [blockchain-vision.md](./blockchain-vision.md) | Web3-Vision: on-chain Tausch-Ökonomie, Stack, Hybrid-Architektur |
| [smart_contract/web3-speicher-tangle-und-methoden.md](./smart_contract/web3-speicher-tangle-und-methoden.md) | Smart Contracts & Tangle erklärt, On-chain- vs. Mesh-Speicher, effektivste Methoden + Beispiel-`.sol` |
| [blockchain-backend-integration.md](./blockchain-backend-integration.md) | Architektur des `chain`-Backend-Moduls: Indexer, Oracle, Relayer, Mesh, Schemas, Flows |
| [blockchain-rollout-plan.md](./blockchain-rollout-plan.md) | Phasenweiser Web3-Rollout, Architektur-Entscheidungen (ADR) & Risiken |

## Tech-Stack auf einen Blick

| Layer | Technologie |
|-------|-------------|
| Frontend | React 19, TypeScript 5.9, Vite 7 |
| Karte | MapLibre GL JS (`react-map-gl`), OpenFreeMap-Tiles, Supercluster |
| Styling | Tailwind CSS 4 (CSS-first, kein `tailwind.config.js`) |
| State | Zustand 5 |
| Realtime | Socket.IO (Client + `@nestjs/websockets` Gateway) |
| Backend | NestJS 11, TypeScript |
| Datenbank | MongoDB (Mongoose) |
| Auth | JWT (Access-Token in-memory + Refresh-Token httpOnly-Cookie), bcrypt |

## Schnellstart

```bash
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
npm run dev          # Frontend (5173) + Backend (3000) parallel
```

Details siehe [getting-started.md](./getting-started.md).

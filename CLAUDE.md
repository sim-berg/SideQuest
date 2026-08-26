# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠ Read this first — parallel work rules

Two humans (`Seakuh`, `sim-berg`) and often several Claude sessions work in this
repo at the same time. The full rules live in **[docs/workflow.md](./docs/workflow.md)**;
the live claim board is **[docs/BOARD.md](./docs/BOARD.md)**. Short version:

**At the start of every session:**

1. `git status` — dirty tree? Say so and clarify before building on top of it.
2. `git branch --show-current`
   - on `develop` → feature work is **not** allowed here. Use
     `./scripts/lane.sh new <name> <slot 1..3>` to get an isolated worktree,
     or ask the user whether to work on develop anyway.
   - on `lane/*` → proceed.
3. Read `docs/BOARD.md` — which lanes are `AKTIV`/`LOCK` right now?
4. `git fetch && git rebase origin/develop`.
5. Check the files you are about to touch against the **lane map**
   (workflow.md §4). A file owned by someone else's lane: do **not** edit it —
   report it instead ("that belongs to lane/social").

**While working:**

- Stay inside your lane's slice: backend module + matching frontend components +
  service + store + types.
- Hotspot files (`backend/src/app.module.ts`, `backend/src/main.ts`,
  `frontend/src/App.tsx`, `frontend/src/components/layout/AppShell.tsx`,
  `frontend/src/components/navigation/*`, `frontend/src/stores/useUIStore.ts`,
  `frontend/src/services/api.ts`, `frontend/src/index.css`,
  `backend/src/user/schemas/user.schema.ts`, `docker-compose.yml`) — **append
  only, one line, at the end.** No reordering, no reformatting, no cleanup
  sweeps. Prefix such commits with `hotspot(...)`.
- New fields on `user.schema.ts` are always optional. Renaming a field needs its
  own migration PR announced on the BOARD.
- Never `git add .` — always explicit paths. Never `git checkout <other-branch>`
  in a shared worktree (another session may be reading those files).
- Commit format: `<type>(<lane>): <what>` — e.g. `feat(quest): …`,
  `fix(social): …`, `hotspot(platform): register VectorModule`.

**Before finishing:**

`npm run build:frontend && npm run build:backend` → both green, `git status`
clean, push `lane/<name>`, open a PR against `develop`, update the BOARD row.

**Planning docs** (read before proposing scope):
[beta-plan.md](./docs/beta-plan.md) (what ships in the closed beta) ·
[production-plan.md](./docs/production-plan.md) (hardening for v1.0).
Anything marked "nach der Beta" (blockchain, dungeon, guilds) stays behind a
feature flag — don't pull it forward without being asked.

## Quick Start

The entire codebase uses a **monorepo structure** with root-level npm scripts that orchestrate both frontend and backend:

```bash
npm install                # Install all dependencies (root + frontend + backend)
npm run dev                # Start both frontend (5173) and backend (3000) concurrently
npm run dev:frontend       # Start only the React dev server
npm run dev:backend        # Start only the NestJS backend in watch mode
npm run build:frontend     # Production build for React
npm run build:backend      # Production build for NestJS
docker-compose up          # Run the full stack with MongoDB in containers
```

## Frontend Development

**Location:** `frontend/`
**Tech:** React 19 + TypeScript + Vite + MapLibre GL + Zustand
**Port:** 5173

```bash
cd frontend && npm run dev    # Start Vite dev server
cd frontend && npm run lint   # Run ESLint
cd frontend && npm run build  # Production build (type-checks first)
```

## Backend Development

**Location:** `backend/`
**Tech:** NestJS 11 + TypeScript + Jest
**Port:** 3000 (`/api` global prefix)

```bash
cd backend && npm run start:dev       # Start with watch mode
cd backend && npm run test            # Run unit tests
cd backend && npm run test:watch      # Run tests in watch mode
cd backend && npm run test:cov        # Tests with coverage report
cd backend && npm run test:e2e        # Run end-to-end tests
cd backend && npm run build           # Compile TypeScript to dist/
cd backend && npm run lint            # Lint and auto-fix
cd backend && npm run format          # Format with Prettier
```

## Architecture Overview

### Monorepo Structure

```
SideQuest/
├── frontend/              React SPA
├── backend/               NestJS API
├── package.json           Root orchestrator (concurrently)
└── docker-compose.yml     Full stack with MongoDB
```

### Frontend Architecture (src/)

The frontend is organized into clear, single-responsibility layers:

**State Management (Zustand):**
- `stores/useQuestStore` — Quest list, selected quest, loading state
- `stores/useMapStore` — Map viewport, user GPS location, errors
- `stores/useFilterStore` — Active categories, distance radius, toggles (paid/timed)
- `stores/useUIStore` — Bottom sheet open/close state, dark mode preference

**Data Flow:**
1. `useUserLocation` hook watches browser Geolocation API → updates `useMapStore` with user position
2. `quest.service` fetches mock data (or API via `VITE_API_URL`) → `useQuestStore`
3. `useFilteredQuests` derives visible quests from quest data + active filters + user location
4. `QuestMarkerLayer` converts filtered quests to GeoJSON, applies Supercluster clustering, renders via `react-map-gl`
5. Clicking a marker → sets `selectedQuest` in `useQuestStore` → bottom sheet opens
6. `QuestDetail` displays quest with distance calculated via Haversine formula

**Component Structure:**
- `layout/` — Page-level wrappers
- `map/` — All map-related: `QuestMap`, markers, clustering, user location
- `filters/` — Filter UI: category chips, distance selector, toggles
- `quest/` — Quest detail: bottom sheet, detail card, badges, displays
- `common/` — Reusable utilities

**Key Points:**
- By default uses **local mock data** (20 quests around Berlin)
- To connect to backend, uncomment `VITE_API_URL` in `frontend/.env.development`
- Map uses **OpenFreeMap tiles** (free, no API key required)

### Backend Architecture (src/)

**Module Structure:**
- `QuestModule` — Quest CRUD, filtering, validation (imports `GeoModule`)
- `GeoModule` — Haversine distance calculations for geo-filtering
- `HealthController` — Health check endpoint (registered in `AppModule`)

**Quest Service Design:**
Currently uses **in-memory array** initialized from `mock-quests.data.ts`. The service is architected for easy MongoDB migration:
- Current: `this.quests.filter(...)` → Future: `this.questModel.find(...)`
- Current: `this.quests.push(quest)` → Future: `this.questModel.create(quest)`
- Current: `this.quests.find(...)` → Future: `this.questModel.findById(...)`

**DTO Validation:**
All query parameters and request bodies go through `class-validator` DTOs:
- `CreateQuestDto` — Validates POST body (title, description, lat, lng, category, optional reward/timeLimit)
- `QuestFilterDto` — Validates GET query params (categories, radius, lat, lng, paidOnly, timedOnly)

**Configuration:**
- Global prefix: `/api`
- Port: 3000 (or `PORT` env var)
- CORS: `http://localhost:5173` in dev, configurable via `CORS_ORIGIN`
- Validation: `transform: true`, `whitelist: true` (strips unknown props)

## API Endpoints Summary

**Health:**
- `GET /api/health` → `{ status: "ok", timestamp: "..." }`
- `GET /api/health/vector` — Qdrant index health (indexed vs. pending quests)

**Quests:**
- `GET /api/quests` — List with optional filtering
- `GET /api/quests/:id` — Get single quest
- `GET /api/quests/search?q=…` — Semantic search (see Vector Search below)
- `GET /api/quests/:id/similar` — Semantically closest quests
- `POST /api/quests` — Create (expects validated DTO); returns `409` on a
  near-duplicate nearby, override with `"force": true`

**Filters (GET /api/quests):**
- `categories` — Comma-separated: `sport,social,adventure,skill,mystery`
- `radius` — Distance in km (requires `lat` and `lng`)
- `lat`, `lng` — User coordinates
- `paidOnly` — Boolean, include only quests with reward
- `timedOnly` — Boolean, include only quests with time limit

## Vector Search

Every quest is embedded (Replicate `multilingual-e5-large`, 1024 dims) and
mirrored into Qdrant. Full details: **[docs/vector-search.md](./docs/vector-search.md)**.

- Module: `backend/src/vector/` — `EmbeddingService` (+ Mongo-backed cache),
  `QdrantService` (REST over fetch), `QuestVectorService` (reconciler + search).
- **Indexing is reconciler-driven, not call-site-driven**: a quest counts as
  dirty while `vectorAt < updatedAt`, so any `save()` anywhere re-indexes it.
  `indexNow()` at write sites is a latency optimization only.
- A periodic two-way sweep deletes orphaned points and re-queues quests that
  vanished from the index, so the index heals itself after a snapshot restore
  or a dropped collection.
- Embedded text is `title + description + address` — the category is
  deliberately excluded (it flattened ranking; it's a payload filter instead).
- **Changing `buildText` or `payloadFor` requires bumping `INDEX_VERSION`** in
  `quest-vector.service.ts`; the sweep then re-embeds every existing quest.
- Without `QDRANT_URL` / `REPLICATE_API_TOKEN` everything still boots: search
  degrades to substring matching, `similar` returns `[]`, no duplicate check.
- Local Qdrant runs on **6343** (6333 is taken by other projects on this box).
  Give each worktree its own `QDRANT_COLLECTION`.

## Quest Categories

| Value | Label | Icon | Color |
|-------|-------|------|-------|
| `sport` | Sport | Running | Green |
| `social` | Social | People | Blue |
| `adventure` | Abenteuer | Swords | Amber |
| `skill` | Skill | Brain | Purple |
| `mystery` | Mystery | Crystal Ball | Red |

## Environment Variables

**Frontend (`frontend/.env.development`):**
- `VITE_API_URL` — Backend API base URL (empty = use local mock data)

**Backend (`docker-compose.yml` or `.env`):**
- `PORT` — Server port (default: 3000)
- `MONGODB_URI` — MongoDB connection string (dev only for now)
- `JWT_SECRET` — Secret for JWT signing (change in production)
- `CORS_ORIGIN` — Allowed CORS origins

## Docker Compose

The `docker-compose.yml` orchestrates:
- **mongo:7** — Database service
- **backend** — NestJS API (port 3000 internally)
- **frontend** — React build served on port 5173

Each service auto-restarts unless stopped. MongoDB data persists in a named volume `mongo-data`.

## Development Notes

**Frontend to Backend Connection:**
1. Backend must be running: `npm run dev:backend`
2. Uncomment `VITE_API_URL=http://localhost:3000/api` in `frontend/.env.development`
3. Restart frontend dev server to apply env change

**Testing Backend:**
- Unit tests: `npm run test` in `backend/`
- Watch mode: `npm run test:watch`
- With coverage: `npm run test:cov`
- E2E tests: `npm run test:e2e`

**Type Safety:**
- Frontend uses TypeScript 5.9 with strict mode
- Backend uses TypeScript 5.7
- Always run `npm run build` or type-check before merging

**Linting & Formatting:**
- Frontend: `npm run lint` (ESLint)
- Backend: `npm run lint` (ESLint with auto-fix) + `npm run format` (Prettier)

## Known Patterns

- **State updates**: All Zustand stores use shallow state updates — avoid unnecessary object spreading
- **Filtering logic**: Both frontend (derived state) and backend (query filtering) implement the same logic for consistency
- **Distance calculations**: Haversine formula used in both frontend (`distance.service.ts`) and backend (`geo.service.ts`)
- **Mock data**: 20 sample quests around Berlin in both `frontend/data/mock-quests.ts` and `backend/src/quest/data/mock-quests.data.ts`

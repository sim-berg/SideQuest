# SideQuest - Project Context for Claude

## What is this?

A mobile-first web app where users explore real-world quests on an interactive OpenStreetMap. Users see their location, nearby quest markers, filter by category/distance, view quest details in a bottom sheet, and open a full info page.

## Tech Stack

- **Frontend**: React 19 + TypeScript 5.9 + Vite 7
- **Map**: MapLibre GL JS via `react-map-gl/maplibre`, tiles from OpenFreeMap (no API key)
- **Clustering**: `supercluster` + `use-supercluster`
- **State**: Zustand (4 stores: quest, map, filter, UI)
- **Bottom Sheet**: `react-modal-sheet` (requires `motion` peer dep)
- **Styling**: Tailwind CSS 4 via `@tailwindcss/vite` plugin, dark mode via `@custom-variant dark` with class strategy
- **Backend**: NestJS 11 + TypeScript 5.7
- **Validation**: `class-validator` + `class-transformer` for DTOs
- **Data**: In-memory mock data (MongoDB-ready architecture)

## Project Structure

```
SideQuest/
├── package.json           # Root: concurrently runs frontend + backend
├── frontend/              # Vite + React SPA
│   └── src/
│       ├── types/         # Quest, Category (const object, NOT enum), QuestGiver, QuestFilter
│       ├── constants/     # Category metadata, map defaults
│       ├── stores/        # useQuestStore, useMapStore, useFilterStore, useUIStore
│       ├── services/      # geolocation, quest (mock/API toggle), distance (haversine)
│       ├── hooks/         # useUserLocation, useFilteredQuests, useQuestDistance
│       ├── components/    # layout/, map/, filters/, quest/, common/
│       ├── data/          # mock-quests.ts (20 quests around Berlin)
│       └── utils/         # cn() helper, format functions
└── backend/               # NestJS REST API
    └── src/
        ├── quest/         # Module, Controller, Service, DTOs, Enums, Interfaces, Mock Data
        ├── geo/           # GeoService with haversine
        └── health/        # Health check controller
```

## Important Conventions

### TypeScript
- Frontend uses `erasableSyntaxOnly: true` in tsconfig -- **NO enums allowed** in frontend code. Use `as const` objects with derived union types instead:
  ```ts
  export const Category = { SPORT: 'sport', ... } as const;
  export type Category = (typeof Category)[keyof typeof Category];
  ```
- Backend uses standard NestJS TypeScript enums (different tsconfig, enums are fine there).
- Frontend uses `verbatimModuleSyntax: true` -- use `import type` for type-only imports.

### Styling
- Tailwind CSS v4 with `@tailwindcss/vite` plugin (NOT PostCSS config).
- Custom theme colors defined in `src/index.css` under `@theme` (e.g., `--color-quest-sport`).
- Dark mode via class strategy: `@custom-variant dark (&:where(.dark, .dark *))`.
- `react-modal-sheet` has its own default styles that MUST be overridden with explicit `style={{ backgroundColor }}` on Container, Header, and Content.

### State
- Zustand stores are small and focused. Don't merge them.
- `useFilteredQuests` hook derives the visible quest list reactively from quest + filter + location stores.

### Map
- `react-map-gl/maplibre` requires wrapping with `<MapProvider>` in App.tsx.
- Marker clustering via `use-supercluster` -- points must be GeoJSON Features.
- `react-modal-sheet` snap points must be ascending starting from 0: `[0, 0.35, 0.6]`.

### Backend
- All routes prefixed with `/api` (set in `main.ts`).
- CORS allows `http://localhost:5173`.
- `QuestService` uses in-memory array -- designed to swap to MongoDB with minimal changes.
- Backend imports use `.js` extensions (NestJS `nodenext` module resolution).

## Commands

```bash
# Root: start both
npm run dev

# Frontend only
cd frontend && npm run dev          # dev server at :5173
cd frontend && npm run build        # type-check + production build

# Backend only
cd backend && npm run start:dev     # watch mode at :3000
cd backend && npm run build         # compile to dist/

# Type checking
cd frontend && npx tsc --noEmit
cd backend && npx tsc --noEmit
```

## API Endpoints

- `GET  /api/health` -- health check
- `GET  /api/quests` -- list quests (query params: categories, radius, lat, lng, paidOnly, timedOnly)
- `GET  /api/quests/:id` -- single quest
- `POST /api/quests` -- create quest

## Frontend-Backend Toggle

Frontend uses mock data by default. To connect to backend, uncomment in `frontend/.env.development`:
```
VITE_API_URL=http://localhost:3000/api
```

## Quest Data Model

```ts
interface Quest {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  category: Category;          // 'sport' | 'social' | 'adventure' | 'skill' | 'mystery'
  questGiver: { name: string; avatar?: string };
  reward?: number;
  timeLimit?: string;          // ISO 8601
  createdAt: string;           // ISO 8601
}
```

## Key Components

- `QuestMarkerLayer` -- most complex component: converts quests to GeoJSON, runs supercluster, renders markers/clusters
- `BottomSheet` -- quest preview on marker click, uses `react-modal-sheet` with explicit bg overrides
- `QuestInfoPage` -- full-screen detail page opened from "Mehr Infos" button in bottom sheet
- `FilterBar` -- horizontal scrollable filter chips above the map

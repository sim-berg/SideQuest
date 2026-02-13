# SideQuest Frontend

React 19 single-page application with an interactive OpenStreetMap, quest markers, filtering, and a swipeable bottom sheet detail view.

## Tech Stack

- **React 19** with TypeScript 5.9
- **Vite 7** -- dev server and bundler
- **MapLibre GL JS** via `react-map-gl` -- map rendering with OpenFreeMap tiles
- **Supercluster** -- marker clustering at lower zoom levels
- **Zustand** -- lightweight state management (4 stores)
- **react-modal-sheet** + **Motion** -- swipeable bottom sheet with snap points
- **Tailwind CSS 4** -- utility-first styling with dark mode support

## Getting Started

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. By default uses local mock data (20 quests around Berlin).

### Connect to Backend

Uncomment the line in `.env.development`:

```env
VITE_API_URL=http://localhost:3000/api
```

Then restart the dev server. The app will fetch quests from the NestJS backend instead of local mock data.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Architecture

```
src/
├── types/                  # TypeScript interfaces and types
│   ├── quest.ts            # Quest, Category, QuestFilter
│   └── map.ts              # UserLocation, MapViewState
├── constants/              # Static configuration
│   ├── categories.ts       # Category labels, colors, icons
│   └── map.ts              # Default viewport, tile URLs, distance options
├── stores/                 # Zustand state management
│   ├── useQuestStore.ts    # Quest list, selected quest, loading
│   ├── useMapStore.ts      # Viewport, user location, location error
│   ├── useFilterStore.ts   # Active categories, distance, toggles
│   └── useUIStore.ts       # Bottom sheet state, dark mode
├── services/               # Business logic, external APIs
│   ├── geolocation.service.ts  # Browser Geolocation API wrapper
│   ├── quest.service.ts        # Fetch quests (mock or API)
│   └── distance.service.ts     # Haversine distance formula
├── hooks/                  # React hooks
│   ├── useUserLocation.ts      # Geolocation -> map store bridge
│   ├── useFilteredQuests.ts    # Derived filtered quest list
│   └── useQuestDistance.ts     # Distance from user to a quest
├── components/
│   ├── layout/
│   │   └── AppShell.tsx        # Full-screen layout wrapper
│   ├── map/
│   │   ├── QuestMap.tsx        # Main map component
│   │   ├── UserLocationMarker.tsx  # Pulsing blue dot
│   │   ├── QuestMarker.tsx     # Category-colored quest marker
│   │   ├── QuestClusterMarker.tsx  # Cluster circle with count
│   │   └── QuestMarkerLayer.tsx    # Supercluster + marker rendering
│   ├── filters/
│   │   ├── FilterBar.tsx       # Horizontal scrollable filter bar
│   │   ├── CategoryChip.tsx    # Category toggle chip
│   │   ├── DistanceSelect.tsx  # 1km / 5km / 10km selector
│   │   └── ToggleFilter.tsx    # Paid / time-limited toggle
│   ├── quest/
│   │   ├── BottomSheet.tsx     # Swipeable bottom sheet
│   │   ├── QuestDetail.tsx     # Quest info + action button
│   │   ├── CategoryBadge.tsx   # Colored category pill
│   │   ├── QuestReward.tsx     # XP reward display
│   │   └── QuestTimeLimit.tsx  # Time remaining display
│   └── common/
│       ├── FloatingActionButton.tsx
│       └── LoadingSpinner.tsx
├── data/
│   └── mock-quests.ts      # 20 sample quests around Berlin
└── utils/
    ├── cn.ts               # clsx + tailwind-merge helper
    └── format.ts           # Distance, reward, time formatters
```

## State Management

Four small Zustand stores, each with a single responsibility:

| Store | Purpose |
|-------|---------|
| `useQuestStore` | Quest data, selected quest, loading state |
| `useMapStore` | Map viewport, user GPS location, location errors |
| `useFilterStore` | Active category filters, distance radius, toggles |
| `useUIStore` | Bottom sheet open/close, dark mode preference |

## Data Flow

1. `useUserLocation` hook starts GPS watch, updates `useMapStore`
2. `fetchQuests()` loads mock data (or API), stored in `useQuestStore`
3. `useFilteredQuests` derives visible quests from quest data + filter state + user location
4. `QuestMarkerLayer` converts filtered quests to GeoJSON, runs Supercluster, renders markers
5. Clicking a marker sets `selectedQuest` and opens the bottom sheet
6. `QuestDetail` shows quest info with distance calculated via Haversine

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | _(empty)_ | Backend API base URL. When empty, uses local mock data. |

## Map Tiles

Uses [OpenFreeMap](https://openfreemap.org/) -- free OpenStreetMap tiles with no API key, no registration, and no rate limits.

- Light mode: `https://tiles.openfreemap.org/styles/liberty`
- Dark mode: `https://tiles.openfreemap.org/styles/dark`

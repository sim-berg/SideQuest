# SideQuest

A mobile-first web app that brings quests into the real world. Users explore an interactive OpenStreetMap, discover nearby quests, filter by category and distance, and view details in a swipeable bottom sheet.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.9, Vite 7 |
| Map | MapLibre GL JS, OpenFreeMap Tiles |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| Backend | NestJS 11, TypeScript |
| Database | In-memory mock data (MongoDB-ready) |

## Project Structure

```
SideQuest/
├── frontend/          # React SPA with map, filters, quest detail
├── backend/           # NestJS REST API
└── package.json       # Root scripts (runs both concurrently)
```

## Prerequisites

- Node.js >= 18
- npm >= 9

## Quick Start

```bash
# Install root dependencies
npm install

# Install frontend & backend dependencies
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Start both servers
npm run dev
```

This launches:
- **Frontend** at `http://localhost:5173`
- **Backend** at `http://localhost:3000/api`

By default the frontend uses local mock data. To connect to the backend, uncomment `VITE_API_URL` in `frontend/.env.development`.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start frontend + backend concurrently |
| `npm run dev:frontend` | Start only the frontend dev server |
| `npm run dev:backend` | Start only the backend in watch mode |
| `npm run build:frontend` | Production build for the frontend |
| `npm run build:backend` | Production build for the backend |

## Features

- **Interactive Map** -- MapLibre GL with free OpenStreetMap tiles, no API key required
- **Geolocation** -- Pulsing marker at the user's current position
- **Quest Markers** -- Color-coded by category with smooth animations
- **Marker Clustering** -- Supercluster groups nearby quests at lower zoom levels
- **Filter System** -- Category chips, distance radius (1/5/10 km), paid-only and time-limited toggles
- **Bottom Sheet** -- Swipeable quest detail view with title, description, reward, time limit, and distance
- **Dark Mode** -- System preference detection with manual toggle
- **REST API** -- NestJS backend with quest CRUD, geo-filtering, and validation

## Quest Categories

| Category | Icon | Color |
|----------|------|-------|
| Sport | Running | Green |
| Social | People | Blue |
| Abenteuer | Swords | Amber |
| Skill | Brain | Purple |
| Mystery | Crystal Ball | Red |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/quests` | List quests (supports filter query params) |
| `GET` | `/api/quests/:id` | Get single quest |
| `POST` | `/api/quests` | Create a new quest |

### Filter Query Parameters

| Param | Type | Example |
|-------|------|---------|
| `categories` | comma-separated | `sport,mystery` |
| `radius` | number (km) | `5` |
| `lat` | number | `52.52` |
| `lng` | number | `13.405` |
| `paidOnly` | boolean | `true` |
| `timedOnly` | boolean | `true` |

## Future Roadmap

- User authentication (login/register)
- XP and level system
- Quest completion tracking
- Quest creation form UI
- MongoDB integration
- Push notifications for nearby quests
- Leaderboard and gamification

## License

Private project.

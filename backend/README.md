# SideQuest Backend

NestJS 11 REST API serving quest data with filtering, geo-distance calculations, and validation. Currently uses in-memory mock data, architected for easy MongoDB migration.

## Tech Stack

- **NestJS 11** with TypeScript 5.7
- **class-validator** + **class-transformer** -- DTO validation and transformation
- **uuid** -- unique quest ID generation
- **Jest 30** -- testing framework

## Getting Started

```bash
npm install
npm run start:dev
```

The API starts at `http://localhost:3000/api`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Start with file watching (development) |
| `npm run start:debug` | Start with debugger attached |
| `npm run start` | Start without watching |
| `npm run start:prod` | Start compiled production build |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run format` | Run Prettier |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage |
| `npm run test:e2e` | Run end-to-end tests |

## API Endpoints

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Returns `{ status: "ok", timestamp: "..." }` |

### Quests

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/quests` | List all quests, supports filter query params |
| `GET` | `/api/quests/:id` | Get a single quest by ID |
| `POST` | `/api/quests` | Create a new quest |

### Filter Query Parameters (GET /api/quests)

| Param | Type | Description | Example |
|-------|------|-------------|---------|
| `categories` | string | Comma-separated category values | `sport,mystery` |
| `radius` | number | Max distance in km (requires `lat` and `lng`) | `5` |
| `lat` | number | User latitude for distance filtering | `52.52` |
| `lng` | number | User longitude for distance filtering | `13.405` |
| `paidOnly` | boolean | Only return quests with a reward | `true` |
| `timedOnly` | boolean | Only return quests with a time limit | `true` |

### Create Quest (POST /api/quests)

Request body:

```json
{
  "title": "Parkour Challenge",
  "description": "Complete the parkour course in the park",
  "lat": 52.5438,
  "lng": 13.4024,
  "category": "sport",
  "reward": 50,
  "timeLimit": "2026-04-01T20:00:00Z"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | string | yes | non-empty |
| `description` | string | yes | non-empty |
| `lat` | number | yes | -90 to 90 |
| `lng` | number | yes | -180 to 180 |
| `category` | string | yes | `sport`, `social`, `adventure`, `skill`, `mystery` |
| `reward` | number | no | -- |
| `timeLimit` | string | no | ISO 8601 date |

## Architecture

```
src/
├── main.ts                         # Bootstrap, CORS, ValidationPipe, /api prefix
├── app.module.ts                   # Root module
├── quest/
│   ├── quest.module.ts             # Quest module definition
│   ├── quest.controller.ts         # REST endpoints
│   ├── quest.service.ts            # Business logic (in-memory CRUD + filtering)
│   ├── dto/
│   │   ├── create-quest.dto.ts     # Validated creation DTO
│   │   └── quest-filter.dto.ts     # Validated filter query DTO
│   ├── enums/
│   │   └── category.enum.ts        # Category enum
│   ├── interfaces/
│   │   └── quest.interface.ts      # Quest TypeScript interface
│   └── data/
│       └── mock-quests.data.ts     # 20 sample quests around Berlin
├── geo/
│   ├── geo.module.ts               # Geo module definition
│   └── geo.service.ts              # Haversine distance calculation
└── health/
    └── health.controller.ts        # Health check endpoint
```

## Module Dependency Graph

```
AppModule
├── QuestModule
│   └── imports: GeoModule
└── HealthController
```

- **QuestModule** handles all quest CRUD and filtering. Imports `GeoModule` for distance calculations.
- **GeoModule** exports `GeoService` with the Haversine formula for server-side distance filtering.
- **HealthController** is registered directly in `AppModule` for the health check endpoint.

## Configuration

| Setting | Value |
|---------|-------|
| Global prefix | `/api` |
| Port | `3000` (or `PORT` env var) |
| CORS origin | `http://localhost:5173` |
| Validation | `transform: true`, `whitelist: true` |

## Data Strategy

The `QuestService` currently stores quests in an in-memory array initialized from `mock-quests.data.ts`. The service interface is designed so that switching to MongoDB requires only replacing array operations with Mongoose model calls:

```
Current:  this.quests.filter(...)    -->  this.questModel.find(...)
Current:  this.quests.push(quest)    -->  this.questModel.create(quest)
Current:  this.quests.find(...)      -->  this.questModel.findById(id)
```

Future dependencies for MongoDB integration:
- `@nestjs/mongoose`
- `mongoose`

## Quest Categories

| Value | Label |
|-------|-------|
| `sport` | Sport |
| `social` | Social |
| `adventure` | Abenteuer |
| `skill` | Skill |
| `mystery` | Mystery |

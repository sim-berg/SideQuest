# Getting Started

## Voraussetzungen

- Node.js >= 18
- npm >= 9
- Eine erreichbare MongoDB-Instanz (lokal oder gehostet) für das Backend

## Installation

Das Repository ist ein Monorepo mit getrennten `frontend/`- und `backend/`-Workspaces
sowie einem Root-`package.json`, das beide parallel startet.

```bash
# Root-Abhängigkeiten (concurrently)
npm install

# Frontend
cd frontend && npm install && cd ..

# Backend
cd backend && npm install && cd ..
```

## Entwicklung starten

```bash
npm run dev
```

Startet:

- **Frontend** unter `http://localhost:5173`
- **Backend** unter `http://localhost:3000/api`

Der Vite-Dev-Server proxyt `/api` und `/socket.io` (inkl. WebSocket-Upgrade) auf
`http://localhost:3000`, sodass im Dev-Betrieb keine CORS-Konfiguration nötig ist.

### Einzelne Server

| Script | Beschreibung |
|--------|--------------|
| `npm run dev` | Frontend + Backend parallel (concurrently) |
| `npm run dev:frontend` | Nur den Vite-Dev-Server |
| `npm run dev:backend` | Nur das Backend im Watch-Modus |
| `npm run build:frontend` | Production-Build des Frontends (`tsc -b && vite build`) |
| `npm run build:backend` | Production-Build des Backends |

## Umgebungsvariablen

### Backend (`backend/.env`)

| Variable | Default | Beschreibung |
|----------|---------|--------------|
| `MONGODB_URI` | — | MongoDB-Connection-String (erforderlich) |
| `PORT` | `3000` | HTTP-Port |
| `CORS_ORIGIN` | `http://localhost:5173` (Gateway-Fallback) | Erlaubter Origin für HTTP + WebSocket |
| `JWT_SECRET` | — | Signaturschlüssel für Access-Token (vom `JwtStrategy` **zwingend** erwartet) |
| `NODE_ENV` | — | Bei `production` wird das Refresh-Cookie `secure: true` gesetzt |

> ⚠️ **Hinweis:** Wird `JWT_SECRET` nicht gesetzt, greifen Refresh-Token und
> Message-Gateway auf das hartkodierte Fallback `'sidequest-dev-secret'` zurück,
> während der Access-Token-`JwtStrategy` ohne gesetzten Wert hart abbricht
> (`getOrThrow`). Für jeden echten Betrieb `JWT_SECRET` setzen.

### Frontend (`frontend/.env.development`)

| Variable | Default | Beschreibung |
|----------|---------|--------------|
| `VITE_API_URL` | `/api` | REST-Basis-URL; Socket-URL wird daraus durch Entfernen von `/api` abgeleitet |
| `VITE_RPG_DEBUG` | — | `'true'` schaltet alle RPG-Zonen frei (überspringt die GPS-/Overpass-Prüfung) |

Standardmäßig spricht das Frontend über den Vite-Proxy mit dem lokalen Backend.
Es gibt **keinen Mock-/Live-Daten-Umschalter** — alle Daten kommen vom Backend.
Ausnahmen sind das **Inventar** (rein clientseitig, in `localStorage` persistiert)
und die **Dungeon-Generierung** (clientseitig, prozedural).

## Docker

Die `docker-compose.yml` im Projektroot bringt den kompletten Stack hoch:

```bash
docker compose up --build
```

| Service | Image / Build | Port | Hinweise |
|---------|---------------|------|----------|
| `mongo` | `mongo:7` | `27017` | Daten in Named-Volume `mongo-data` |
| `backend` | `./backend` | (intern 3000) | `MONGODB_URI=mongodb://mongo:27017/devsidequest`, `CORS_ORIGIN="*"`, Healthcheck auf `/api/health` |
| `frontend` | `./frontend` | `5174:80` | startet erst, wenn das Backend healthy ist |

> Das Compose-Setup verwendet `JWT_SECRET: change-me-in-production` — vor einem
> echten Deployment unbedingt ersetzen.

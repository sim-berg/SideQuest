# Plan: Realtime Position Data Transfer & User Icons on Map

## Overview

Implement realtime position sharing between multiple users via WebSockets and display each user's location as a small icon/avatar on the map. When a user moves, all other connected users see their position update in near-realtime.

---

## Architecture Decision

**Protocol:** WebSocket via `@nestjs/websockets` + `socket.io`

**Why WebSockets over SSE or polling:**
- Bidirectional — clients send position updates AND receive others' positions
- Low latency (~50ms vs ~1s for polling)
- Built-in room/namespace support via socket.io for future area-based scoping
- NestJS has first-class Gateway support for socket.io

**Data flow:**
```
User A moves → browser geolocation fires → WS emit "position:update"
    → NestJS Gateway receives → broadcasts to all other connected clients
    → User B/C/D receive "position:update" → Zustand store updates → map re-renders marker
```

---

## Backend Changes

### 1. Install dependencies

```bash
cd backend
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install -D @types/socket.io  # if needed (often bundled)
```

### 2. Create `PositionGateway` — WebSocket Gateway

**File:** `backend/src/position/position.gateway.ts`

```typescript
@WebSocketGateway({ cors: { origin: 'http://localhost:5173' } })
export class PositionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  // In-memory map: socketId → { userId, lat, lng, updatedAt }
  private positions = new Map<string, UserPosition>();

  handleConnection(client: Socket) {
    // Assign a temporary userId (random or from auth token in future)
    // Send current positions of all connected users to the new client
  }

  handleDisconnect(client: Socket) {
    // Remove from positions map
    // Broadcast "position:remove" { userId } to all remaining clients
  }

  @SubscribeMessage('position:update')
  handlePositionUpdate(client: Socket, payload: { lat: number; lng: number }) {
    // Validate lat/lng bounds
    // Throttle: ignore if last update < 2 seconds ago (server-side guard)
    // Update positions map
    // Broadcast to all OTHER clients: "position:update" { userId, lat, lng }
  }

  @SubscribeMessage('position:request')
  handlePositionRequest(client: Socket) {
    // Return all current positions to requesting client (catch-up on reconnect)
  }
}
```

**Key design decisions:**
- **Temporary user IDs:** Since there's no auth system yet, assign a random `userId` per socket connection (e.g., short UUID). When auth is added later, extract userId from JWT in the handshake.
- **Server-side throttle:** Reject updates arriving faster than every 2 seconds from the same client to prevent abuse.
- **Lat/lng validation:** Reject positions outside valid ranges (-90/90 lat, -180/180 lng).

### 3. Create supporting types

**File:** `backend/src/position/interfaces/user-position.interface.ts`

```typescript
export interface UserPosition {
  userId: string;
  displayName: string;  // e.g., "Adventurer #42" (auto-generated)
  lat: number;
  lng: number;
  updatedAt: number;    // timestamp for staleness detection
}
```

### 4. Create `PositionModule`

**File:** `backend/src/position/position.module.ts`

- Declares `PositionGateway`
- Import in `AppModule`

### 5. Register module

**File:** `backend/src/app.module.ts`

- Add `PositionModule` to imports array

---

## Frontend Changes

### 6. Install socket.io client

```bash
cd frontend
npm install socket.io-client
```

### 7. Create socket service

**File:** `frontend/src/services/socket.service.ts`

```typescript
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],     // skip long-polling upgrade
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
```

Singleton pattern — one connection per app lifetime, auto-reconnects.

### 8. Create `useNearbyUsersStore` — Zustand store for other users' positions

**File:** `frontend/src/stores/useNearbyUsersStore.ts`

```typescript
interface NearbyUser {
  userId: string;
  displayName: string;
  lat: number;
  lng: number;
}

interface NearbyUsersState {
  users: Map<string, NearbyUser>;        // keyed by userId
  myUserId: string | null;
  setMyUserId: (id: string) => void;
  upsertUser: (user: NearbyUser) => void;
  removeUser: (userId: string) => void;
  setAllUsers: (users: NearbyUser[]) => void;
  clearAll: () => void;
}
```

Using a `Map` for O(1) upsert/remove since positions update frequently.

### 9. Create `useRealtimePosition` hook — ties it all together

**File:** `frontend/src/hooks/useRealtimePosition.ts`

Responsibilities:
- On mount: connect socket, listen for events
- On `userLocation` change (from existing `useMapStore`): emit `position:update` to server (throttled to max once per 3 seconds on client side)
- On `position:update` from server: upsert into `useNearbyUsersStore`
- On `position:remove` from server: remove from store
- On `position:init` from server: bulk-set all current users
- On unmount: disconnect socket, clear store

```typescript
export function useRealtimePosition() {
  const userLocation = useMapStore((s) => s.userLocation);
  const { upsertUser, removeUser, setAllUsers, setMyUserId } = useNearbyUsersStore();

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      // Request current positions on (re)connect
      socket.emit('position:request');
    });

    socket.on('position:init', (data: { userId: string; users: NearbyUser[] }) => {
      setMyUserId(data.userId);
      setAllUsers(data.users);
    });

    socket.on('position:update', (user: NearbyUser) => {
      upsertUser(user);
    });

    socket.on('position:remove', ({ userId }: { userId: string }) => {
      removeUser(userId);
    });

    return () => {
      socket.off('position:init');
      socket.off('position:update');
      socket.off('position:remove');
      disconnectSocket();
    };
  }, []);

  // Emit own position when it changes (throttled)
  useEffect(() => {
    if (!userLocation) return;
    const socket = getSocket();
    socket.emit('position:update', { lat: userLocation.lat, lng: userLocation.lng });
  }, [userLocation]);  // fires each time geolocation updates (~every 5s from watchPosition)
}
```

### 10. Create `NearbyUserMarker` component — the small icon

**File:** `frontend/src/components/map/NearbyUserMarker.tsx`

Each nearby user rendered as a small circular marker on the map:

```
Design:
  ┌──────────┐
  │  👤 icon  │  16x16px circle, semi-transparent bg
  │  ──────  │
  │ "Name"   │  Tiny label below (optional, shown on zoom > 15)
  └──────────┘
```

- Uses `<Marker>` from `react-map-gl/maplibre`
- Small circle (16-20px) with a muted color (gray/teal) to distinguish from quest markers
- First letter of `displayName` as fallback avatar
- Subtle opacity (0.8) so it doesn't compete visually with quest markers
- Smooth CSS transition on position changes via `motion` library (already installed)
- No click interaction for now (future: tap to see profile)

### 11. Create `NearbyUsersLayer` component — renders all markers

**File:** `frontend/src/components/map/NearbyUsersLayer.tsx`

```typescript
export default function NearbyUsersLayer() {
  const users = useNearbyUsersStore((s) => s.users);
  const myUserId = useNearbyUsersStore((s) => s.myUserId);

  return (
    <>
      {[...users.values()]
        .filter((u) => u.userId !== myUserId)  // don't show self (already have blue dot)
        .map((user) => (
          <NearbyUserMarker key={user.userId} user={user} />
        ))}
    </>
  );
}
```

### 12. Integrate into `QuestMap`

**File:** `frontend/src/components/map/QuestMap.tsx`

Add `<NearbyUsersLayer />` between `<UserLocationMarker />` and `<QuestMarkerLayer />` so nearby users render below quests but above the user's own location dot.

### 13. Activate the hook in `App.tsx`

**File:** `frontend/src/App.tsx`

Call `useRealtimePosition()` at the app root level (alongside existing `useUserLocation()`).

---

## Event Protocol Summary

| Event | Direction | Payload | Description |
|---|---|---|---|
| `position:update` | Client → Server | `{ lat, lng }` | User sends their new position |
| `position:update` | Server → Client | `{ userId, displayName, lat, lng }` | Another user moved |
| `position:remove` | Server → Client | `{ userId }` | A user disconnected |
| `position:request` | Client → Server | — | Request all current positions |
| `position:init` | Server → Client | `{ userId, users: [...] }` | Response with all current positions + assigned userId |

---

## File Change Summary

### New files (7)
| File | Purpose |
|---|---|
| `backend/src/position/position.module.ts` | NestJS module for position feature |
| `backend/src/position/position.gateway.ts` | WebSocket gateway handling position events |
| `backend/src/position/interfaces/user-position.interface.ts` | TypeScript interface for user position |
| `frontend/src/services/socket.service.ts` | Socket.io client singleton |
| `frontend/src/stores/useNearbyUsersStore.ts` | Zustand store for nearby users |
| `frontend/src/hooks/useRealtimePosition.ts` | Hook connecting socket events to store |
| `frontend/src/components/map/NearbyUserMarker.tsx` | Individual user icon marker |
| `frontend/src/components/map/NearbyUsersLayer.tsx` | Layer rendering all nearby user markers |

### Modified files (3)
| File | Change |
|---|---|
| `backend/src/app.module.ts` | Import `PositionModule` |
| `frontend/src/components/map/QuestMap.tsx` | Add `<NearbyUsersLayer />` |
| `frontend/src/App.tsx` | Call `useRealtimePosition()` |

---

## Implementation Order

1. **Backend first** — Install deps, create `PositionGateway` + module, register in `AppModule`
2. **Frontend socket service** — Install `socket.io-client`, create singleton
3. **Zustand store** — Create `useNearbyUsersStore`
4. **Hook** — Create `useRealtimePosition`, wire socket events to store
5. **UI components** — Create `NearbyUserMarker` + `NearbyUsersLayer`
6. **Integration** — Add layer to `QuestMap`, activate hook in `App.tsx`
7. **Test** — Open two browser tabs, verify markers appear and move

---

## Future Considerations (not in scope)

- **Authentication integration:** Replace temporary userId with real user ID from JWT handshake
- **Room-based scoping:** Only broadcast to users within a geographic radius (reduce bandwidth)
- **User avatars:** Profile pictures instead of initials
- **Stale user cleanup:** Server-side timer to remove users who haven't sent updates in 60s
- **Redis adapter:** For horizontal scaling across multiple server instances (`@socket.io/redis-adapter`)
- **Rate limiting:** More sophisticated per-user rate limiting middleware

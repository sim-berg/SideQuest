# Realtime (Socket.IO)

Echtzeit-Features laufen über ein einzelnes Socket.IO-Gateway im message-Modul
(`MessageGateway`). Es bedient drei Bereiche: **Chat-Zustellung**,
**Typing-Indikatoren** und das flüchtige **„Nearby-Users"-Standort-Sharing**.

## Verbindung & Authentifizierung

- Client: `socket.service.ts` verbindet mit `transports: ['websocket']` und
  übergibt das JWT in `handshake.auth.token`. Verbindung wird beim Login
  aufgebaut (`useAuthStore.setAuth → connectSocket`) und beim Logout getrennt.
- Server: liest `client.handshake.auth.token`, verifiziert mit `JWT_SECRET`.
  Bei Erfolg speichert es `client.data.userId/username`, registriert den Socket
  in der `userSockets`-Map und joint den Raum `user:<userId>`. Ungültiges/fehlendes
  Token → `disconnect()`.
- CORS des Gateways: `CORS_ORIGIN || http://localhost:5173`, `credentials: true`.

## Events

### Client → Server

| Event | Payload | Wirkung |
|-------|---------|---------|
| `message:typing` | `{ recipientId }` | leitet Typing an den Empfänger weiter |
| `location:update` | `{ lat, lng }` | validiert Bereich, rundet auf 3 Nachkommastellen (~110 m, Privacy), cached Standort + Profil **in-memory** |
| `location:stop` | – | entfernt den gecachten Standort des Nutzers |

### Server → Client

| Event | Payload | Auslöser |
|-------|---------|----------|
| `message:new` | `{ _id, senderId, recipientId, body, read, createdAt }` | bei `POST /messages/:userId`, an den Empfänger-Raum |
| `message:read` | `{ readBy, readAt }` | bei `PATCH /messages/:userId/read`, wenn ≥1 Nachricht aktualisiert, an den ursprünglichen Sender |
| `message:typing` | `{ senderId }` | Weiterleitung des Client-Typing |
| `location:nearby` | `[{ userId, lat, lng, username, displayName, avatarUrl, level }]` | alle 5 s pro Nutzer |

## Standort-Sharing (nur In-Memory)

Der Gateway hält zwei flüchtige Strukturen, die **nie persistiert** werden:

- `userSockets: Map<userId, Set<socketId>>` — mehrere Sockets pro Nutzer möglich;
  beim Disconnect bereinigt (Standort wird entfernt, wenn der letzte Socket geht).
- `userLocations: Map<userId, { lat, lng, updatedAt, username, displayName, avatarUrl, level }>`.

Konstanten:

| Konstante | Wert | Bedeutung |
|-----------|------|-----------|
| `BROADCAST_INTERVAL_MS` | 5000 | Broadcast-Takt |
| `NEARBY_RADIUS_KM` | 10 | Umkreis für „nearby" (Haversine) |
| `STALE_MS` | 30000 | Standorte älter als 30 s werden vor jedem Broadcast verworfen |

Pro Intervall berechnet der Server für jeden Nutzer alle anderen innerhalb von
10 km und sendet ihm `location:nearby`. Das Intervall wird in `onModuleDestroy`
gestoppt. Hilfsfunktionen: `sendToUser(userId, event, data)` (emittet an
`user:<userId>`), `isUserOnline(userId)`.

## Frontend-Integration

- **`useRealtimeMessages`** — abonniert `message:new`/`message:read`/
  `message:typing`, aktualisiert `useChatStore` und Unread-Counter, markiert bei
  offenem Chat automatisch als gelesen, blendet Typing nach 3 s aus.
- **`useLocationSharing`** — nur aktiv bei `user.shareLocation`: emittet
  `location:update` sofort und alle 10 s, hört auf `location:nearby` (→
  `useNearbyUsersStore`), sendet beim Cleanup `location:stop`.
- **Karte** — `NearbyUsersLayer` rendert die Marker; Tippen auf einen Marker
  startet einen Chat.

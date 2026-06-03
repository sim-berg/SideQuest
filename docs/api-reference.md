# API-Referenz

Alle HTTP-Routen liegen unter dem globalen Prefix **`/api`**. Geschützte Routen
erwarten den Header `Authorization: Bearer <accessToken>`. `req.user` hat überall
die Form `{ userId, username }` (aus `JwtStrategy.validate`).

## auth — `/api/auth`

| Methode | Pfad | Auth | Body / Quelle | Response |
|---------|------|------|---------------|----------|
| POST | `/auth/register` | – | `RegisterDto` | `{ accessToken, user }` + setzt `refresh_token`-Cookie |
| POST | `/auth/login` | – | `LoginDto` | `{ accessToken, user }` + Cookie, Status 200 |
| POST | `/auth/refresh` | Cookie | liest `refresh_token`-Cookie | `{ accessToken, user }`; 401 bei fehlend/ungültig |
| POST | `/auth/logout` | JWT | – | `{ message: 'Logged out successfully' }`, löscht Cookie |

- `RegisterDto`: `email` (E-Mail), `username` (3–24), `password` (min. 8).
- `LoginDto`: `email`, `password`.

## users — `/api/users` (komplett JWT-geschützt)

| Methode | Pfad | Body | Response |
|---------|------|------|----------|
| GET | `/users/me` | – | aktueller Nutzer (ohne `passwordHash`) |
| PATCH | `/users/me` | `UpdateProfileDto` | aktualisierter Nutzer |
| GET | `/users/:id` | – | öffentliches Profil (ohne `passwordHash`, `email`) |

- `UpdateProfileDto` (alle optional): `displayName` (max 48), `bio` (max 200),
  `avatarUrl`, `shareLocation` (boolean).

## quests — `/api/quests`

| Methode | Pfad | Auth | Input | Response |
|---------|------|------|-------|----------|
| GET | `/quests` | – | `QuestFilterDto` (Query) | Quest-Array |
| GET | `/quests/my/active` | JWT | – | akzeptierte, nicht abgeschlossene Quests |
| GET | `/quests/my/completed` | JWT | – | abgeschlossene Quests |
| GET | `/quests/:id` | – | – | einzelne Quest |
| POST | `/quests` | **– (ungeschützt)** | `CreateQuestDto` | erstellte Quest |
| POST | `/quests/:id/accept` | JWT | – | Quest (setzt `acceptedBy`/`acceptedAt`) |
| POST | `/quests/:id/complete` | JWT | `CompleteQuestDto` | `{ quest, xpResult }` |
| POST | `/quests/:id/abandon` | JWT | – | Quest (Akzeptanz entfernt) |

### `CreateQuestDto`

| Feld | Typ | Pflicht |
|------|-----|---------|
| `title`, `description`, `address` | string | ✔ |
| `lat` / `lng` | number (−90..90 / −180..180) | ✔ |
| `category` | `Category`-Enum | ✔ |
| `questGiver` | `{ name: string; avatar?: string }` | ✔ |
| `reward` | number | optional |
| `timeLimit` | ISO-Date-String | optional |
| `difficulty` | `Difficulty`-Enum (Default `medium`) | optional |

### `CompleteQuestDto`

`lat` (−90..90), `lng` (−180..180). Muss innerhalb von 100 m zur Quest liegen.

### `QuestFilterDto` (Query, alles optional)

| Param | Typ | Beispiel |
|-------|-----|----------|
| `categories` | Komma-String → `Category[]` | `sport,mystery` |
| `radius` | number (km) | `5` |
| `lat` / `lng` | number | `52.52` / `13.405` |
| `paidOnly` | boolean | `true` |
| `timedOnly` | boolean | `true` |

> `categories`/`paidOnly`/`timedOnly` werden in MongoDB gefiltert; der `radius`
> wird applikationsseitig per Haversine angewendet.

## messages — `/api/messages` (komplett JWT-geschützt)

| Methode | Pfad | Input | Response |
|---------|------|-------|----------|
| GET | `/messages/unread-count` | – | `{ count }` |
| GET | `/messages/conversations` | – | `[{ user, lastMessage, unreadCount }]` |
| GET | `/messages/:userId` | Query `before?`, `limit?` (Default 50) | Messages, neueste zuerst, Cursor-paginiert |
| POST | `/messages/:userId` | `SendMessageDto` (`body`) | erstellte Message; pusht `message:new` per WS |
| PATCH | `/messages/:userId/read` | – | `{ modifiedCount }`; emittet `message:read` an Sender |

- `SendMessageDto`: `body` (1–2000 Zeichen).

## dragons — `/api/dragons` (komplett JWT-geschützt)

| Methode | Pfad | Input | Response |
|---------|------|-------|----------|
| GET | `/dragons/me` | – | Drache des Nutzers oder `null` |
| POST | `/dragons/choose` | `ChooseDragonDto` (`type`) | erstellter Drache; setzt `hasDragon = true`; 409 falls bereits vorhanden |

- `ChooseDragonDto`: `type` ∈ `DragonType`.

## rpg — `/api/rpg` (komplett JWT-geschützt)

| Methode | Pfad | Input | Response |
|---------|------|-------|----------|
| GET | `/rpg/quests` | Query `zone` ∈ `ZoneType` | Templates der Zone + Status pro Nutzer |
| POST | `/rpg/quests/complete` | `{ templateId: string }` | `{ xpAwarded, bonusBreakdown, dragon, quest }` |
| GET | `/rpg/quests/mine` | – | aktive (nicht abgelaufene) RPG-Quests des Nutzers |

## health — `/api/health`

| Methode | Pfad | Auth | Response |
|---------|------|------|----------|
| GET | `/health` | – | `{ status: 'ok', timestamp: <ISO> }` |

## WebSocket (Socket.IO)

Verbindung über `/socket.io` mit JWT in `handshake.auth.token`. Vollständige
Event-Referenz in [realtime.md](./realtime.md).

| Richtung | Event | Payload |
|----------|-------|---------|
| Client → Server | `message:typing` | `{ recipientId }` |
| Client → Server | `location:update` | `{ lat, lng }` |
| Client → Server | `location:stop` | – |
| Server → Client | `message:new` | `{ _id, senderId, recipientId, body, read, createdAt }` |
| Server → Client | `message:read` | `{ readBy, readAt }` |
| Server → Client | `message:typing` | `{ senderId }` |
| Server → Client | `location:nearby` | `[{ userId, lat, lng, username, displayName, avatarUrl, level }]` |

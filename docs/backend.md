# Backend (NestJS)

NestJS 11 mit MongoDB (Mongoose). Eine vollständige Endpoint-Liste steht in der
[api-reference.md](./api-reference.md); Schemas und Enums in
[data-models.md](./data-models.md).

## Globale Konfiguration

`main.ts` / `app.module.ts`:

- **Globaler Prefix:** `api` → alle Routen unter `/api/...`.
- **ValidationPipe** global mit `{ transform: true, whitelist: true }` — entfernt
  unbekannte Properties und transformiert Typen automatisch (passt zu den
  `@Type`/`@Transform`-Dekoratoren in den Filter-DTOs).
- **CORS:** `origin: CORS_ORIGIN`, `credentials: true`. Das WebSocket-Gateway hat
  eigene CORS-Config mit Fallback `http://localhost:5173`.
- **cookie-parser** aktiv (Refresh-Token-Cookie).
- **Port:** `PORT` (Default `3000`).
- **Persistenz:** echtes MongoDB via `MongooseModule.forRootAsync` (`MONGODB_URI`).
  Einziger In-Memory-State: Live-Standorte/Sockets im `MessageGateway`.

Registrierte Module: `ConfigModule` (global), Mongoose, `QuestModule`,
`UserModule`, `AuthModule`, `MessageModule`, `DragonModule`, `RpgModule`.
`HealthController` hängt direkt am `AppModule`; `GeoModule` ist ein reiner
Provider ohne Controller.

## auth

Registrierung, Login, JWT-Ausgabe, Refresh-Token-Rotation über httpOnly-Cookie,
Logout. Passwörter mit **bcrypt (Cost 12)** gehasht.

- **Access-Token:** Payload `{ sub: userId, username }`, `expiresIn: '15m'`,
  signiert mit `JWT_SECRET`.
- **Refresh-Token:** Payload `{ sub, username, type: 'refresh' }`,
  `expiresIn: '7d'`, im Cookie `refresh_token` (`httpOnly`, `sameSite: 'lax'`,
  `path: '/'`, 7 Tage, `secure` nur in Production). Der Refresh-Handler verifiziert
  und prüft `type === 'refresh'`, gibt einen frischen Access-Token aus
  (der Refresh-Token selbst wird **nicht** rotiert).
- **`JwtStrategy`** (passport-jwt): Bearer aus `Authorization`-Header,
  `ignoreExpiration: false`, Secret via `getOrThrow('JWT_SECRET')`. `validate()`
  liefert `{ userId, username }` → genau das steckt in `req.user` aller
  geschützten Controller.
- Doppelte E-Mail/Username → `ConflictException`; falsche Credentials → generisch
  `UnauthorizedException('Invalid credentials')`.

Alle Auth-Responses liefern `{ accessToken, user }` mit
`UserPayload = { id, username, displayName, avatarUrl, bio, level, questsCompleted, isOnline, hasDragon }`.

## user

Profile, Online-Status, Quest-Zähler, Drachen-Besitz-Flag. Besitzt das zentrale
`User`-Schema (siehe [data-models.md](./data-models.md)). Der gesamte Controller
ist `@UseGuards(JwtAuthGuard)`. `passwordHash` wird in allen Responses per
`.select('-passwordHash')` entfernt, `GET /users/:id` entfernt zusätzlich `email`.

Service-Helfer für andere Module: `findByEmail`, `findByUsername`, `create`
(setzt `displayName = username`), `setOnlineStatus`, `incrementQuestsCompleted`
(`$inc`), `setHasDragon`.

## quest

Spielererstellte ortsbasierte Quests mit Lifecycle accept → complete → abandon,
geo-gefilterte Entdeckung und GPS-verifiziertem Abschluss.

- **Entdeckung (`GET /quests`):** Mongo-Query für `category` (`$in`), `paidOnly`
  (`reward > 0`), `timedOnly` (`timeLimit != null`), sortiert neueste zuerst.
  Die **Radius-Filterung passiert in-app** über `GeoService.haversine` (kein
  Geo-Index): es bleiben Quests mit Distanz ≤ `radius` km.
- **Accept:** lehnt ab, wenn bereits abgeschlossen oder akzeptiert (`Conflict`).
- **Complete:** verlangt `acceptedBy === userId`; GPS-Näheprüfung
  `haversine(...) > 0.1 km` → „Must be within 100m". Bei Erfolg XP-Vergabe +
  `incrementQuestsCompleted`. **XP nach Schwierigkeit:** `easy 25 / medium 50 /
  hard 100` (Basis-XP geht an `DragonService.recordQuestCompletion`). Response
  `{ quest, xpResult }`.
- **Abandon:** nur durch den akzeptierenden Nutzer, solange nicht abgeschlossen.

> ⚠️ **`POST /api/quests` (Erstellung) ist der einzige mutierende Endpoint ohne
> Guard.** Bei einem produktiven Einsatz sollte er abgesichert werden.

Antworten laufen durch `toPlain` (mappt `_id → id`, ISO-Datumsformat).

## geo

Zustandsloses Utility-Modul: `GeoService.haversine(lat1, lng1, lat2, lng2)` gibt
die Distanz in **Kilometern** zurück (Erdradius R = 6371 km). Genutzt von quest
(Radius + 100-m-Abschlussprüfung) und vom message-Gateway (10-km-Nearby-Radius).
Kein Controller.

## message

1-zu-1-Direktnachrichten mit Persistenz, Konversationsliste, Unread-Zählern,
Read-Receipts — plus ein Socket.IO-Gateway für Echtzeit-Zustellung, Typing und
flüchtiges „Nearby-Users"-Standort-Broadcasting.

- **Konversationen:** Mongo-Aggregation, gruppiert nach Gesprächspartner mit
  `$first` als `lastMessage`, summiert Ungelesene, `$lookup` auf `users`.
- **Pagination:** Cursor `_id < before`, sortiert `createdAt: -1`, Limit
  (Default 50).
- **Gateway-Details** (Auth, Events, Standort-Logik) siehe [realtime.md](./realtime.md).

Der HTTP-Controller ist komplett `@UseGuards(JwtAuthGuard)`. Routen-Reihenfolge:
`unread-count` und `conversations` stehen bewusst vor `:userId`.

## dragon

Begleit-Drache pro Nutzer — einmal gewählt, sammelt XP aus Quest-Abschlüssen
(reale + RPG), entwickelt sich über Stufen, trackt Tages-/Streak-Boni.
Ein Drache pro Nutzer (`userId` unique). Genaues XP-/Streak-/Evolutions-Modell
siehe [game-systems.md](./game-systems.md#drachen--xp).

## rpg

Themenbasierte NPC-Lifestyle-Quests in „Zonen" mit Daily-/Weekly-Cooldowns.
Quest-Definitionen sind **statische In-Code-Templates** (`rpg-quest-templates.ts`,
22 Stück, deutschsprachig); nur die **Abschluss-Records pro Nutzer**
(`UserRpgQuest`) werden persistiert. Abschluss vergibt Drachen-XP über dieselbe
Pipeline. Cooldown-Enforcement: existiert ein abgeschlossener, nicht abgelaufener
Record → `BadRequestException('Quest already completed within cooldown period')`.
Details siehe [game-systems.md](./game-systems.md#rpg-zonen--npc-quests).

## health

Liveness-Probe: `GET /api/health` → `{ status: 'ok', timestamp: <ISO> }`.
Ungeschützt, als Controller direkt am `AppModule`.

## Sicherheitshinweise (zusammengefasst)

- `POST /api/quests` ist unauthentifiziert (siehe oben).
- Refresh-Token und Message-Gateway fallen ohne gesetztes `JWT_SECRET` auf
  `'sidequest-dev-secret'` zurück; der Access-Token-`JwtStrategy` erzwingt es
  dagegen (`getOrThrow`). Im Betrieb immer `JWT_SECRET` setzen.

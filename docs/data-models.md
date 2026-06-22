# Datenmodelle, Typen & Enums

Persistierte Schemas (MongoDB/Mongoose) und die korrespondierenden
Frontend-TypeScript-Typen. Alle Schemas tragen `{ timestamps: true }`
(`createdAt`, `updatedAt`). In Responses wird `_id` zu `id` gemappt.

## User

| Feld | Typ | Default / Constraint |
|------|-----|----------------------|
| `email` | string | required, unique, lowercase, trim |
| `username` | string | required, unique, 3–24 |
| `passwordHash` | string | required, nie in Responses |
| `displayName` | string | `''` |
| `avatarUrl` | string | `''` |
| `bio` | string | `''` |
| `level` | number | `1` |
| `questsCompleted` | number | `0` |
| `isOnline` | boolean | `false` |
| `lastSeenAt` | Date | – |
| `shareLocation` | boolean | `false` |
| `hasDragon` | boolean | `false` |

Frontend-`User`: `id, username, displayName, avatarUrl, bio, level, questsCompleted, isOnline, shareLocation, hasDragon`.
`AuthResponse = { accessToken, user }`.

## Quest

| Feld | Typ | Hinweis |
|------|-----|---------|
| `title`, `description`, `address` | string | required |
| `lat`, `lng` | number | required |
| `category` | `Category` | required |
| `questGiver` | `{ name; avatar? }` | Subdokument |
| `reward` | number | optional (`> 0` ⇒ „paid") |
| `timeLimit` | string | optional (gesetzt ⇒ „timed") |
| `difficulty` | `Difficulty` | Default `medium` |
| `acceptedBy` / `acceptedAt` | string\|null / Date\|null | Lifecycle |
| `completedBy` / `completedAt` | string\|null / Date\|null | Lifecycle |

**Enums:**

- `Category`: `sport`, `social`, `adventure`, `skill`, `mystery`
- `Difficulty`: `easy`, `medium`, `hard`

## Message

| Feld | Typ | Hinweis |
|------|-----|---------|
| `senderId` | ObjectId → User | required, indexed |
| `recipientId` | ObjectId → User | required, indexed |
| `body` | string | required, max 2000 |
| `read` | boolean | `false` |
| `readAt` | Date | – |

Compound-Indizes: `{ senderId, recipientId, createdAt: -1 }` und
`{ recipientId, read }`.

Frontend: `Message { id, senderId, recipientId, body, read, createdAt }`,
`Conversation { user{...}, lastMessage{...}, unreadCount }`.

## Dragon

| Feld | Typ | Default |
|------|-----|---------|
| `userId` | string | required, **unique** (1 Drache/Nutzer) |
| `type` | `DragonType` | required |
| `name` | string | optional |
| `xp` | number | `0` |
| `evolutionStage` | `EvolutionStage` | `egg` |
| `currentStreak` | number | `0` |
| `lastStreakDate` | string\|null | `YYYY-MM-DD` |
| `lastQuestCompletedAt` | Date\|null | – |
| `questsCompletedToday` | number | `0` |
| `lastQuestDate` | string\|null | `YYYY-MM-DD` |

**Enums:**

- `DragonType`: `ember`, `tide`, `thorn`, `gloom`, `spark`
- `EvolutionStage`: `egg`, `hatchling`, `whelp`, `drake`, `elder_dragon`
- (Frontend zusätzlich) `DragonMood`: `happy`, `content`, `lonely`, `sad`

`XpResult = { xpAwarded, bonusBreakdown { baseXp, firstOfDayBonus, streakMultiplier, streak }, dragon }`.

## UserRpgQuest

Persistiert nur den Abschluss-Status pro Nutzer (Quest-Inhalte sind statische
Templates, siehe [game-systems.md](./game-systems.md)).

| Feld | Typ | Hinweis |
|------|-----|---------|
| `userId` | string | required |
| `templateId` | string | required |
| `zoneType` | `ZoneType` | required |
| `questType` | `NpcQuestType` | required |
| `xpReward` | number | required |
| `expiresAt` | Date | required (Cooldown-Ende) |
| `completedAt` | Date\|null | – |

Index: `{ userId, templateId, expiresAt }`.

**Enums:**

- `ZoneType`: `taverne`, `arena`, `bibliothek`, `tempel`
- `NpcQuestType`: `daily`, `weekly`

## Inventar (nur Frontend, localStorage)

Kein Backend-Schema — der `useInventoryStore` persistiert unter
`sidequest-inventory`.

- `ItemRarity`: `common`, `uncommon`, `rare`, `legendary`
- `EffectType`: `glow`, `particle`, `trail`, `aura`, `enchant`
- `ItemSource`: `chest_common`, `chest_rare`, `chest_legendary`, `level_up`, `quest`
- `InventoryWeapon` (`templateId` ∈ `sword | dagger | spear | staff`,
  `appliedEffects[]`, `upgrades[]`), `InventoryArmor` (`baseDefense`),
  `InventoryEffect`
- `StatUpgrade { stat, value, source, obtainedAt }`

## Karte (Frontend)

- `UserLocation { lat, lng }`
- `MapViewState { latitude, longitude, zoom }` — Default Berlin `52.52 / 13.405`, Zoom 12

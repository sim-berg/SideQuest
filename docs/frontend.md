# Frontend (React)

React 19 + TypeScript + Vite 7. State mit Zustand 5, Karte mit MapLibre GL
(`react-map-gl/maplibre`), Realtime mit `socket.io-client`, Animation mit
`motion`. Tailwind CSS v4 ist **CSS-first** in `src/index.css` konfiguriert
(kein `tailwind.config.js`). UI durchgehend deutschsprachig.

## Einstieg & Navigation

**Es gibt keine Router-Library.** Navigation ist state-getrieben über
`useUIStore.activeTab`.

- **`main.tsx`** — `createRoot` in `StrictMode`; initialisiert Dark Mode aus
  `localStorage('sidequest-dark')` durch Toggle von `.dark` auf `<html>`.
- **`App.tsx`** — umhüllt alles mit `<MapProvider>`. Beim Mount: stiller
  `refreshToken()` (App läuft auch ohne Login), `fetchQuests()` und – wenn
  authentifiziert – `getUnreadCount()` sowie `fetchDragon()` (falls
  `user.hasDragon`). Führt `useUserLocation()` und `useRealtimeMessages()` aus.
- **Tab-Rendering:** Der **Map-Tab bleibt immer gemountet** (nur `hidden`), um
  den Kartenzustand zu erhalten; `chat`/`profile`/`rpg`/`dungeon` werden nur bei
  passendem `activeTab` gerendert. Overlays liegen immer darüber.
- **`BottomNavBar`** — 5 Tabs: `map` (Karte), `rpg` (Abenteuer), `dungeon`
  (Kerker), `chat` (Nachrichten, mit Unread-Badge), `profile` (Profil).
  `PROTECTED_TABS = ['chat','create','profile','rpg','dungeon']` lösen den
  `AuthPrompt` aus, wenn nicht eingeloggt.
- **`TopNavBar`** — nur auf dem Map-Tab: links Filter-Dropdown, Mitte Titel,
  rechts Menü (Profil, Chat, Dark-Mode-Toggle).
- **`ActiveTab`** = `'map' | 'chat' | 'create' | 'profile' | 'rpg' | 'dungeon'`.
  `'create'` ist speziell: keine eigene Seite, sondern Karten-Picking-Modus +
  Create-Wizard.

## Zustand-Stores (`stores/`)

| Store | Verantwortung (Auszug) |
|-------|------------------------|
| `useAuthStore` | `user`, `accessToken`, `isAuthenticated`. Verdrahtet `setAuthHandlers` in die API-Schicht; `setAuth` ruft `connectSocket(token)`, `clearAuth` ruft `disconnectSocket`. |
| `useUIStore` | Sämtliche UI-/Navigations-/Overlay-States: `activeTab`, BottomSheet, Create-Wizard (`createWizardStep` 0–4, `pickingLocation`, `pickedLocation`), Dark Mode (persistiert), `showAuthPrompt`/`pendingAuthTab`, `dungeonGameActive`. |
| `useQuestStore` | `quests`, `selectedQuest`, `activeQuest`, In-Flight-Flags (`isAccepting`, `isCompleting`); `updateQuestInList`. |
| `useFilterStore` | `categories` (Default alle), `distanceKm` (5), `paidOnly`, `timedOnly`. |
| `useMapStore` | `userLocation`, `locationError`, `viewState` (Default Berlin). |
| `useNearbyUsersStore` | `nearbyUsers[]` für Echtzeit-Marker. |
| `useChatStore` | `conversations`, `activeChat`, `messages` (pro userId), `typingUsers`, `totalUnread`; Pagination via `prependMessages`, `ensureConversation` (optimistisch). |
| `useDragonStore` | `dragon`, `isLoading`; `fetchDragon()`. |
| `useRpgStore` | `activeZone`, `zoneUnlocks`-Cache, `quests`, `lastCompletionResult`; `fetchQuests(zone)`, `completeQuest(templateId)`. |
| `useInventoryStore` | Waffen/Rüstung/Effekte. **Persistiert** (`persist`, Key `sidequest-inventory`). Rein clientseitig. |

## Services (`services/`)

Basis-URL: `import.meta.env.VITE_API_URL || '/api'`. Im Dev proxyt Vite `/api`
und `/socket.io` auf `localhost:3000`.

- **`api.ts`** — generischer fetch-Wrapper (`get/post/patch/del`). Setzt
  `Authorization: Bearer <token>` und `credentials: 'include'`. **Bei 401**
  automatisch `POST /auth/refresh`, einmaliger Retry, sonst `onAuthFailed`.
- **`auth.service.ts`** — `register`, `login`, `refreshToken`, `logout`
  (rohes fetch mit `credentials: 'include'`, da Refresh-Token httpOnly-Cookie).
- **`quest.service.ts`** — kompletter Quest-CRUD + accept/complete/abandon +
  `my/active` / `my/completed`.
- **`message.service.ts`** — conversations, history (`?before=`), send, read,
  unread-count.
- **`dragon.service.ts`** — `GET /dragons/me`, `POST /dragons/choose`.
- **`rpg.service.ts`** — `GET /rpg/quests?zone=`, complete, mine.
- **`socket.service.ts`** — Socket.IO-Client; URL = `VITE_API_URL` ohne `/api`
  bzw. `http://localhost:3000`, `auth: { token }`, `transports: ['websocket']`.
- **`geolocation.service.ts`** — Wrapper um `navigator.geolocation.watchPosition`.
- **`distance.service.ts`** — `haversineDistance` (km).

## Hooks (`hooks/`)

- **`useUserLocation`** — startet GPS-Watch → `useMapStore`; zentriert die Kamera
  einmalig (Zoom 14) auf den ersten Fix.
- **`useRealtimeMessages`** — abonniert (wenn authentifiziert) `message:new`,
  `message:read`, `message:typing`; aktualisiert Konversationen/Unread,
  Auto-Mark-Read bei offenem Chat, 3 s Typing-Timeout.
- **`useLocationSharing`** — nur bei `user.shareLocation`: emittet
  `location:update` sofort + alle 10 s, hört auf `location:nearby`, sendet beim
  Cleanup `location:stop`.
- **`useFilteredQuests`** — memoisierte Filterung nach Kategorie, paidOnly,
  timedOnly und Haversine-Distanz ≤ `distanceKm`.
- **`useQuestDistance(lat,lng)`** — Distanz Nutzer → Punkt.
- **`useZoneUnlock`** — prüft RPG-Zonen über die **Overpass-API** (OSM-Amenities
  im `unlockRadius`), 5-min-TTL-Cache. **`VITE_RPG_DEBUG === 'true'` schaltet
  alle Zonen frei.**

## Komponenten (`components/`)

| Ordner | Zweck |
|--------|-------|
| `auth/` | `AuthPrompt` (Modal bei geschütztem Tab), `LoginPage`, `RegisterPage`, `AuthGuard` |
| `chat/` | `ChatInbox`, `ChatView`, `ChatBubble` (Read-Ticks), `TypingIndicator` |
| `common/` | `FloatingActionButton`, `LoadingSpinner` |
| `dragon/` | `DragonDisplay` (Pet-Karte: Stufen-Emoji, Stimmung, XP-Bar), `DragonSelection`, `XpToast` |
| `dungeon/` | `DungeonView` (Stil-Auswahl), `DungeonGame` (Canvas-Minispiel), `DungeonGenerator.ts` (Seeded-Generator) |
| `filters/` | `FilterBar`, `CategoryChip`, `DistanceSelect`, `ToggleFilter` |
| `layout/` | `AppShell` (Root-Container) |
| `map/` | `QuestMap`, `QuestMarkerLayer` (Supercluster), `QuestMarker`, `QuestClusterMarker`, `UserLocationMarker`, `NearbyUsersLayer`, `NearbyUserMarker` |
| `navigation/` | `BottomNavBar`, `TopNavBar`, `NewQuestFAB` |
| `profile/` | `ProfilePage`, `InventorySection`, `UserProfileSheet` |
| `quest/` | `BottomSheet` (`react-modal-sheet`), `QuestDetail`, `QuestInfoPage`, `CreateQuestPage` (Wizard), `CategoryBadge`, `QuestReward`, `QuestTimeLimit` |
| `rpg/` | `RPGView` (Zonen-Auswahl), `RPGGame` (Top-Down-Canvas), `RPGQuestModal`, `TouchControls` |

## Konstanten (`constants/`)

- **`categories.ts`** — `CATEGORY_META`: sport (#22c55e 🏃), social (#3b82f6 👥),
  adventure (#f59e0b ⚔️), skill (#a855f7 🧠), mystery (#ef4444 🔮).
- **`difficulty.ts`** — easy (Leicht, 25 XP), medium (Mittel, 50 XP),
  hard (Schwer, 100 XP).
- **`dragons.ts`** — `DRAGON_META` (deutsche Namen + Element + Emoji je Stufe),
  `EVOLUTION_THRESHOLDS`, `EVOLUTION_LABELS`, `MOOD_META`.
- **`inventory.ts`** — Unlock-Level für Waffen/Rüstung, Chest-Upgrade-Chancen,
  Upgrade-Magnituden je Rarität.
- **`map.ts`** — `DEFAULT_VIEW_STATE` (Berlin z12), OpenFreeMap-Styles
  `liberty`/`dark`, `DISTANCE_OPTIONS = [1, 5, 10]`.
- **`rpg-zones.ts`** — `ZONE_DEFS` (4 Zonen mit Kollisionsgrids, OSM-Amenities,
  NPCs, Hintergründen). Details in [game-systems.md](./game-systems.md).

## Typen siehe [data-models.md](./data-models.md).

## Build & Styling

- **`vite.config.ts`** — Plugins `@vitejs/plugin-react` + `@tailwindcss/vite`;
  `server.host: true`, Dev-Proxy für `/api` und `/socket.io` (ws).
- **Tailwind v4** — `@import "tailwindcss"` in `index.css`, Custom-Variant
  `dark`, `@theme` definiert Quest-Kategorie-Farben (`--color-quest-*` →
  `bg-quest-*`). `cn()` kombiniert `clsx` + `tailwind-merge`.

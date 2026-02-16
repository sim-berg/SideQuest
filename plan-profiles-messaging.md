# Plan: User Profiles & Realtime Messaging

## Overview

Add user authentication with profiles and a realtime direct messaging system. Users can register, log in, customize their profile, and send messages to other users (e.g., quest givers or nearby players). Messages are delivered in realtime via the same WebSocket infrastructure from the position-sharing feature.

This plan assumes the **realtime position plan** (`plan.md`) is implemented first, since it establishes the socket.io infrastructure this plan builds upon.

---

## Part 1: User Profiles & Authentication

### Architecture Decisions

**Auth strategy:** JWT with access + refresh tokens
- Access token: short-lived (15 min), stored in memory only
- Refresh token: long-lived (7 days), stored in httpOnly cookie
- Why JWT over sessions: stateless, works naturally with WebSocket handshake auth, no server-side session store needed

**Password hashing:** bcrypt (industry standard, built-in salt)

**Database:** MongoDB with Mongoose
- The backend is already architected for a MongoDB drop-in (service layer pattern)
- User documents and message documents need persistence — in-memory won't work here

**Why MongoDB over PostgreSQL:**
- Existing codebase is designed around it (mentioned in README roadmap)
- Flexible schema suits evolving user profiles
- Native geospatial queries ($near) useful for future proximity features

---

### Backend Changes

#### 1. Install dependencies

```bash
cd backend
npm install @nestjs/mongoose mongoose @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt
```

#### 2. Add MongoDB connection

**File:** `backend/src/app.module.ts`

```typescript
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/sidequest'),
    // ... existing modules
  ],
})
```

#### 3. Create User schema & model

**File:** `backend/src/user/schemas/user.schema.ts`

```typescript
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, unique: true, trim: true, minlength: 3, maxlength: 24 })
  username: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ default: '' })
  displayName: string;         // shown on map markers and in messages

  @Prop({ default: '' })
  avatarUrl: string;           // profile picture URL

  @Prop({ default: '' })
  bio: string;                 // short user bio (max 200 chars)

  @Prop({ default: 1 })
  level: number;               // gamification (future XP system)

  @Prop({ default: 0 })
  questsCompleted: number;

  @Prop({ default: true })
  isOnline: boolean;

  @Prop()
  lastSeenAt: Date;
}
```

**Indexes:**
- `email`: unique
- `username`: unique

#### 4. Create `AuthModule` — registration & login

**File:** `backend/src/auth/auth.module.ts`
**File:** `backend/src/auth/auth.controller.ts`
**File:** `backend/src/auth/auth.service.ts`
**File:** `backend/src/auth/strategies/jwt.strategy.ts`
**File:** `backend/src/auth/guards/jwt-auth.guard.ts`
**File:** `backend/src/auth/dto/register.dto.ts`
**File:** `backend/src/auth/dto/login.dto.ts`

**Endpoints:**

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account, return tokens |
| POST | `/api/auth/login` | Public | Validate credentials, return tokens |
| POST | `/api/auth/refresh` | Cookie | Issue new access token from refresh token |
| POST | `/api/auth/logout` | JWT | Clear refresh token cookie |

**Register flow:**
1. Validate DTO (email, username 3-24 chars, password 8+ chars)
2. Check email/username uniqueness
3. Hash password with bcrypt (12 rounds)
4. Create User document
5. Generate JWT access token + refresh token
6. Return `{ accessToken, user: { id, username, displayName, avatarUrl } }`
7. Set refresh token in httpOnly cookie

**Login flow:**
1. Find user by email
2. Compare password with bcrypt
3. Generate tokens, return same shape as register

**JWT payload:**
```typescript
{ sub: userId, username: string, iat: number, exp: number }
```

#### 5. Create `UserModule` — profile management

**File:** `backend/src/user/user.module.ts`
**File:** `backend/src/user/user.controller.ts`
**File:** `backend/src/user/user.service.ts`
**File:** `backend/src/user/dto/update-profile.dto.ts`

**Endpoints:**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users/me` | JWT | Get own profile |
| PATCH | `/api/users/me` | JWT | Update displayName, bio, avatarUrl |
| GET | `/api/users/:id` | JWT | Get another user's public profile |

**Public profile shape** (returned for other users):
```typescript
{
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  level: number;
  questsCompleted: number;
  isOnline: boolean;
  lastSeenAt: string;
}
```

Private fields (email, passwordHash) are never exposed.

#### 6. Integrate auth with WebSocket gateway

**File:** `backend/src/position/position.gateway.ts` (modify)

Update the existing `PositionGateway` to:
- Extract JWT from handshake `auth.token` on connection
- Validate token → get real `userId` and `displayName`
- Reject unauthenticated connections with `client.disconnect()`
- Use real user profile data for position broadcasts (avatar, displayName)
- Update `user.isOnline` and `user.lastSeenAt` on connect/disconnect

#### 7. Register new modules

**File:** `backend/src/app.module.ts`

```typescript
@Module({
  imports: [
    MongooseModule.forRoot(...),
    AuthModule,
    UserModule,
    QuestModule,
    PositionModule,  // from realtime position plan
  ],
})
```

---

### Frontend Changes

#### 8. Create auth types

**File:** `frontend/src/types/user.ts`

```typescript
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  level: number;
  questsCompleted: number;
  isOnline: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}
```

#### 9. Create `useAuthStore` — Zustand store for auth state

**File:** `frontend/src/stores/useAuthStore.ts`

```typescript
interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  updateUser: (partial: Partial<User>) => void;
}
```

- Access token in memory (not localStorage — more secure against XSS)
- Refresh token in httpOnly cookie (handled by browser automatically)
- On app load: attempt silent refresh via `/api/auth/refresh`

#### 10. Create auth service

**File:** `frontend/src/services/auth.service.ts`

```typescript
export async function register(email: string, username: string, password: string): Promise<AuthResponse>
export async function login(email: string, password: string): Promise<AuthResponse>
export async function refreshToken(): Promise<AuthResponse>   // uses cookie
export async function logout(): Promise<void>
```

All API calls include `credentials: 'include'` for cookie handling.

#### 11. Create API client with token interceptor

**File:** `frontend/src/services/api.ts`

A thin wrapper around `fetch` that:
- Attaches `Authorization: Bearer <token>` from auth store
- On 401 response: attempts silent refresh, retries request once
- Provides typed `get`, `post`, `patch`, `delete` methods

#### 12. Update socket service for auth

**File:** `frontend/src/services/socket.service.ts` (modify)

Pass JWT token in socket handshake:
```typescript
socket = io(SOCKET_URL, {
  auth: { token: useAuthStore.getState().accessToken },
  // ...existing config
});
```

#### 13. Create auth UI components

**File:** `frontend/src/components/auth/LoginPage.tsx`

Full-screen login form:
- Email + password inputs
- "Login" button
- Link to register page
- Error message display
- Matches existing dark mode support

**File:** `frontend/src/components/auth/RegisterPage.tsx`

Full-screen registration form:
- Email + username + password + confirm password
- Inline validation (username length, password strength, match check)
- "Register" button
- Link to login page

**File:** `frontend/src/components/auth/AuthGuard.tsx`

Wrapper component:
```typescript
export default function AuthGuard({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt silent refresh on mount
    refreshToken()
      .then((res) => setAuth(res.user, res.accessToken))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <LoginPage />;
  return <>{children}</>;
}
```

#### 14. Create profile UI components

**File:** `frontend/src/components/profile/ProfilePage.tsx`

Slide-over full-screen page (same pattern as `QuestInfoPage`):
- Avatar (circle, large, with edit overlay)
- Display name (editable)
- Username (read-only)
- Bio (textarea, max 200 chars)
- Stats: Level, Quests Completed
- "Save" button → PATCH `/api/users/me`
- "Logout" button

**File:** `frontend/src/components/profile/ProfileButton.tsx`

Small circular avatar button in the top-left corner of the map:
- Shows user avatar or first letter of displayName
- Tap opens `ProfilePage`
- Positioned opposite the dark mode toggle (top-left vs top-right)

**File:** `frontend/src/components/profile/UserProfileSheet.tsx`

Bottom sheet for viewing another user's profile (opened by tapping a nearby user marker on the map):
- Read-only view of public profile
- "Send message" button → opens chat with that user
- Reuses existing `<Sheet>` pattern from `BottomSheet.tsx`

#### 15. Integrate auth in `App.tsx`

**File:** `frontend/src/App.tsx` (modify)

```tsx
export default function App() {
  return (
    <MapProvider>
      <AuthGuard>
        <AppContent />
      </AuthGuard>
    </MapProvider>
  );
}
```

Add `<ProfileButton />` to `AppContent`.

---

## Part 2: Realtime Messaging

### Architecture Decisions

**Message delivery:** Hybrid — REST for history, WebSocket for live delivery
- Load conversation history via REST API (paginated)
- New messages delivered instantly via socket.io events
- Messages always persisted to MongoDB first, then broadcast

**Conversation model:** Direct messages only (1:1)
- No group chats for now — keeps the data model simple
- A "conversation" is derived from the pair of participants, not a separate entity

**Message storage:** MongoDB collection with compound index on participants
- Query pattern: "get messages between user A and user B, sorted by time, paginated"
- Index: `{ participants: 1, createdAt: -1 }`

**Why not a separate Conversation collection:**
- With only 1:1 DMs, the conversation is implicitly defined by the two user IDs
- Avoids an extra join/lookup
- A `conversations` aggregation query can derive the inbox view

---

### Backend Changes

#### 16. Create Message schema

**File:** `backend/src/message/schemas/message.schema.ts`

```typescript
@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  senderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  recipientId: Types.ObjectId;

  @Prop({ required: true, maxlength: 2000 })
  body: string;

  @Prop({ default: false })
  read: boolean;

  @Prop()
  readAt: Date;
}
```

**Indexes:**
- Compound: `{ senderId: 1, recipientId: 1, createdAt: -1 }` — efficient conversation queries
- `{ recipientId: 1, read: 1 }` — efficient unread count queries

#### 17. Create `MessageModule` with REST endpoints

**File:** `backend/src/message/message.module.ts`
**File:** `backend/src/message/message.controller.ts`
**File:** `backend/src/message/message.service.ts`
**File:** `backend/src/message/dto/send-message.dto.ts`

**Endpoints:**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/messages/conversations` | JWT | List conversations (inbox) |
| GET | `/api/messages/:userId` | JWT | Get message history with a specific user |
| POST | `/api/messages/:userId` | JWT | Send a message (also triggers WS broadcast) |
| PATCH | `/api/messages/:userId/read` | JWT | Mark all messages from user as read |
| GET | `/api/messages/unread-count` | JWT | Total unread message count |

**GET `/api/messages/conversations`** response:
```typescript
[
  {
    user: { id, username, displayName, avatarUrl, isOnline },
    lastMessage: { body, createdAt, senderId },
    unreadCount: number,
  },
  // ...
]
```

Implemented as a MongoDB aggregation:
1. Match messages where current user is sender OR recipient
2. Group by the "other" user ID
3. Sort by most recent message
4. Lookup user profile for the "other" user
5. Count unread messages per conversation

**GET `/api/messages/:userId`** — paginated (cursor-based):
- Query params: `before` (message ID for cursor), `limit` (default 50)
- Returns messages sorted newest-first
- Client reverses for display

**POST `/api/messages/:userId`**:
1. Validate body (1-2000 chars, trim whitespace)
2. Verify recipient exists
3. Save message to MongoDB
4. Emit via WebSocket to recipient if online (see step 18)
5. Return created message

#### 18. Create `MessageGateway` — WebSocket events for messaging

**File:** `backend/src/message/message.gateway.ts`

Extends the socket.io infrastructure from the position plan. Can either be a separate gateway on the same server or events added to the existing gateway. Separate gateway is cleaner:

```typescript
@WebSocketGateway({ cors: { origin: 'http://localhost:5173' } })
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  // Map: userId → socketId (for targeted delivery)
  private userSockets = new Map<string, string>();

  handleConnection(client: Socket) {
    // Extract userId from JWT in handshake
    // Register in userSockets map
  }

  handleDisconnect(client: Socket) {
    // Remove from userSockets map
  }

  // Called by MessageService after persisting a message
  sendToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }
}
```

**Events:**

| Event | Direction | Payload | Description |
|---|---|---|---|
| `message:new` | Server → Client | `{ id, senderId, senderName, senderAvatar, body, createdAt }` | New message received |
| `message:read` | Server → Client | `{ userId }` | Recipient read your messages |
| `message:typing` | Client → Server | `{ recipientId }` | User is typing |
| `message:typing` | Server → Client | `{ senderId }` | Other user is typing |

**Typing indicator:** Stateless — client emits `message:typing` every 2 seconds while actively typing, server forwards to the recipient. Frontend shows "typing..." for 3 seconds after last event (auto-expires).

#### 19. Register module

**File:** `backend/src/app.module.ts`

Add `MessageModule` to imports.

---

### Frontend Changes

#### 20. Create message types

**File:** `frontend/src/types/message.ts`

```typescript
export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    isOnline: boolean;
  };
  lastMessage: {
    body: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
}
```

#### 21. Create `useChatStore` — Zustand store for messaging

**File:** `frontend/src/stores/useChatStore.ts`

```typescript
interface ChatState {
  conversations: Conversation[];           // inbox list
  activeChat: string | null;               // userId of open chat
  messages: Map<string, Message[]>;        // userId → messages cache
  typingUsers: Set<string>;                // userIds currently typing
  totalUnread: number;

  setConversations: (convs: Conversation[]) => void;
  openChat: (userId: string) => void;
  closeChat: () => void;
  addMessage: (userId: string, msg: Message) => void;
  setMessages: (userId: string, msgs: Message[]) => void;
  prependMessages: (userId: string, msgs: Message[]) => void;  // pagination
  markRead: (userId: string) => void;
  setTyping: (userId: string, isTyping: boolean) => void;
  setTotalUnread: (count: number) => void;
}
```

#### 22. Create message service

**File:** `frontend/src/services/message.service.ts`

```typescript
export async function getConversations(): Promise<Conversation[]>
export async function getMessages(userId: string, before?: string): Promise<Message[]>
export async function sendMessage(userId: string, body: string): Promise<Message>
export async function markAsRead(userId: string): Promise<void>
export async function getUnreadCount(): Promise<number>
```

#### 23. Create `useRealtimeMessages` hook

**File:** `frontend/src/hooks/useRealtimeMessages.ts`

Listens for socket events and updates the chat store:

```typescript
export function useRealtimeMessages() {
  const { addMessage, setTyping, setTotalUnread } = useChatStore();

  useEffect(() => {
    const socket = getSocket();

    socket.on('message:new', (msg) => {
      // Add to messages cache for that sender
      // Update conversations list (bump to top, update lastMessage)
      // Increment unread count if chat not currently open
      // If chat IS open, auto-mark as read
    });

    socket.on('message:read', ({ userId }) => {
      // Update read status for messages sent to that user
    });

    socket.on('message:typing', ({ senderId }) => {
      setTyping(senderId, true);
      // Auto-clear after 3 seconds
    });

    return () => {
      socket.off('message:new');
      socket.off('message:read');
      socket.off('message:typing');
    };
  }, []);
}
```

#### 24. Create messaging UI components

**File:** `frontend/src/components/chat/ChatInbox.tsx`

Full-screen slide-over page listing all conversations:
- Each row: avatar, displayName, last message preview (truncated), time, unread badge
- Online indicator (green dot on avatar)
- Sorted by most recent message
- Tap a row → open `ChatView` for that user
- Pull-to-refresh or auto-refresh on focus
- Empty state: "No messages yet"

**File:** `frontend/src/components/chat/ChatView.tsx`

Full-screen chat view with a specific user:
- Top bar: back button, user avatar + name, online status
- Message list: scrollable, grouped by date
  - Own messages: right-aligned, indigo background
  - Other's messages: left-aligned, gray/slate background
  - Timestamps below each message cluster
  - "Typing..." indicator at bottom when other user types
- Bottom input bar:
  - Text input (auto-grow textarea, max 2000 chars)
  - Send button (disabled when empty)
  - Emits `message:typing` while user is typing (debounced 2s)
- Auto-scroll to bottom on new message
- Infinite scroll upward for older messages (cursor-based pagination)
- Mark messages as read when chat is opened / scrolled into view

**File:** `frontend/src/components/chat/ChatBubble.tsx`

Individual message bubble:
```
┌─────────────────────┐
│  Message text here   │  Rounded corners, max-width 75%
│            12:34  ✓  │  Time + read receipt (checkmark)
└─────────────────────┘
```

- Own messages: `bg-indigo-500 text-white`, rounded-bl
- Their messages: `bg-slate-100 dark:bg-slate-800`, rounded-br
- Read receipt: single check (sent) → double check (read), only on own messages

**File:** `frontend/src/components/chat/ChatButton.tsx`

Floating button to open the inbox, positioned above the existing FAB:
- Chat icon (speech bubble)
- Unread count badge (red circle with number, hidden when 0)
- Fixed position: bottom-right, above the "+" FAB

**File:** `frontend/src/components/chat/TypingIndicator.tsx`

Animated "..." dots shown when the other user is typing:
- Three bouncing dots in a chat bubble shape
- Uses `motion` library for animation
- Auto-hides after 3 seconds of no typing events

#### 25. Wire "Nachricht" button in QuestInfoPage

**File:** `frontend/src/components/quest/QuestInfoPage.tsx` (modify)

Replace the placeholder `alert()` on the "Nachricht an {questGiver}" button:
- Look up or create the quest giver's user ID
- Open `ChatView` for that user
- (Note: requires mapping `questGiver` to a real user — initially this can open a chat with a static/mock user until quest creation links quests to real user accounts)

#### 26. Integrate into `App.tsx`

**File:** `frontend/src/App.tsx` (modify)

- Call `useRealtimeMessages()` in `AppContent`
- Add `<ChatButton />` to the layout
- Add `<ChatInbox />` and `<ChatView />` (conditionally rendered based on chat store state)

---

## Event Protocol Summary (Messaging)

| Event | Direction | Payload | Description |
|---|---|---|---|
| `message:new` | Server → Client | `{ id, senderId, senderName, senderAvatar, body, createdAt }` | New message for you |
| `message:read` | Server → Client | `{ userId }` | Your messages were read by userId |
| `message:typing` | Client → Server | `{ recipientId }` | I am typing to recipientId |
| `message:typing` | Server → Client | `{ senderId }` | senderId is typing to you |

---

## File Change Summary

### New files — Backend (12)

| File | Purpose |
|---|---|
| `backend/src/auth/auth.module.ts` | Auth module |
| `backend/src/auth/auth.controller.ts` | Register, login, refresh, logout endpoints |
| `backend/src/auth/auth.service.ts` | Password hashing, token generation |
| `backend/src/auth/strategies/jwt.strategy.ts` | Passport JWT strategy |
| `backend/src/auth/guards/jwt-auth.guard.ts` | Route guard decorator |
| `backend/src/auth/dto/register.dto.ts` | Registration validation DTO |
| `backend/src/auth/dto/login.dto.ts` | Login validation DTO |
| `backend/src/user/user.module.ts` | User module |
| `backend/src/user/user.controller.ts` | Profile endpoints |
| `backend/src/user/user.service.ts` | User CRUD service |
| `backend/src/user/schemas/user.schema.ts` | Mongoose user schema |
| `backend/src/user/dto/update-profile.dto.ts` | Profile update validation |
| `backend/src/message/message.module.ts` | Message module |
| `backend/src/message/message.controller.ts` | Conversation & message endpoints |
| `backend/src/message/message.service.ts` | Message CRUD + aggregation |
| `backend/src/message/message.gateway.ts` | WebSocket events for messaging |
| `backend/src/message/schemas/message.schema.ts` | Mongoose message schema |
| `backend/src/message/dto/send-message.dto.ts` | Message validation DTO |

### New files — Frontend (12)

| File | Purpose |
|---|---|
| `frontend/src/types/user.ts` | User & auth TypeScript types |
| `frontend/src/types/message.ts` | Message & conversation types |
| `frontend/src/stores/useAuthStore.ts` | Auth state (user, token) |
| `frontend/src/stores/useChatStore.ts` | Chat state (conversations, messages) |
| `frontend/src/services/auth.service.ts` | Auth API calls |
| `frontend/src/services/message.service.ts` | Message API calls |
| `frontend/src/services/api.ts` | Fetch wrapper with auth headers |
| `frontend/src/hooks/useRealtimeMessages.ts` | Socket listener for chat events |
| `frontend/src/components/auth/LoginPage.tsx` | Login form |
| `frontend/src/components/auth/RegisterPage.tsx` | Registration form |
| `frontend/src/components/auth/AuthGuard.tsx` | Auth gate wrapper |
| `frontend/src/components/profile/ProfilePage.tsx` | Profile edit page |
| `frontend/src/components/profile/ProfileButton.tsx` | Avatar button on map |
| `frontend/src/components/profile/UserProfileSheet.tsx` | View other user's profile |
| `frontend/src/components/chat/ChatInbox.tsx` | Conversation list |
| `frontend/src/components/chat/ChatView.tsx` | 1:1 chat screen |
| `frontend/src/components/chat/ChatBubble.tsx` | Message bubble |
| `frontend/src/components/chat/ChatButton.tsx` | Floating inbox button with badge |
| `frontend/src/components/chat/TypingIndicator.tsx` | Typing animation |

### Modified files (5)

| File | Change |
|---|---|
| `backend/src/app.module.ts` | Add MongooseModule, AuthModule, UserModule, MessageModule |
| `backend/src/main.ts` | Add cookie-parser middleware |
| `backend/src/position/position.gateway.ts` | Add JWT auth on handshake |
| `frontend/src/services/socket.service.ts` | Pass auth token in handshake |
| `frontend/src/components/quest/QuestInfoPage.tsx` | Wire "Nachricht" button to open chat |
| `frontend/src/App.tsx` | Add AuthGuard, ProfileButton, ChatButton, useRealtimeMessages |

---

## Implementation Order

### Phase 1: Database + Auth (do first — everything depends on it)
1. Install backend deps (mongoose, jwt, passport, bcrypt)
2. Add MongooseModule connection to AppModule
3. Create User schema
4. Create AuthModule (register, login, refresh, logout)
5. Create JwtStrategy + JwtAuthGuard
6. Create UserModule (profile CRUD)
7. Test auth endpoints with curl/Postman

### Phase 2: Frontend Auth
8. Create `api.ts` fetch wrapper
9. Create `auth.service.ts`
10. Create `useAuthStore`
11. Create LoginPage + RegisterPage + AuthGuard
12. Wrap App in AuthGuard
13. Test: register, login, refresh on reload, logout

### Phase 3: User Profiles
14. Create ProfilePage + ProfileButton
15. Create UserProfileSheet
16. Update socket handshake to use JWT (both frontend and backend gateway)
17. Test: edit profile, view other profiles, authenticated socket connection

### Phase 4: Messaging Backend
18. Create Message schema
19. Create MessageModule (REST endpoints)
20. Create MessageGateway (socket events)
21. Test: send message via REST, receive via WS

### Phase 5: Messaging Frontend
22. Create `useChatStore`
23. Create `message.service.ts`
24. Create `useRealtimeMessages` hook
25. Create ChatInbox, ChatView, ChatBubble, ChatButton, TypingIndicator
26. Wire "Nachricht" button in QuestInfoPage
27. Integrate into App.tsx
28. Test: full flow — send message, receive in realtime, typing indicator, read receipts

---

## Database Collections Summary

### `users`
```
{
  _id: ObjectId,
  email: "user@example.com",
  username: "adventurer42",
  passwordHash: "$2b$12$...",
  displayName: "Adventurer 42",
  avatarUrl: "",
  bio: "I love quests!",
  level: 1,
  questsCompleted: 0,
  isOnline: true,
  lastSeenAt: ISODate,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### `messages`
```
{
  _id: ObjectId,
  senderId: ObjectId → users,
  recipientId: ObjectId → users,
  body: "Hey, want to join this quest?",
  read: false,
  readAt: null,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

---

## Security Considerations

- **Passwords:** bcrypt with 12 salt rounds, never stored or returned in plaintext
- **JWT:** Access tokens short-lived (15 min), refresh tokens in httpOnly secure cookies
- **Input validation:** All DTOs validated with class-validator, message body capped at 2000 chars
- **Rate limiting:** Consider adding `@nestjs/throttler` to auth endpoints (5 attempts/min for login)
- **XSS:** Message body rendered as text only (no HTML/markdown parsing)
- **Authorization:** Users can only read their own conversations, messages always verified server-side
- **Socket auth:** JWT validated on every WebSocket connection, invalid tokens = disconnect

---

## Future Considerations (not in scope)

- **Avatar upload:** Image upload to S3/Cloudinary with resize (currently URL-based)
- **Group chats:** Conversation collection, membership management
- **Message reactions:** Emoji reactions on messages
- **Push notifications:** FCM/APNs for messages when app is backgrounded
- **Message search:** Full-text search across message history
- **Block/report:** User blocking and content moderation
- **E2E encryption:** Client-side encryption for message privacy
- **OAuth:** Login with Google/GitHub as alternative to email/password

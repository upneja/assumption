# Architecture Documentation

**pregame.lol** - Mobile-First Party Games Platform

Last updated: 2025-11-25

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Patterns](#architecture-patterns)
4. [Data Flow](#data-flow)
5. [Database Schema](#database-schema)
6. [State Management](#state-management)
7. [Realtime Synchronization](#realtime-synchronization)
8. [Security Model](#security-model)
9. [File Structure](#file-structure)
10. [Key Subsystems](#key-subsystems)

---

## System Overview

pregame.lol is a real-time multiplayer party game platform featuring two social deduction games: **Assumptions** and **Guess the Imposter**. The platform is designed for in-person play where one person hosts on a large screen and others join on their phones.

### Core Characteristics

- **No authentication required**: Players join with just a name and room code
- **Real-time synchronization**: All clients stay in sync via Supabase Realtime
- **Mobile-first design**: Optimized for phone screens, responsive for larger displays
- **Host-controlled flow**: One player has authority to advance game phases
- **Session-based identity**: LocalStorage UUIDs maintain player identity across refreshes
- **Serverless architecture**: Next.js API routes + Supabase backend

### Supported Player Counts

- Assumptions: 3-20 players
- Guess the Imposter: 3-20 players (1 imposter for 3-7 players, 2 for 8+)

---

## Technology Stack

### Frontend

- **Next.js 16**: React framework with App Router
  - Server Components for initial rendering
  - Client Components for interactive UI
  - API Routes for backend logic
- **React 19**: Latest React with React Compiler enabled
- **TypeScript 5**: Full type safety across the codebase
- **Tailwind 4**: Utility-first CSS with PostCSS integration
- **Geist Font**: Clean, modern typeface for UI

### Backend & Infrastructure

- **Supabase**: Postgres database + realtime + auth infrastructure
  - Database: PostgreSQL for data storage
  - Realtime: WebSocket-based pub/sub for state sync
  - RLS: Row Level Security for read-only client access
- **Vercel**: Deployment platform (optimized for Next.js)
- **Node.js 18+**: Runtime environment

### Development Tools

- **Vitest**: Unit testing framework
- **Testing Library**: React component testing
- **Playwright**: End-to-end testing
- **MSW**: API mocking for tests
- **ESLint**: Code linting
- **TypeScript**: Type checking

---

## Architecture Patterns

### 1. Client-Server Separation

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Client (React) │────────▶│  API Routes      │────────▶│  Supabase   │
│  - UI rendering │  HTTP   │  - Validation    │  Admin  │  - Database │
│  - Local state  │◀────────│  - State machine │◀────────│  - Realtime │
│  - Realtime sub │         │  - Broadcast     │         │             │
└─────────────────┘         └──────────────────┘         └─────────────┘
         │                                                        │
         └────────────── Realtime Channel ──────────────────────┘
```

**Key Principles:**
- Clients never write to database directly (blocked by RLS)
- All mutations go through validated API routes
- Server uses service role key, bypasses RLS
- Realtime keeps clients synchronized

### 2. State Machine Pattern

Both games use explicit state machines to control game flow:

**Assumptions State Machine:**
```
LOBBY → ASSIGNMENT → INTRO → WHEEL → HOTSEAT → VOTING → REVEAL → SCOREBOARD → COMPLETE
                               ↑__________________________________|
```

**Imposter State Machine:**
```
LOBBY → SECRET_REVEAL → VOTING → REVEAL (→ GAME_OVER or loop back)
          ↑_________________________|
```

- State transitions are validated in `gameEngine.ts`
- Only host can trigger transitions
- Invalid transitions are rejected server-side

### 3. Broadcast-Based Synchronization

State updates flow through a consistent pattern:

1. Client action (e.g., host clicks "Next")
2. HTTP request to API route
3. Server validates request
4. Server updates database
5. Server broadcasts to Supabase Realtime channel
6. All subscribed clients receive broadcast
7. Clients update local React state
8. UI re-renders

**Why this works:**
- Single source of truth (database)
- No complex client-side state reconciliation
- Latest state always wins (no message queuing)
- Self-broadcast simplifies client logic

### 4. Service Layer Pattern

Business logic is organized into service modules:

- `gameEngine.ts`: Pure functions for game rules (no I/O)
- `roomService.ts`: Database operations for Assumptions game
- `imposterService.ts`: Database operations for Imposter game
- `realtime.ts`: Subscription management
- `session.ts`: Identity management

Services are imported by API routes and contain no HTTP handling logic.

### 5. Repository Pattern

API routes follow a consistent structure:

```typescript
export async function POST(request: Request) {
  try {
    // 1. Parse and validate request
    const { sessionId, ...params } = await request.json();

    // 2. Authenticate player
    const player = await findPlayerBySession(sessionId, roomCode);
    if (!player) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // 3. Authorize action (e.g., check is_host)
    if (!player.is_host) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // 4. Execute business logic
    const result = await performAction(params);

    // 5. Broadcast update
    await broadcastToRoom(roomCode, 'event_type', result);

    // 6. Return response
    return Response.json(result);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

## Data Flow

### Room Creation Flow

```
1. User enters name
2. Client calls POST /api/rooms
   ├─ Body: { displayName, sessionId, gameType }
3. Server creates room record
4. Server creates host player record
5. Server returns { room, player }
6. Client stores room code in localStorage
7. Client navigates to /room/[code]
8. Client subscribes to realtime channel
```

### Join Room Flow

```
1. User enters code and name
2. Client calls POST /api/rooms/[code]/join
   ├─ Body: { displayName, sessionId }
3. Server validates room exists
4. Server creates player record
5. Server broadcasts players_updated event
6. All clients receive updated player list
7. New player's client navigates to room page
```

### Game Phase Transition Flow

```
1. Host clicks action button (e.g., "Start Game")
2. Client calls POST /api/rooms/[code]/start
   ├─ Body: { sessionId }
3. Server validates host authorization
4. Server validates current state allows transition
5. Server updates room.state in database
6. Server broadcasts room_updated event
7. All clients receive new room state
8. Clients re-render appropriate phase component
```

### Vote Submission Flow

```
1. Player selects vote target
2. Client calls POST /api/rooms/[code]/vote
   ├─ Body: { sessionId, guessedTargetId }
3. Server upserts vote record
4. Server broadcasts players_updated (if all votes in)
5. All clients see vote count update
6. Host can advance to reveal phase
```

---

## Database Schema

### Entity-Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐
│     rooms       │────┐    │     players     │
├─────────────────┤    │    ├─────────────────┤
│ id (PK)         │    └───▶│ id (PK)         │
│ code (UQ)       │         │ room_id (FK)    │
│ host_player_id  │◀────────│ session_id      │
│ state           │         │ display_name    │
│ game_type       │         │ is_host         │
│ round_number    │         │ score           │
│ hotseat_player_id│◀───┐   │ role            │
│ hotseat_history │    │   │ is_alive        │
│ topic           │    │   └─────────────────┘
│ secret_word     │    │            │
└─────────────────┘    │            │
         │             │            │
         │             │   ┌────────┴─────────┐
         │             │   │                  │
         ▼             │   ▼                  ▼
┌──────────────────┐  │ ┌────────┐    ┌──────────────┐
│   assignments    │  │ │ votes  │    │ imposter_... │
├──────────────────┤  │ ├────────┤    ├──────────────┤
│ room_id (FK)     │  │ │ ...    │    │ ...          │
│ giver_player_id  │──┘ └────────┘    └──────────────┘
│ target_player_id │
│ round_number     │
└──────────────────┘
```

### Tables

#### rooms
Core game session container.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Unique identifier |
| code | text | UNIQUE, NOT NULL | 6-letter room code |
| host_player_id | uuid | FK → players.id | Host player |
| state | text | NOT NULL | Current game phase |
| game_type | text | DEFAULT 'ASSUMPTIONS' | ASSUMPTIONS or IMPOSTER |
| round_number | int | DEFAULT 1 | Current round counter |
| hotseat_player_id | uuid | FK → players.id | (Assumptions) Current hotseat |
| hotseat_history | text[] | DEFAULT '{}' | (Assumptions) Past hotseat IDs |
| topic | text | NULL | (Imposter) Current topic |
| secret_word | text | NULL | (Imposter) Current secret word |
| created_at | timestamptz | DEFAULT now() | Creation time |
| updated_at | timestamptz | DEFAULT now() | Last update time |

**Indexes:**
- `idx_rooms_code` on `code` (for fast lookups by room code)

**Triggers:**
- `update_rooms_updated_at`: Auto-update `updated_at` on modifications

#### players
Individual participants in games.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Unique identifier |
| room_id | uuid | FK → rooms.id ON DELETE CASCADE | Associated room |
| display_name | text | NOT NULL | Player's chosen name (1-20 chars) |
| is_host | boolean | DEFAULT false | Host privileges flag |
| session_id | text | NOT NULL | LocalStorage UUID |
| score | int | DEFAULT 0 | Current point total |
| role | text | NULL | (Imposter) CIVILIAN or IMPOSTER |
| is_alive | boolean | DEFAULT true | (Imposter) Elimination status |
| joined_at | timestamptz | DEFAULT now() | Join timestamp |
| last_seen_at | timestamptz | DEFAULT now() | Last activity timestamp |

**Indexes:**
- `idx_players_room_id` on `room_id`
- `idx_players_session_id` on `session_id`

**Constraints:**
- Cascade delete when room is deleted
- Display name length check: `length(display_name) BETWEEN 1 AND 20`

#### assignments
Target assignments for Assumptions game.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| room_id | uuid | FK → rooms.id | Game room |
| giver_player_id | uuid | FK → players.id | Player who will pretend |
| target_player_id | uuid | FK → players.id | Player to pretend to be |
| round_number | int | NOT NULL | Assignment round |

**Primary Key:** `(room_id, giver_player_id, round_number)`

**Constraints:**
- `giver_player_id ≠ target_player_id` (no self-assignment)
- Forms circular chain (everyone has exactly one target)

#### votes
Voting records for Assumptions game.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Unique identifier |
| room_id | uuid | FK → rooms.id | Game room |
| hotseat_player_id | uuid | FK → players.id | Player who was hotseat |
| guesser_player_id | uuid | FK → players.id | Player who voted |
| guessed_target_id | uuid | FK → players.id | Voted target |
| is_correct | boolean | NULL | True if guess was right (set on reveal) |
| round_number | int | NOT NULL | Voting round |
| created_at | timestamptz | DEFAULT now() | Vote timestamp |

**Indexes:**
- `idx_votes_room_round` on `(room_id, round_number)`

#### imposter_clues
Clue submissions for Imposter game.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Unique identifier |
| room_id | uuid | FK → rooms.id | Game room |
| round_number | int | NOT NULL | Clue round |
| player_id | uuid | FK → players.id | Clue submitter |
| text | text | NOT NULL | Clue content |
| created_at | timestamptz | DEFAULT now() | Submission time |

**Indexes:**
- `idx_imposter_clues_room_round` on `(room_id, round_number)`

#### imposter_votes
Voting records for Imposter game.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Unique identifier |
| room_id | uuid | FK → rooms.id | Game room |
| round_number | int | NOT NULL | Voting round |
| voter_id | uuid | FK → players.id | Player who voted |
| target_id | uuid | FK → players.id | Suspected imposter |
| created_at | timestamptz | DEFAULT now() | Vote timestamp |

**Indexes:**
- `idx_imposter_votes_room_round` on `(room_id, round_number)`

**Constraints:**
- One vote per player per round (upsert pattern)

### Row Level Security (RLS)

**Policy: Public Read Access**
```sql
CREATE POLICY "Enable read access for all users" ON [table_name]
  FOR SELECT USING (true);
```

Applied to: `rooms`, `players`, `assignments`, `votes`, `imposter_clues`, `imposter_votes`

**Policy: No Write Access**
- No INSERT/UPDATE/DELETE policies defined for anon key
- All writes must use service role key (API routes only)

**Realtime:**
All tables are added to `supabase_realtime` publication for change notifications.

---

## State Management

### Client-Side State

Each game room page maintains local React state using `useState`:

```typescript
// Room state from database
const [room, setRoom] = useState<Room | null>(null);

// Players list (live-updated via realtime)
const [players, setPlayers] = useState<Player[]>([]);

// Assignments (Assumptions only)
const [assignments, setAssignments] = useState<Assignment[]>([]);

// Current player (derived from sessionId)
const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

// UI state
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### State Hydration

On page load, state is populated from three sources:

1. **LocalStorage** (instant, may be stale):
   ```typescript
   const seedData = localStorage.getItem(`room_${code}`);
   if (seedData) {
     const { room, players } = JSON.parse(seedData);
     setRoom(room);
     setPlayers(players);
   }
   ```

2. **API Fetch** (fresh data):
   ```typescript
   const response = await fetch(`/api/rooms/${code}`);
   const { room, players, assignments } = await response.json();
   setRoom(room);
   setPlayers(players);
   setAssignments(assignments);
   ```

3. **Realtime Subscription** (live updates):
   ```typescript
   const unsubscribe = subscribeToRoom(code, {
     onRoomUpdate: setRoom,
     onPlayersUpdate: setPlayers,
     onAssignmentsUpdate: setAssignments,
   });
   return unsubscribe; // Cleanup on unmount
   ```

### State Derivation

Some state is computed from base state:

```typescript
// Current player (from sessionId)
const currentPlayer = useMemo(() =>
  players.find(p => p.session_id === getSessionId()),
  [players]
);

// Is current player the host?
const isHost = currentPlayer?.is_host ?? false;

// Current player's assignment (Assumptions)
const myAssignment = useMemo(() =>
  assignments.find(a => a.giver_player_id === currentPlayer?.id),
  [assignments, currentPlayer]
);
```

---

## Realtime Synchronization

### Channel Architecture

Each room has a dedicated Supabase Realtime channel:

- **Channel name**: `room:${roomCode}` (e.g., `room:ABC123`)
- **Type**: Broadcast channel (not database change notifications)
- **Configuration**: `{ broadcast: { self: true } }`

### Event Types

**Assumptions Game:**
- `room_updated`: Room properties changed (state, round, hotseat_player_id)
- `players_updated`: Player list or scores changed
- `assignments_updated`: New assignments created
- `wheel_spin`: Wheel animation trigger with selected player ID

**Imposter Game:**
- `imposter_room_updated`: Room properties changed
- `imposter_players_updated`: Players, roles, or scores changed
- `imposter_clues_updated`: Clue submissions
- `imposter_votes_updated`: Vote submissions
- `imposter_round_result`: Round results with elimination data

### Broadcast Pattern

Server-side (API route):
```typescript
import { supabase } from '@/lib/supabaseClient'; // Or use server client with broadcast

await supabase.channel(`room:${code}`).send({
  type: 'broadcast',
  event: 'players_updated',
  payload: { players: updatedPlayers },
});
```

Client-side (React component):
```typescript
import { subscribeToRoom } from '@/lib/realtime';

useEffect(() => {
  const unsubscribe = subscribeToRoom(roomCode, {
    onPlayersUpdate: (players) => {
      setPlayers(players);
      // Optional: update localStorage cache
      localStorage.setItem(`room_${roomCode}`, JSON.stringify({ players }));
    },
  });
  return unsubscribe;
}, [roomCode]);
```

### Synchronization Guarantees

- **Eventually consistent**: All clients will receive all broadcasts
- **No ordering guarantee**: Messages may arrive out of order (rare)
- **Latest wins**: Clients always use most recent broadcast
- **No history**: Late joiners don't receive past broadcasts
- **Automatic reconnection**: Supabase client handles connection drops

---

## Security Model

### Defense in Depth

1. **RLS Policies**: Database-level restrictions
   - Anonymous key can only READ data
   - All writes blocked at database level

2. **API Validation**: Request-level checks
   - Session ID validated against player records
   - Host authorization checked for privileged actions
   - State machine transitions validated

3. **Service Role Isolation**: Admin client never exposed
   - Service role key in server-only env vars
   - Admin client imported only in API routes
   - Build-time check prevents client bundling

### Session ID Security

**Intentionally insecure for player identity:**
- Session IDs are UUIDs stored in localStorage
- Anyone can copy and reuse a session ID
- This is acceptable because:
  - Players are physically present (trust context)
  - Game data is not sensitive
  - Worst case: Someone votes as you (social accountability)

**Protection against random attackers:**
- Room codes are 6-letter random strings (26^6 = 308M combinations)
- Codes expire when rooms are deleted (no reuse)
- Short session duration (few hours typically)

### Host Authorization

Host-only actions require validation:

```typescript
// 1. Identify player
const player = await supabaseAdmin
  .from('players')
  .select('*')
  .eq('room_id', roomId)
  .eq('session_id', sessionId)
  .single();

if (!player) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

// 2. Check host status
if (!player.is_host) {
  return Response.json({ error: 'Forbidden' }, { status: 403 });
}

// 3. Proceed with action
```

### Environment Variables

**Client-safe (NEXT_PUBLIC_*):**
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anonymous access key

**Server-only:**
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Admin access key (NEVER expose)

**Verification:**
- Ensure `.env.local` is in `.gitignore`
- Never log service role key
- Use `process.env` checks to prevent client bundling

---

## File Structure

```
web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Home page (game selection)
│   │   ├── layout.tsx                # Root layout
│   │   ├── how-to-play/
│   │   │   └── page.tsx              # Rules page
│   │   ├── room/[code]/
│   │   │   └── page.tsx              # Assumptions game room
│   │   ├── imposter/room/[code]/
│   │   │   └── page.tsx              # Imposter game room
│   │   └── api/                      # API routes
│   │       ├── rooms/
│   │       │   ├── route.ts          # POST create room
│   │       │   └── [code]/
│   │       │       ├── route.ts      # GET room state
│   │       │       ├── join/route.ts # POST join room
│   │       │       ├── start/route.ts# POST start game
│   │       │       ├── spin/route.ts # POST spin wheel
│   │       │       ├── vote/route.ts # POST submit vote
│   │       │       └── next/route.ts # POST advance phase
│   │       └── imposter/rooms/       # Imposter game routes
│   │           └── [similar structure]
│   │
│   ├── components/                   # React components
│   │   ├── LobbyView.tsx             # Pre-game waiting room
│   │   ├── IntroView.tsx             # Assignment reveal
│   │   ├── WheelView.tsx             # Wheel spin animation
│   │   ├── HotseatView.tsx           # Q&A phase
│   │   ├── VotingView.tsx            # Guessing phase
│   │   ├── RevealView.tsx            # Answer reveal
│   │   ├── ScoreboardView.tsx        # Round results
│   │   ├── CompleteView.tsx          # Game over
│   │   ├── AvatarChip.tsx            # Player display
│   │   └── TimerBar.tsx              # Countdown timer
│   │
│   ├── lib/                          # Utility libraries
│   │   ├── session.ts                # Session ID management
│   │   ├── supabaseClient.ts         # Browser Supabase client
│   │   ├── supabaseServer.ts         # Server Supabase client
│   │   ├── realtime.ts               # Realtime subscriptions
│   │   ├── gameEngine.ts             # Game rules & state machine
│   │   ├── roomService.ts            # Assumptions game service
│   │   └── imposterService.ts        # Imposter game service
│   │
│   └── types/
│       └── index.ts                  # TypeScript type definitions
│
├── supabase/
│   └── schema.sql                    # Database schema
│
├── public/                           # Static assets
├── package.json                      # Dependencies
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
└── vitest.config.ts                  # Test configuration
```

---

## Key Subsystems

### 1. Game Engine (`lib/gameEngine.ts`)

Pure TypeScript module with no I/O dependencies. Contains:

- **State machine**: Valid transitions between game phases
- **Assignment logic**: Circular chain generation (no self-assignment)
- **Hotseat selection**: Random selection from eligible players
- **Game end detection**: Check if all players have been hotseat
- **Room code generation**: 6-letter uppercase codes (exclude I/O)

**Key functions:**
- `isValidTransition(from, to)`: Check if phase transition is allowed
- `getNextPhase(currentPhase, event)`: Determine next phase from event
- `assignPlayersRandomly(players)`: Create circular assignment chain
- `selectHotseat(players, history)`: Pick next hotseat player
- `shouldEndGame(playerCount, hotseatHistory)`: Check completion
- `generateRoomCode()`: Create unique 6-letter code

### 2. Room Service (`lib/roomService.ts`)

Database operations for Assumptions game. Uses `supabaseAdmin` client.

**Key functions:**
- `createRoom(displayName, sessionId)`: Create room + host player
- `joinRoom(code, displayName, sessionId)`: Add player to room
- `getRoomState(code)`: Fetch room, players, assignments
- `startGame(code)`: Create assignments, transition to INTRO
- `advancePhase(code, event)`: Execute state transition
- `spinWheel(code)`: Select hotseat, update room
- `submitVote(code, sessionId, targetId)`: Record vote
- `revealVotes(code)`: Calculate results, update scores

### 3. Imposter Service (`lib/imposterService.ts`)

Database operations for Imposter game.

**Key functions:**
- `startImposterRound(roomId, topic)`: Pick word, assign roles
- `assignImposterRoles(players, count)`: Random imposter selection
- `submitImposterVote(roomId, voterId, targetId)`: Upsert vote
- `resolveImposterRound(roomId)`: Eliminate player, check win condition
- `summarizeImposterRound(roomId, roundNum)`: Calculate round results

**Topic system:**
- Hardcoded topics: Athletes, Foods, Animals, Countries, Careers, Movies, Celebrities, Apps
- Each topic has 8 words
- Random selection per round

### 4. Realtime System (`lib/realtime.ts`)

Subscription management for Supabase Realtime.

**Key functions:**
- `subscribeToRoom(code, callbacks)`: Assumptions game subscription
- `subscribeToImposterRoom(code, callbacks)`: Imposter game subscription
- `unsubscribeFromRoom()`: Manual cleanup

**Pattern:**
```typescript
useEffect(() => {
  const cleanup = subscribeToRoom(code, {
    onRoomUpdate: setRoom,
    onPlayersUpdate: setPlayers,
  });
  return cleanup;
}, [code]);
```

### 5. Session Management (`lib/session.ts`)

Lightweight identity without authentication.

**Key functions:**
- `getSessionId()`: Get or create session UUID
- `clearSession()`: Remove session (testing/debugging)

**Storage:**
- LocalStorage key: `assumptions_session_id`
- Value: UUID v4 string
- Persistent across refreshes

---

## Performance Considerations

### 1. Initial Load Optimization

- **LocalStorage caching**: Instant UI from cached data
- **Parallel fetching**: Room, players, assignments fetched concurrently
- **Progressive enhancement**: Show cached data, then update with fresh data

### 2. Realtime Efficiency

- **Single channel per room**: Minimal WebSocket overhead
- **Broadcast model**: No database polling
- **Latest wins**: No message queue, newest state always used
- **Self-broadcast enabled**: Simplifies client logic

### 3. Database Indexing

- **Code lookups**: Indexed on `rooms.code`
- **Player queries**: Indexed on `players.room_id` and `players.session_id`
- **Vote queries**: Indexed on `(room_id, round_number)`

### 4. React Optimizations

- **useMemo**: Computed values cached (e.g., current player)
- **useCallback**: Event handlers stable across renders
- **Component splitting**: Phase views isolated, minimize re-renders

---

## Future Extension Points

### 1. Persistent Rooms

Currently rooms are ephemeral (deleted on completion). To add persistence:

- Add `completed_at` timestamp
- Add `is_archived` boolean
- Modify cleanup logic in API routes
- Add room history view

### 2. Reconnection Logic

Currently no explicit reconnection handling. To improve:

- Track `last_seen_at` on player records
- Add rejoin endpoint to restore player state
- Handle mid-game joins/rejoins
- Display connection status to user

### 3. Custom Question System

Assumptions game uses IRL questions. To add custom questions:

- Add `questions` table (room_id, player_id, text)
- Add submission phase to state machine
- Implement question pool logic
- Add question packs with categories

### 4. Advanced Scoring

Current scoring is simple (+1 for correct guess). To enhance:

- Add time bonuses
- Add streak multipliers
- Add achievements/badges
- Add leaderboard across rooms

### 5. Analytics & Metrics

Currently no analytics. To add:

- Track game duration
- Track player engagement (votes per player)
- Track popular topics (Imposter)
- Track win rates by role

---

## Troubleshooting

### Common Issues

1. **Players not syncing**
   - Check realtime subscription is active
   - Verify Supabase Realtime is enabled
   - Check browser console for WebSocket errors

2. **Room not found**
   - Verify room code is correct (case-sensitive)
   - Check room hasn't been deleted
   - Verify Supabase connection

3. **Host can't advance game**
   - Check player is actually host (is_host flag)
   - Verify current state allows transition
   - Check API route logs for validation errors

4. **Session lost on refresh**
   - Check localStorage is enabled
   - Verify session_id is persisting
   - Check player record exists with that session_id

### Debug Tools

- **Browser DevTools**: Check localStorage, network requests
- **Supabase Dashboard**: Query database directly
- **Realtime Inspector**: View channel subscriptions
- **React DevTools**: Inspect component state

---

## Conclusion

This architecture provides a solid foundation for real-time multiplayer party games:

- **Simple**: No authentication, minimal setup
- **Scalable**: Serverless architecture handles concurrent rooms
- **Reliable**: RLS + validation prevents data corruption
- **Fast**: LocalStorage caching + realtime updates
- **Maintainable**: Clear separation of concerns, typed interfaces

The system is designed for rapid iteration and easy extension while maintaining code quality and type safety.

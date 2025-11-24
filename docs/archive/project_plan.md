# Assumptions — Project Plan (MVP)

This document is the authoritative specification for Claude Code and Codex.  
All architectural, structural, or behavioral decisions must reference this file.

---

# 1. PROJECT DESCRIPTION

A real-time, mobile-first browser party game. A host creates a room, players join with a code, and the game proceeds through structured phases:

1. Lobby
2. Assignment
3. Intro
4. Wheel
5. Hotseat
6. Scoreboard
7. Complete

Game logic is deterministic, controlled by a central state machine, and synchronized across clients using Supabase Realtime.

---

# 2. MVP SCOPE

### Must Have
- Create room
- Join room
- Lobby with live player list
- Host-only "Start Game"
- Random assignment of “who guesses whom”
- Intro phase
- Wheel spin to pick hotseat
- Hotseat guessing UI (basic)
- Scoreboard (basic)
- Realtime updates
- No accounts (local session ID only)
- Mobile-first UI

### Excluded (Not MVP)
- Custom questions
- Question packs
- Avatars
- Multi-round scoring
- Rejoin logic for mid-round
- Moderation/admin features

---

# 3. TECH STACK

- **Frontend:** Next.js 14 (App Router), TypeScript, TailwindCSS  
- **Database:** Supabase Postgres  
- **Realtime:** Supabase Realtime (tables + broadcast)  
- **Backend:** Next.js API Routes + Server Components  
- **Auth:** Local `session_id` stored in `localStorage`  
- **Deploy:** Vercel (frontend) + Supabase (backend)

---

# 4. DIRECTORY STRUCTURE

Expected structure for the `web/` app:

web/
src/
app/
page.tsx
room/
[code]/
page.tsx
components/
LobbyView.tsx
IntroView.tsx
WheelView.tsx
HotseatView.tsx
ScoreboardView.tsx
lib/
session.ts
supabaseClient.ts
supabaseServer.ts
realtime.ts
gameEngine.ts
roomService.ts
types/
index.ts


---

# 5. DATABASE SCHEMA

## rooms
- id (uuid, pk)
- code (text, unique)
- host_player_id (uuid)
- state (text)
- round_number (int)
- created_at (timestamptz)
- updated_at (timestamptz)

## players
- id (uuid, pk)
- room_id (uuid fk → rooms.id)
- display_name (text)
- is_host (boolean)
- session_id (text)
- joined_at (timestamptz)
- last_seen_at (timestamptz)

## assignments
- room_id (uuid fk → rooms.id)
- giver_player_id (uuid fk → players.id)
- target_player_id (uuid fk → players.id)
- round_number (int)
- PRIMARY KEY (room_id, giver_player_id, round_number)

---

# 6. GAME STATE MACHINE

## Phases
- LOBBY
- ASSIGNMENT
- INTRO
- WHEEL
- HOTSEAT
- SCOREBOARD
- COMPLETE

## Valid Transitions
- LOBBY → ASSIGNMENT  
- ASSIGNMENT → INTRO  
- INTRO → WHEEL  
- WHEEL → HOTSEAT  
- HOTSEAT → SCOREBOARD  
- SCOREBOARD → WHEEL  
- SCOREBOARD → COMPLETE  

## Authority
- Only the **host** may trigger transitions.
- Server enforces all transitions (client cannot mutate DB directly).

---

# 7. BACKEND DESIGN (API ROUTES)

All endpoints live under: src/app/api/rooms/

### POST /api/rooms
Creates a room + host player.

### POST /api/rooms/[code]/join
Adds a player to a room.

### POST /api/rooms/[code]/start
Host-only. Moves `LOBBY → ASSIGNMENT`.

### POST /api/rooms/[code]/next
Host-only. Moves to next logical phase.

### POST /api/rooms/[code]/spin
Host-only. Chooses hotseat player.

### API Route Requirements
- Validate host via `session_id`
- Load room + players
- Apply state transition using `gameEngine.ts`
- Write updates through Supabase service role client
- Broadcast via Supabase realtime channel: `room:{code}`

---

# 8. GAME ENGINE (PURE TYPESCRIPT)

File: `lib/gameEngine.ts`

Exports:
- `GamePhase`
- `GameState`
- `GameEvent`
- `reduceGameState(state, event)`
- `assignPlayersRandomly(players)`
- `selectHotseat(players)`

The engine:
- Contains no IO
- Is deterministic
- Enforces all state transitions

---

# 9. REALTIME SYSTEM

File: `lib/realtime.ts`

Uses Supabase Realtime to:
- Join channel: `room:{code}`
- Listen for:
  - `state_update`
  - `players_update`
  - `assignments_update`
- Apply updates to React state via callbacks

Server API routes must broadcast updates after each mutation.

---

# 10. IDENTITY SYSTEM

File: `lib/session.ts`

- Generate `session_id` on first load
- Store in `localStorage`
- Reuse on every request
- All API calls include `session_id` in the body

Server uses `(session_id, room_id)` to map to a player row.

---

# 11. SERVICE LAYER

File: `lib/roomService.ts`

Functions:
- `createRoom(displayName, sessionId)`
- `joinRoom(code, displayName, sessionId)`
- `getRoom(code)`
- `advanceState(room, event)`
- `createAssignments(room)`
- `setHotseat(room, playerId)`

Should use Supabase **service role** client (server only).

---

# 12. DEVELOPMENT WORKFLOW (CLAUDE CODE)

### Always:
1. `/plan`  
2. Review the generated plan  
3. `/run` to apply

### Claude Responsibilities
- Architecture
- Plans
- Code reviews
- Catching race conditions, security issues
- Enforcing state machine

### Codex Responsibilities
- Implementing files specified in a plan  
- Making no architectural decisions  
- Only writing code, not changing design

---

# 13. INITIAL TASK LIST FOR AGENTS

1. Implement `lib/session.ts`
2. Implement `lib/supabaseClient.ts`
3. Implement `lib/supabaseServer.ts`
4. Implement `types/index.ts`
5. Implement `gameEngine.ts`
6. Implement `roomService.ts`
7. Implement API routes:
   - `/api/rooms`
   - `/api/rooms/[code]/join`
   - `/api/rooms/[code]/start`
   - `/api/rooms/[code]/next`
   - `/api/rooms/[code]/spin`
8. Implement realtime client (`realtime.ts`)
9. Implement landing page UI
10. Implement `room/[code]/page.tsx` with phase rendering

---

# 14. IMPORTANT RULES FOR AGENTS

- Do not contradict this plan.
- Do not add technologies not listed here.
- Do not create additional tables.
- All logic must flow through the game engine (no rogue DB updates).
- API routes cannot trust client input.
- Realtime broadcasts follow DB mutations.

---

# END OF DOCUMENT

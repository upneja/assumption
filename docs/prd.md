# Assumptions — Product Requirements Document (PRD)

**Tagline:**  
*Kahoot meets Jackbox in a browser-based IRL game for mutuals to get to know each other.*

This PRD describes the **full vision** and the **MVP scope**.  
Claude Code should **only implement MVP now**, but must understand all future phases.

---

# 1. GAME OVERVIEW

Assumptions is a fast-paced social deduction + Q&A party game played in-person, with everyone joining via their phone’s browser. One host creates a room, everyone else joins using a short code, and the game progresses through a series of rounds where players make assumptions about each other.

The experience is:

- **Mobile-first**
- **Hosted locally by a friend**
- **No accounts, no installation**
- **Simple join flow (name + code)**
- **Supports 3–20 players**

The game has multiple rounds and phases involving question writing, assignments, intros, a wheel spin, a hotseat, and voting.

---

# 2. CORE GAME PHASES (FULL SPEC)

These represent the **complete game**, not the MVP.

## 2.1 Room Creation
Host can configure:
- Max players
- Enabled question packs:
  - General
  - Gaming
  - Fashion
  - Food
  - Jobs
  - Spicy
  - College  
- Weight percentages per pack (default equal)  
- Topic progression (optional)
- Allow/disallow custom questions
- Submission timer (default 60 seconds x 3 rounds)
- Kick ability from lobby (remove players or duplicates)

Room creation produces:
- A unique alphanumeric room code
- Host lobby management controls

## 2.2 Join Room
Player flow:
- Enter code
- Enter display name
- (Optional future) Choose avatar
- Enter lobby

Lobby displays:
- All joined players
- Room settings (read-only except for host)

Host controls:
- Kick
- Start game

---

## 2.3 Submission Round (Full Spec)
- Each player submits **3 custom questions**
- 3 rounds × 1 minute timer
- UI: Text input + submit button + countdown
- If a player fails to submit in time:
  - Auto-fill with a random question from enabled packs
- Display progress (e.g., “2/3 submitted”)
- End when all players have submitted or timer expires per round

---

## 2.4 Assignment Round
- Each player is assigned **one target player** (the person they will answer about)
- No one can get themselves
- Assignments must be 1:1 mapping (perfect derangement)
- Players only see the **name** of who they’re assigned

---

## 2.5 Intros Round
IRL round:
- Everyone introduces themselves out loud
- Their phone screen still shows only their assigned target’s name
- Host clicks “Next” to proceed

---

## 2.6 Wheel of Misfortune
- A wheel displays all players who haven’t been hotseat yet
- When spun:
  - Choose a random player
  - Remove them from wheel pool
  - That person becomes **hotseat**

---

## 2.7 Hotseat Round (Full Spec)
- **3 random players** (excluding hotseat) are selected as questioners
- Each receives **1 question**:
  - Must be one they did NOT write
  - Can be from:
    - Another player’s custom submissions  
    - Pack questions based on weights
- They ask questions in any order IRL
- Hotseat answers
- All players guess **who the hotseat is assigned to**
- After voting:
  - Hotseat reveals their target

Scoring:
- Players who guess correctly get points
- The hotseat gets points for correctly answering questions (future expansion)

---

## 2.8 Endgame
- Continue wheel → hotseat cycles until only 2 players remain
- Final 2 both enter hotseat together
- Everyone guesses who has who
- Grand reveal
- Final scoreboard shown

---

# 3. MVP SCOPE (BUILD THIS NOW)

Claude should **only implement the following** at this stage.  
Everything else is future-phase and should not be coded yet.

## MVP = Minimal Playable Loop

### MVP Includes:
- Create room (no settings)
- Join room
- Lobby with live player list
- Host starts game

### Game Phases Implemented in MVP:
1. **Assignment Round**
   - Random 1:1 assignments
   - Display “Your target: X”

2. **Intros Round**
   - Static text: “Introduce yourselves IRL”
   - Host-only “Next” button

3. **Wheel of Misfortune**
   - Pure random selection from remaining pool
   - Remove selected person from pool
   - Display chosen hotseat

4. **Hotseat Round**
   - Hotseat answers IRL
   - Everyone else guesses who the hotseat is assigned
   - Hotseat reveals target

5. **Scoreboard Round**
   - Show who guessed correctly
   - Host “Next Round” button

6. **Game End Condition**
   - When 2 people remain, both are hotseat
   - Everyone guesses
   - Reveal
   - Show final scoreboard

### MVP Excludes:
- Question submission round  
- Question packs  
- Weighted question distribution  
- Custom question toggle  
- Kick feature  
- Avatars  
- Timers  
- Complex scoring  
- Moderation tools  
- Topic progression  
- Rejoin logic  

---

# 4. TECHNICAL REQUIREMENTS

## Frontend
- Next.js 14+ App Router
- React Server Components where appropriate
- TailwindCSS
- Mobile-first responsive layout
- LocalStorage-based `session_id` for identity

## Backend
- Next.js API routes with Supabase service role
- Supabase Postgres (rooms, players, assignments)
- Supabase Realtime channels (`room:{code}`)

## Realtime Events
- `state_update`
- `players_update`
- `assignments_update`

---

# 5. DATA MODEL (MVP)

### rooms
| field | type | notes |
|-------|------|--------|
| id | uuid | pk |
| code | text | unique |
| host_player_id | uuid | fk players |
| state | text | game phase |
| round_number | int | default 1 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### players
| field | type | notes |
|-------|------|--------|
| id | uuid | pk |
| room_id | uuid | fk rooms |
| display_name | text | |
| is_host | boolean | |
| session_id | text | identifies browser session |
| joined_at | timestamptz | |
| last_seen_at | timestamptz | |

### assignments
| field | type | notes |
|-------|------|--------|
| room_id | uuid | fk rooms |
| giver_player_id | uuid | fk players |
| target_player_id | uuid | fk players |
| round_number | int | |
| PRIMARY KEY | (room_id, giver_player_id, round_number) | |

---

# 6. GAME STATE MACHINE (MVP)

| State | Description |
|--------|-------------|
| LOBBY | Waiting room |
| ASSIGNMENT | Create assignments |
| INTRO | IRL introductions |
| WHEEL | Spin to choose hotseat |
| HOTSEAT | Guessing/answering |
| SCOREBOARD | Show results |
| COMPLETE | Game finished |

Transitions:
- LOBBY → ASSIGNMENT  
- ASSIGNMENT → INTRO  
- INTRO → WHEEL  
- WHEEL → HOTSEAT  
- HOTSEAT → SCOREBOARD  
- SCOREBOARD → WHEEL  
- SCOREBOARD → COMPLETE  

Only host can trigger transitions.

---

# 7. UI REQUIREMENTS (MVP)

### Landing Page
- Two buttons: Create Room, Join Room
- Join Room → enter code → enter name

### Lobby
- Live list of players
- Host sees “Start Game” button

### Assignment
- Show “Your target: X”

### Intro
- Static instructions
- Host: “Next”

### Wheel
- Button: “Spin”
- Show chosen hotseat
  
### Hotseat
- Hotseat sees “You are hotseat”
- Others see a UI to guess who the hotseat's assignment is
- Host: “Reveal”
- Then: “Next Round”

### Scoreboard
- Show who guessed correctly

### Complete
- Show final standings

---

# 8. FUTURE PHASES (DO NOT BUILD YET)
Claude should understand but not implement:
- Question submission
- Pack-based questions
- Weights
- Kick
- Avatars
- Timers
- Multi-hotseat logic
- Full scoring ecosystem
- Topic progression
- Rejoin logic
- Analytics

---

# 9. ACCEPTANCE CRITERIA (MVP)

- 3+ players can join a room
- Host can start game
- All devices receive realtime updates
- Assignments random & correct (no self assignment)
- Wheel always chooses an unpicked player
- Hotseat is displayed correctly
- Guessing works
- Scoreboard updates
- Game ends correctly when 2 remain
- Zero server errors
- Zero client-side exceptions

---

# END OF DOCUMENT

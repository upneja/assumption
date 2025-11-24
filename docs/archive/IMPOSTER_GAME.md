# Imposter Game — Technical Specification (Host-Selected Topics)

This document defines the complete requirements for the Imposter Game, in a form suitable for implementation. It covers the full design, MVP scope, backend requirements, frontend flows, and a strict state machine.

-------------------------------------------------------------------------------

# 1. Game Overview

Imposter Game is a real-time, mobile-first social deduction game. The host creates a room, players join via code, and each round:

- The host chooses a topic (for example, athletes, foods, movies)
- The system selects a secret word inside that topic
- Civilians receive the topic and secret word
- Imposters receive only the topic
- Everyone gives clues
- Everyone votes who the Imposter is
- Someone is eliminated
- Civilians try to eliminate all Imposters
- Imposters try to avoid detection and reach parity

Supports 3–20 players, no accounts required.

-------------------------------------------------------------------------------

# 2. Core Mechanics

## 2.1 Roles

### Civilians
- See the chosen topic
- See the secret word
- Goal: give clues that reference the word without revealing it directly (so Imposters cannot guess it)

### Imposters
- See only the topic
- Do not receive the secret word
- Goal: blend in by giving topic-relevant clues

### Number of Imposters (MVP)
- 1 Imposter for 3–7 players
- 2 Imposters for 8+ players
(configurable later)

-------------------------------------------------------------------------------

# 3. Topics and Word Lists

## 3.1 Host-selected topics (MVP list)
The host chooses from predefined lists (hardcoded in MVP):

- Athletes
- Foods
- Animals
- Countries
- Careers
- Movies
- Celebrities
- Apps/Social media

Example list: Athletes
- LeBron James
- Serena Williams
- Lionel Messi
- Simone Biles
- Patrick Mahomes
- Sha'Carri Richardson

-------------------------------------------------------------------------------

# 4. Game Flow (Full)

## 4.1 Lobby
- Host creates room
- Players join via code and name
- Host sees player list, topic dropdown, Start Game button (disabled until topic chosen)

## 4.2 Setup Phase (host taps Start Game)
- Store selected topic
- Select random secret word from that topic
- Assign roles (Imposters and Civilians)

## 4.3 Secret Reveal Phase
Player screens:

- Civilians: topic + secret word
- Imposters: topic only, message that they are an Imposter
- Host sees "Begin Round"

-------------------------------------------------------------------------------

# 5. Round Structure

### 1. Clue
- Each alive player submits a 1–3 word clue
- Civilians base clues on the word
- Imposters base clues only on the topic
- Once all clues submitted, move to Discussion

### 2. Discussion
- IRL talking period
- Host taps "Start Voting"

### 3. Voting
- Alive players vote on who seems like the Imposter
- Cannot vote for self
- Highest votes = eliminated (ties resolved randomly among tied)
- Store elimination result

### 4. Reveal
- Show eliminated player and role
- Update alive/Imposter counts
- Check win conditions:
  - If Civilians win -> GAME_OVER
  - If Imposters win -> GAME_OVER
  - Else -> next round: host chooses a new topic, new secret word; roles persist (alive/eliminated carries forward)

-------------------------------------------------------------------------------

# 6. Win Conditions

- Civilians win if all Imposters are eliminated.
- Imposters win if Imposters >= Civilians (numerical parity).

-------------------------------------------------------------------------------

# 7. Game State Machine

Phases
- LOBBY
- SETUP
- SECRET_REVEAL
- CLUE
- DISCUSSION
- VOTING
- REVEAL
- GAME_OVER

Transitions
- LOBBY -> SETUP (event: HOST_START)
- SETUP -> SECRET_REVEAL (auto after assignments)
- SECRET_REVEAL -> CLUE (event: HOST_CONTINUE)
- CLUE -> DISCUSSION (condition: all players submitted clues)
- DISCUSSION -> VOTING (event: HOST_START_VOTING)
- VOTING -> REVEAL (condition: all votes submitted or timeout)
- REVEAL -> GAME_OVER (if win condition)
- REVEAL -> SETUP (if no win -> next round with new topic)

-------------------------------------------------------------------------------

# 8. Data Model

## rooms
- id (uuid)
- code (text, unique)
- host_player_id (uuid)
- state (text)
- round_number (int)
- topic (text)
- secret_word (text)
- created_at
- updated_at

## players
- id (uuid)
- room_id (uuid)
- display_name (text)
- session_id (text)
- is_host (boolean)
- role (CIVILIAN | IMPOSTER)
- is_alive (boolean)
- joined_at
- last_seen_at

## clues (per round)
- id
- room_id
- round_number
- player_id
- text

## votes (per round)
- id
- room_id
- round_number
- voter_id
- target_id

-------------------------------------------------------------------------------

# 9. Frontend UI (MVP)

- Lobby: player list; host sees topic dropdown + start button
- Secret Reveal: civilians see topic + secret word; imposters see topic + warning
- Clue: input box; show submitted clues as they appear or after all submitted
- Discussion: simple instructions; host Start Voting button
- Voting: list of alive players; tap to vote; show selected vote
- Reveal: "X was eliminated — they were [CIVILIAN/IMPOSTER]"
- Game Over: banner ("Civilians Win" or "Imposters Win"); show roles + history

-------------------------------------------------------------------------------

# 10. MVP Implementation Scope

Build now:
- Topic selector (host-only)
- Word lists (hardcoded)
- Role assignment logic
- Generic clue system
- Voting and elimination
- Full round loop
- Win conditions
- Realtime sync via Supabase
- All game phases
- Mobile-friendly UI
- State machine implementation

Out of scope (future):
- Timers
- Decoy words for imposters
- Custom topics or word lists
- Kick button
- Multiple imposters tuning UI
- Animations
- Complex scoring screen
- Chat or IRL discussion hints
- Analytics

-------------------------------------------------------------------------------

# 11. Implementation Plan (high level)

1) Data and config
- Add hardcoded topic -> word list map; constants for role counts; add phase enum.

2) Backend (Supabase functions/endpoints)
- Extend room schema with topic, secret_word, state, round_number.
- Add endpoints for: host start (topic selection, word pick, role assignment), submit clue, start voting, submit vote, advance to next round, reveal logic.
- Enforce role assignment rules; persist clues/votes per round; handle tie-breaking randomness.
- Implement win-condition checks and state transitions per the state machine.

3) Realtime wiring
- Broadcast room updates (state, topic, secret, counts), clues, and votes via Supabase realtime channels; ensure players subscribe by room code.

4) Frontend state and hooks
- Add client-side state machine guardrails to render correct phase UI; hydrate from Supabase payloads.
- Add topic selector UI in lobby (host-only), start game action, and phase control buttons (host continue/start voting).

5) Phase UIs
- Secret Reveal: show topic + secret word for civilians; topic-only for imposters; host sees continue.
- Clue: input (1–3 words) with submit; list of submitted clues (hide author if desired).
- Discussion: static instructions; host Start Voting button.
- Voting: list alive players, disable self-vote, allow change until submit; reflect chosen vote; auto-advance once all in.
- Reveal: show eliminated player + role, updated counts; show win banner or next round prompt for host.
- Game Over: winner banner, recap of roles and history.

6) Round loop and persistence
- On reveal, compute winner; if none, increment round_number, clear clues/votes, prompt host to pick new topic and draw new secret word (roles persist; dead stay dead).

7) Validation and UX safeguards
- Disable host buttons until prerequisites met (topic chosen, all clues in, etc.).
- Prevent duplicate submissions; debounce writes; handle reconnect/hydration.
- Basic mobile-friendly layouts matching existing neon style.

8) Testing passes (manual)
- 3-player path (1 imposter), 8-player path (2 imposters), tie vote handling, win-condition edges, round rollover with persistent eliminations.

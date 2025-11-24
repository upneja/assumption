# Game Flows & State Machines

**pregame.lol** - Complete Game Flow Documentation

Last updated: 2025-11-25

---

## Table of Contents

1. [Overview](#overview)
2. [Assumptions Game Flow](#assumptions-game-flow)
3. [Imposter Game Flow](#imposter-game-flow)
4. [State Transition Rules](#state-transition-rules)
5. [Scoring Systems](#scoring-systems)
6. [UI State by Phase](#ui-state-by-phase)

---

## Overview

Both games use explicit state machines to control game progression. Only the host can trigger state transitions, and all transitions are validated server-side to prevent invalid state changes.

**Common Patterns:**
- Host-controlled advancement (except auto-transitions)
- Server-side validation of all transitions
- Realtime broadcast to sync all clients
- Phase-specific UI rendering

---

## Assumptions Game Flow

### State Machine Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ASSUMPTIONS GAME                             │
└─────────────────────────────────────────────────────────────────────┘

                               ┌─────────┐
                               │  LOBBY  │
                               └────┬────┘
                                    │ Host clicks "Start Game"
                                    │ [Validates 3-20 players]
                                    ▼
                            ┌───────────────┐
                            │  ASSIGNMENT   │ ← Creates circular assignment chain
                            └───────┬───────┘
                                    │ Auto-transition
                                    ▼
                              ┌──────────┐
                              │  INTRO   │ ← Players see their assignments
                              └────┬─────┘
                                   │ Host clicks "Continue"
                                   ▼
                             ┌──────────┐
                             │  WHEEL   │ ← Animated wheel spin
                             └────┬─────┘
                                  │ Host clicks "Spin"
                                  │ [Selects random eligible player]
                                  ▼
                            ┌──────────┐
                            │ HOTSEAT  │ ← Q&A happens IRL
                            └────┬─────┘
                                 │ Host clicks "Start Voting"
                                 ▼
                            ┌──────────┐
                            │  VOTING  │ ← Players guess hotseat's target
                            └────┬─────┘
                                 │ Host clicks "Reveal"
                                 │ [Evaluates votes, awards points]
                                 ▼
                            ┌──────────┐
                            │  REVEAL  │ ← Show correct answer + results
                            └────┬─────┘
                                 │ Host clicks "Next"
                                 ▼
                          ┌─────────────┐
                          │ SCOREBOARD  │ ← Show standings + progress
                          └──────┬──────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    │ More players            │ All players
                    │ available?              │ have been hotseat?
                    │                         │
                    ▼                         ▼
              ┌──────────┐            ┌────────────┐
              │  WHEEL   │            │  COMPLETE  │ ← Final results
              └──────────┘            └────────────┘
                   │
                   └──────── Loop back ─────────┘
```

### Detailed Phase Breakdown

#### 1. LOBBY Phase
**Duration:** Until host starts game
**Purpose:** Waiting room for players to join

**What happens:**
- Host creates room with unique 6-letter code
- Other players join by entering code + name
- Player list updates in real-time via broadcast
- Host sees "Start Game" button (disabled if <3 players)

**UI Elements:**
- Room code displayed prominently
- Live player list with animated entrance
- Player count indicator
- Host controls visible only to host

**Transition Trigger:** Host clicks "Start Game"
**Next Phase:** ASSIGNMENT

---

#### 2. ASSIGNMENT Phase
**Duration:** Instant (auto-transitions)
**Purpose:** Generate target assignments for all players

**What happens:**
- Server creates circular assignment chain
- Each player assigned one other player as their "target"
- No one can be assigned to themselves
- Algorithm ensures everyone has exactly one target
- Room state immediately transitions to INTRO

**Algorithm (from gameEngine.ts):**
```typescript
// Shuffle players randomly
const shuffled = [...players].sort(() => Math.random() - 0.5);

// Create circular chain
const assignments = shuffled.map((player, i) => ({
  giver_player_id: player.id,
  target_player_id: shuffled[(i + 1) % shuffled.length].id,
  round_number: 1,
}));
```

**Example with 4 players:**
```
Alice → Bob
Bob → Charlie
Charlie → Dana
Dana → Alice
```

**Transition Trigger:** Automatic
**Next Phase:** INTRO

---

#### 3. INTRO Phase
**Duration:** Host-controlled
**Purpose:** Players see assignments and introduce themselves IRL

**What happens:**
- Each player sees "Your target: [Name]" on their screen
- Players introduce themselves out loud to the group
- This helps players learn each other's names/personalities
- Hotseat player will later answer questions as this target person

**UI Elements:**
- Large display: "Your target: [Name]"
- List of all players for reference
- Instructions for IRL introductions
- Host: "Continue" button

**Transition Trigger:** Host clicks "Continue"
**Next Phase:** WHEEL

---

#### 4. WHEEL Phase
**Duration:** Until spin completes
**Purpose:** Randomly select next hotseat player with dramatic flair

**What happens:**
- Animated wheel shows all eligible players
- Eligible = haven't been hotseat yet
- Host triggers spin (broadcasts to all clients for sync)
- Slot-machine style animation with particles
- Selected player highlighted with celebration effects

**UI Elements:**
- Animated player wheel/slots
- Particle effects during spin
- Slowdown animation (builds suspense)
- Eliminated players shown grayed out
- Host: "Spin" button

**Technical Details:**
- Server selects player randomly: `selectHotseat(players, hotseatHistory)`
- Broadcasts `wheel_spin` event with selected player ID
- All clients run synchronized animation
- Animation duration: ~3-4 seconds

**Transition Trigger:** Host clicks "Spin" → server selects → animation completes
**Next Phase:** HOTSEAT

---

#### 5. HOTSEAT Phase
**Duration:** Host-controlled
**Purpose:** Selected player answers questions as their assigned person

**What happens:**
- Hotseat player sees reminder of their target
- Other players see list of possible targets
- Questions asked verbally IRL (not in app)
- Hotseat answers as if they were their target person
- Other players observe and form guesses

**UI Elements - Hotseat Player:**
- "You are in the hotseat!"
- "Your target: [Name]"
- Sample questions for inspiration
- Waiting for host to advance

**UI Elements - Other Players:**
- "Who is [Hotseat] pretending to be?"
- List of all possible targets (all players except hotseat)
- Waiting for voting phase

**Sample Questions (displayed):**
- "What's your go-to karaoke song?"
- "What's your most embarrassing moment?"
- "What's your unpopular opinion?"

**Transition Trigger:** Host clicks "Start Voting"
**Next Phase:** VOTING

---

#### 6. VOTING Phase
**Duration:** Until host advances (or all votes in)
**Purpose:** Players guess who the hotseat was pretending to be

**What happens:**
- Each non-hotseat player selects their guess
- Players can change vote before host reveals
- Vote submissions shown as count (e.g., "3/6 voted")
- Hotseat player sees waiting screen

**UI Elements - Voters:**
- List of all possible targets (radio button selection)
- Selected target highlighted
- "Lock in vote" button
- Vote count indicator

**UI Elements - Hotseat:**
- "Waiting for others to vote..."
- Relaxing animation/message

**UI Elements - Host:**
- Vote progress indicator
- "Reveal" button (force-advance)

**Transition Trigger:** Host clicks "Reveal"
**Next Phase:** REVEAL

---

#### 7. REVEAL Phase
**Duration:** Host-controlled
**Purpose:** Show correct answer and award points

**What happens:**
- Display actual target: "The correct answer was: [Name]"
- Show correct voters (green) and incorrect voters (red)
- Award +1 point to each correct guesser
- Confetti animation for correct voters
- Update scores in database

**Scoring Logic:**
```typescript
// Find hotseat's actual assignment
const assignment = assignments.find(a => a.giver_player_id === hotseatId);
const correctTargetId = assignment.target_player_id;

// Evaluate votes
votes.forEach(vote => {
  vote.is_correct = vote.guessed_target_id === correctTargetId;
  if (vote.is_correct) {
    // Award point to voter
    incrementPlayerScore(vote.guesser_player_id);
  }
});
```

**UI Elements:**
- Large reveal: "Correct answer: [Name]"
- Correct voters list (with +1 indicators)
- Incorrect voters list
- Confetti/celebration animation
- Host: "Next" button

**Transition Trigger:** Host clicks "Next"
**Next Phase:** SCOREBOARD

---

#### 8. SCOREBOARD Phase
**Duration:** Host-controlled
**Purpose:** Show standings and decide whether to continue

**What happens:**
- Display current leaderboard (sorted by score)
- Show game progress (rounds completed)
- Indicate which players have/haven't been hotseat
- Host decides: continue to next round OR end game

**UI Elements:**
- Leaderboard with player names and scores
- Top 3 players with medal emojis (🥇🥈🥉)
- Progress bar: "X of Y players have been hotseat"
- Players who were hotseat shown with indicator
- Host buttons: "Next Round" and "End Game"

**Decision Point:**
```
IF (all players have been hotseat) {
  → Auto-transition to COMPLETE
} ELSE IF (host clicks "Next Round") {
  → Transition to WHEEL (pick next player)
} ELSE IF (host clicks "End Game") {
  → Transition to COMPLETE
}
```

**Transition Trigger:** Host choice or game completion
**Next Phase:** WHEEL or COMPLETE

---

#### 9. COMPLETE Phase
**Duration:** Permanent (game over)
**Purpose:** Show final results and celebration

**What happens:**
- Display final standings
- Show winner(s)
- Celebration animation
- Option to play again (creates new room)

**UI Elements:**
- "Game Over!" header
- Final leaderboard
- Winner celebration
- "Play Again" button (creates new room)

**No further transitions possible** - game is complete.

---

## Imposter Game Flow

### State Machine Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         IMPOSTER GAME                                │
└─────────────────────────────────────────────────────────────────────┘

                               ┌─────────┐
                               │  LOBBY  │
                               └────┬────┘
                                    │ Host selects topic + clicks "Start"
                                    │ [Validates 3-20 players]
                                    │ [Assigns roles: 1-2 imposters]
                                    ▼
                          ┌──────────────────┐
                          │  SECRET_REVEAL   │ ← Civilians see word,
                          └─────────┬────────┘   imposters don't
                                    │
                                    │ Host clicks "Start Voting"
                                    │ (IRL discussion happens)
                                    │
                                    ▼
                              ┌──────────┐
                              │  VOTING  │ ← Vote for suspected imposter
                              └─────┬────┘
                                    │
                                    │ All votes submitted
                                    │ [Auto-resolves]
                                    │
                                    ▼
                              ┌──────────┐
                              │  REVEAL  │ ← Show elimination result
                              └─────┬────┘
                                    │
                         ┌──────────┴───────────┐
                         │                      │
                         │ Check win            │
                         │ conditions           │
                         │                      │
            ┌────────────▼────────┐   ┌────────▼──────────┐
            │  Game continues     │   │  Game Over        │
            │  (imposters alive & │   │  (all imposters   │
            │   < parity)         │   │   eliminated OR   │
            └────────┬────────────┘   │   parity reached) │
                     │                └───────────────────┘
                     │
                     │ Host picks new topic
                     │ Roles persist (dead stay dead)
                     │
                     ▼
          ┌────────────────────┐
          │  SECRET_REVEAL     │ ← New round
          │  (new word)        │
          └────────────────────┘
                     │
                     └─── Loop ───┘
```

### Detailed Phase Breakdown

#### 1. LOBBY Phase
**Duration:** Until host starts game
**Purpose:** Waiting room + topic selection

**What happens:**
- Host creates room
- Players join with code + name
- Host selects topic from dropdown
- "Start Game" button enabled when topic selected + 3+ players

**Available Topics:**
- Athletes (LeBron James, Serena Williams, Lionel Messi, ...)
- Foods (Pizza, Sushi, Tacos, ...)
- Animals (Lion, Elephant, Penguin, ...)
- Countries (Japan, Brazil, Australia, ...)
- Careers (Teacher, Engineer, Artist, ...)
- Movies (The Godfather, Inception, Titanic, ...)
- Celebrities (Taylor Swift, Dwayne Johnson, ...)
- Apps (Instagram, TikTok, Spotify, ...)

**UI Elements:**
- Room code
- Player list
- Topic dropdown (host only)
- "Start Game" button (host only)

**Transition Trigger:** Host selects topic + clicks "Start Game"
**Next Phase:** SECRET_REVEAL

---

#### 2. SECRET_REVEAL Phase
**Duration:** Host-controlled
**Purpose:** Roles and secret word revealed to appropriate players

**What happens on start:**
1. Server picks random word from selected topic
2. Server assigns imposter roles:
   - 3-7 players: 1 imposter
   - 8+ players: 2 imposters
3. All players set to is_alive: true
4. Room state transitions to SECRET_REVEAL

**What players see:**

**Civilians:**
```
┌─────────────────────────────┐
│     You are a CIVILIAN      │
├─────────────────────────────┤
│  Topic: Athletes            │
│                             │
│  Secret Word:               │
│  🏀 LeBron James            │
│                             │
│  Give a clue that relates   │
│  to this word without       │
│  saying it directly!        │
└─────────────────────────────┘
```

**Imposters:**
```
┌─────────────────────────────┐
│   You are an IMPOSTER 🕵️    │
├─────────────────────────────┤
│  Topic: Athletes            │
│                             │
│  You don't know the         │
│  secret word!               │
│                             │
│  Give a clue about the      │
│  topic and try to blend in! │
└─────────────────────────────┘
```

**Strategy Tips:**
- **Civilians:** Give clues specific enough to identify the word to other civilians, but vague enough that imposters can't guess it
- **Imposters:** Give generic clues about the topic that could apply to many answers

**UI Elements:**
- Role reveal (CIVILIAN or IMPOSTER)
- Topic displayed
- Secret word (civilians only)
- Instructions
- Host: "Begin Round" button (starts discussion timer or advances to voting)

**IRL Gameplay:**
- Players take turns giving 1-3 word clues
- Discussion happens (not tracked in app)
- Group decides when ready to vote

**Transition Trigger:** Host clicks "Start Voting"
**Next Phase:** VOTING

---

#### 3. VOTING Phase
**Duration:** Until all alive players vote (auto-advances)
**Purpose:** Eliminate suspected imposter

**What happens:**
- Each alive player votes for who they think is an imposter
- Can't vote for yourself
- Can change vote until submitted
- When all votes are in → auto-resolves

**Voting Strategy:**
- Look for vague clues
- Watch for hesitation
- Notice players who are too quiet or too confident
- Use process of elimination

**Auto-Resolution Logic:**
```typescript
// 1. Count votes
const voteCounts = {};
votes.forEach(vote => {
  voteCounts[vote.target_id] = (voteCounts[vote.target_id] || 0) + 1;
});

// 2. Find most-voted player
const maxVotes = Math.max(...Object.values(voteCounts));
const mostVoted = Object.keys(voteCounts).filter(
  id => voteCounts[id] === maxVotes
);

// 3. Break ties randomly
const eliminatedId = mostVoted[Math.floor(Math.random() * mostVoted.length)];

// 4. Mark player as dead
await updatePlayer(eliminatedId, { is_alive: false });

// 5. Award points
const eliminatedPlayer = players.find(p => p.id === eliminatedId);
if (eliminatedPlayer.role === 'IMPOSTER') {
  // Correct voters get +1
  correctVoters.forEach(voterId => incrementScore(voterId, 1));
} else {
  // Imposters get +1 per incorrect voter
  incorrectVoters.forEach(voterId => {
    // Award to imposters
    imposters.forEach(imp => incrementScore(imp.id, 1));
  });
}

// 6. Check win conditions
const aliveImposters = players.filter(p => p.role === 'IMPOSTER' && p.is_alive);
const aliveCivilians = players.filter(p => p.role === 'CIVILIAN' && p.is_alive);

if (aliveImposters.length === 0) {
  winner = 'CIVILIANS';
} else if (aliveImposters.length >= aliveCivilians.length) {
  winner = 'IMPOSTERS';
}
```

**UI Elements:**
- List of alive players (can vote for any)
- Selected vote highlighted
- Vote count indicator
- "Submit Vote" button
- Cannot vote for self (option disabled)

**Transition Trigger:** All alive players vote (automatic)
**Next Phase:** REVEAL

---

#### 4. REVEAL Phase
**Duration:** Host-controlled
**Purpose:** Show elimination result and check win conditions

**What happens:**
- Display eliminated player
- Reveal their role (CIVILIAN or IMPOSTER)
- Show who voted for them
- Display updated scores
- Show alive counts
- Check if game is over

**UI Elements:**
```
┌─────────────────────────────────────┐
│     [Player Name] was eliminated!   │
│                                     │
│     They were a: [CIVILIAN/         │
│                   IMPOSTER]         │
├─────────────────────────────────────┤
│  Voted by:                          │
│  • Alice, Bob, Charlie              │
│                                     │
│  Alive: 5 Civilians, 1 Imposter    │
├─────────────────────────────────────┤
│  [If game over:]                    │
│  🎉 CIVILIANS WIN! 🎉               │
│  or                                 │
│  😈 IMPOSTERS WIN! 😈               │
└─────────────────────────────────────┘
```

**Win Conditions:**
- **Civilians win:** All imposters eliminated
- **Imposters win:** Imposters reach parity (imposters >= civilians)

**Decision Point:**
```
IF (game over) {
  → Display winner
  → Show final scores
  → "Play Again" button
} ELSE {
  → Show "Next Round" button (host only)
  → Host picks new topic
  → Loop back to SECRET_REVEAL
}
```

**Transition Trigger:** Host clicks "Next Round" (if game continues)
**Next Phase:** SECRET_REVEAL (new round) or stay in REVEAL (game over)

---

## State Transition Rules

### Assumptions Game Transitions

| From State | To State | Trigger | Validation |
|-----------|----------|---------|------------|
| LOBBY | ASSIGNMENT | Host clicks "Start Game" | 3-20 players present |
| ASSIGNMENT | INTRO | Automatic | Assignments created |
| INTRO | WHEEL | Host clicks "Continue" | None |
| WHEEL | HOTSEAT | Host clicks "Spin" | Eligible players remain |
| HOTSEAT | VOTING | Host clicks "Start Voting" | None |
| VOTING | REVEAL | Host clicks "Reveal" | None |
| REVEAL | SCOREBOARD | Host clicks "Next" | None |
| SCOREBOARD | WHEEL | Host clicks "Next Round" | Not all players hotseat |
| SCOREBOARD | COMPLETE | Host clicks "End Game" OR all hotseat | None |

**Validation Logic (gameEngine.ts):**
```typescript
const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  LOBBY: ['ASSIGNMENT'],
  ASSIGNMENT: ['INTRO'],
  INTRO: ['WHEEL'],
  WHEEL: ['HOTSEAT'],
  HOTSEAT: ['VOTING'],
  VOTING: ['REVEAL'],
  REVEAL: ['SCOREBOARD'],
  SCOREBOARD: ['WHEEL', 'COMPLETE'],
  COMPLETE: [], // Terminal state
};

export function isValidTransition(from: GamePhase, to: GamePhase): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
```

### Imposter Game Transitions

| From State | To State | Trigger | Validation |
|-----------|----------|---------|------------|
| LOBBY | SECRET_REVEAL | Host selects topic + clicks "Start" | 3-20 players, topic selected |
| SECRET_REVEAL | VOTING | Host clicks "Start Voting" | None |
| VOTING | REVEAL | All votes submitted | Automatic |
| REVEAL | SECRET_REVEAL | Host clicks "Next Round" | Game not over |
| REVEAL | (stay) | Game over | Civilians or imposters won |

**Game Over Conditions:**
```typescript
function checkWinCondition(players: Player[]): 'CIVILIANS' | 'IMPOSTERS' | null {
  const aliveImposters = players.filter(p => p.role === 'IMPOSTER' && p.is_alive);
  const aliveCivilians = players.filter(p => p.role === 'CIVILIAN' && p.is_alive);

  if (aliveImposters.length === 0) return 'CIVILIANS';
  if (aliveImposters.length >= aliveCivilians.length) return 'IMPOSTERS';
  return null; // Game continues
}
```

---

## Scoring Systems

### Assumptions Scoring

**Points Awarded:**
- +1 point for each correct guess during voting
- No points deducted for incorrect guesses
- No points awarded to hotseat player (future enhancement)

**Example Round:**
```
Hotseat: Alice (assigned Bob)
Actual Assignment: Bob

Votes:
- Charlie voted for Bob ✓ → +1 point
- Dana voted for Eve ✗ → 0 points
- Eve voted for Bob ✓ → +1 point
- Frank voted for Charlie ✗ → 0 points

Scores after round:
- Charlie: +1
- Eve: +1
```

**Final Winner:**
- Player with most points after all rounds
- Ties possible (co-winners)

### Imposter Scoring

**Points Awarded:**

**If Imposter Eliminated:**
- Each correct voter: +1 point

**If Civilian Eliminated:**
- Each imposter: +1 point per incorrect voter

**Example Scenarios:**

**Scenario 1: Imposter Caught**
```
Eliminated: Bob (IMPOSTER)

Votes:
- Alice voted for Bob ✓
- Charlie voted for Bob ✓
- Dana voted for Eve ✗
- Eve voted for Bob ✓

Points awarded:
- Alice: +1
- Charlie: +1
- Eve: +1
```

**Scenario 2: Wrong Player Eliminated**
```
Eliminated: Alice (CIVILIAN)

Votes:
- Bob voted for Alice ✗
- Charlie voted for Alice ✗
- Dana voted for Eve ✗
- Eve voted for Alice ✗

Imposters: Bob, Frank

Points awarded:
- Bob: +3 (3 incorrect voters)
- Frank: +3 (3 incorrect voters)
```

**Strategy Notes:**
- Imposters benefit when civilians are eliminated
- Civilians must coordinate to find imposters
- Late-game eliminations are higher stakes (fewer players)

---

## UI State by Phase

### Assumptions UI Mapping

| Phase | Component | Key Props | Host Actions |
|-------|-----------|-----------|--------------|
| LOBBY | LobbyView | players, currentPlayer | Start Game (3+ players) |
| INTRO | IntroView | players, myAssignment | Continue |
| WHEEL | WheelView | players, hotseatHistory, wheelSpinPayload | Spin |
| HOTSEAT | HotseatView | hotseatPlayer, myAssignment, players | Start Voting |
| VOTING | VotingView | players, hotseatPlayer, currentPlayer | Reveal |
| REVEAL | RevealView | voteResults, hotseatPlayer, assignment | Next |
| SCOREBOARD | ScoreboardView | players, hotseatHistory, room | Next Round / End Game |
| COMPLETE | CompleteView | players (sorted by score) | - |

### Imposter UI Mapping

| Phase | View | Key Info Displayed | Host Actions |
|-------|------|-------------------|--------------|
| LOBBY | Inline (lobby section) | Players, topic dropdown | Start Game |
| SECRET_REVEAL | Inline (role reveal) | Role, topic, secret word (if civilian) | Start Voting |
| VOTING | Inline (voting list) | Alive players, vote buttons | - (auto-advances) |
| REVEAL | Inline (results) | Eliminated player, role, winner (if game over) | Next Round (if continues) |

---

## Flow Diagrams

### Assumptions: Typical 4-Player Game

```
Round 1:
LOBBY (4 players join)
  → START (host)
  → ASSIGNMENT (Alice→Bob, Bob→Charlie, Charlie→Dana, Dana→Alice)
  → INTRO (players introduce)
  → CONTINUE (host)
  → WHEEL (spin animation)
  → SPIN (host) → selects Charlie
  → HOTSEAT (Charlie answers as Dana)
  → START VOTING (host)
  → VOTING (3 players vote)
  → REVEAL (2 correct, 1 incorrect)
  → SCOREBOARD (2 players have +1 point)
  → NEXT ROUND (host)

Round 2:
WHEEL (spin) → selects Alice
HOTSEAT → VOTING → REVEAL → SCOREBOARD
  → NEXT ROUND (host)

Round 3:
WHEEL → Bob
...
Round 4:
WHEEL → Dana
... → SCOREBOARD
  → All 4 players have been hotseat
  → Auto-transition to COMPLETE
  → Final scores displayed
```

### Imposter: 6-Player Game (2 Imposters)

```
Setup:
LOBBY (6 players join)
  → Host selects "Athletes"
  → START (host)
  → SECRET_REVEAL
      - 4 Civilians see "LeBron James"
      - 2 Imposters see only "Athletes"

Round 1:
SECRET_REVEAL
  → START VOTING (host)
  → VOTING (all 6 vote)
  → Auto-resolve: Player 3 eliminated (CIVILIAN) ❌
  → REVEAL
      - Imposters each get +3 points
      - 5 players remain (3 civilians, 2 imposters)
  → Host picks new topic: "Foods"
  → NEXT ROUND (host)

Round 2:
SECRET_REVEAL (new word: "Sushi")
  → VOTING (5 alive players vote)
  → Auto-resolve: Player 1 eliminated (IMPOSTER) ✓
  → REVEAL
      - 3 correct voters get +1
      - 4 players remain (3 civilians, 1 imposter)
  → NEXT ROUND

Round 3:
SECRET_REVEAL
  → VOTING
  → Imposter eliminated ✓
  → REVEAL: "CIVILIANS WIN!" 🎉
  → Game over, final scores displayed
```

---

## Debugging State Issues

### Common State Problems

**Problem:** Game stuck in a phase
**Debug:**
1. Check `room.state` in database
2. Verify host player has `is_host: true`
3. Check browser console for validation errors
4. Review API route logs

**Problem:** State changed but UI didn't update
**Debug:**
1. Check realtime subscription is active
2. Verify broadcast was sent (server logs)
3. Check callback is updating React state
4. Inspect React DevTools for stale state

**Problem:** Invalid transition attempted
**Debug:**
1. Check `VALID_TRANSITIONS` in gameEngine.ts
2. Verify current state matches expected
3. Check if state machine got out of sync

### Manual State Recovery

If game state becomes corrupted:

```sql
-- Check current state
SELECT code, state, round_number, hotseat_player_id
FROM rooms
WHERE code = 'ABC123';

-- Reset to safe state (if needed)
UPDATE rooms
SET state = 'LOBBY', round_number = 1, hotseat_player_id = NULL
WHERE code = 'ABC123';

-- Check players
SELECT display_name, is_host, score, is_alive, role
FROM players
WHERE room_id = (SELECT id FROM rooms WHERE code = 'ABC123');
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-25

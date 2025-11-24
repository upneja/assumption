# API Reference

**pregame.lol** - Complete HTTP API Documentation

Last updated: 2025-11-25

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Responses](#error-responses)
4. [Assumptions Game Endpoints](#assumptions-game-endpoints)
5. [Imposter Game Endpoints](#imposter-game-endpoints)
6. [Common Patterns](#common-patterns)

---

## Overview

All API endpoints are implemented as Next.js API routes under `/app/api/`. They use:

- **HTTP Methods**: POST (mutations), GET (queries)
- **Content-Type**: `application/json`
- **Authentication**: Session ID in request body
- **Authorization**: Host status checked for privileged operations

**Base URL**: `https://pregame.lol` (production) or `http://localhost:3000` (development)

---

## Authentication

### Session ID Pattern

All API requests include a `sessionId` in the request body:

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  ...other fields
}
```

**How it works:**
1. Client generates UUID on first visit, stores in localStorage
2. Client includes this UUID in every API call
3. Server looks up player record by `(session_id, room_id)` combination
4. If player not found, returns 401 Unauthorized

**Security notes:**
- Session IDs are not cryptographically secure tokens
- Anyone with a session ID can impersonate that player
- Acceptable for party games where players are physically present

---

## Error Responses

### Error Format

```json
{
  "error": "Human-readable error message",
  "code": "OPTIONAL_ERROR_CODE"
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Missing required field, invalid format |
| 401 | Unauthorized | Session ID not found, player not in room |
| 403 | Forbidden | Not host, action not allowed in current state |
| 404 | Not Found | Room code doesn't exist |
| 500 | Internal Error | Database error, unexpected exception |

### Common Error Messages

- `"Room not found"` - Room code doesn't exist or was deleted
- `"Unauthorized"` - Session ID doesn't match any player in room
- `"Forbidden"` - Action requires host privileges
- `"Invalid state transition"` - Current game phase doesn't allow this action
- `"Not enough players"` - Game requires 3+ players to start

---

## Assumptions Game Endpoints

### POST /api/rooms

Create a new Assumptions game room.

**Request Body:**
```json
{
  "displayName": "Alice",
  "sessionId": "uuid-v4-string",
  "gameType": "ASSUMPTIONS"  // Optional, defaults to ASSUMPTIONS
}
```

**Success Response (200):**
```json
{
  "room": {
    "id": "uuid",
    "code": "ABC123",
    "host_player_id": "uuid",
    "state": "LOBBY",
    "game_type": "ASSUMPTIONS",
    "round_number": 1,
    "hotseat_player_id": null,
    "hotseat_history": [],
    "created_at": "2025-11-25T12:00:00Z",
    "updated_at": "2025-11-25T12:00:00Z"
  },
  "player": {
    "id": "uuid",
    "room_id": "uuid",
    "display_name": "Alice",
    "is_host": true,
    "session_id": "uuid",
    "score": 0,
    "joined_at": "2025-11-25T12:00:00Z",
    "last_seen_at": "2025-11-25T12:00:00Z"
  }
}
```

**Example:**
```javascript
const response = await fetch('/api/rooms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    displayName: 'Alice',
    sessionId: getSessionId(),
    gameType: 'ASSUMPTIONS',
  }),
});
const { room, player } = await response.json();
console.log(`Room created: ${room.code}`);
```

---

### POST /api/rooms/[code]/join

Join an existing Assumptions game room.

**URL Parameters:**
- `code`: 6-letter room code (e.g., `ABC123`)

**Request Body:**
```json
{
  "displayName": "Bob",
  "sessionId": "uuid-v4-string"
}
```

**Success Response (200):**
```json
{
  "room": { ...room object... },
  "player": { ...new player object... },
  "players": [ ...array of all players... ]
}
```

**Broadcasts:**
- Event: `players_updated`
- Payload: `{ players: Player[] }`

**Errors:**
- `404`: Room not found
- `400`: Display name invalid (empty or >20 chars)

---

### GET /api/rooms/[code]

Get current state of an Assumptions game room.

**URL Parameters:**
- `code`: 6-letter room code

**Success Response (200):**
```json
{
  "room": { ...room object... },
  "players": [ ...array of players... ],
  "assignments": [ ...array of assignments... ]
}
```

**Example:**
```javascript
const response = await fetch(`/api/rooms/${code}`);
const { room, players, assignments } = await response.json();
console.log(`Room state: ${room.state}, Players: ${players.length}`);
```

**Errors:**
- `404`: Room not found

---

### POST /api/rooms/[code]/start

Start the Assumptions game (host only).

**URL Parameters:**
- `code`: 6-letter room code

**Request Body:**
```json
{
  "sessionId": "uuid-v4-string"
}
```

**Success Response (200):**
```json
{
  "room": { ...room with state: "ASSIGNMENT"... },
  "players": [ ...players... ],
  "assignments": [ ...newly created assignments... ]
}
```

**State Transition:**
- From: `LOBBY`
- To: `ASSIGNMENT` (immediately transitions to `INTRO`)

**Logic:**
1. Validates 3-20 players in room
2. Creates circular assignment chain
3. Updates room state to INTRO
4. Broadcasts `room_updated` and `assignments_updated`

**Broadcasts:**
- Event: `room_updated`, `assignments_updated`

**Errors:**
- `401`: Session ID not found
- `403`: Player is not host
- `400`: Not enough players (need 3+)
- `403`: Game already started

---

### POST /api/rooms/[code]/spin

Spin the wheel to select hotseat player (host only).

**URL Parameters:**
- `code`: 6-letter room code

**Request Body:**
```json
{
  "sessionId": "uuid-v4-string"
}
```

**Success Response (200):**
```json
{
  "room": {
    ...room with updated hotseat_player_id and hotseat_history...
  },
  "hotseatPlayer": { ...selected player object... }
}
```

**State Transition:**
- From: `WHEEL`
- To: `HOTSEAT`

**Logic:**
1. Filters players who haven't been hotseat yet
2. Randomly selects one
3. Updates room.hotseat_player_id
4. Adds player ID to room.hotseat_history
5. Transitions to HOTSEAT state
6. Broadcasts wheel_spin event for animation sync

**Broadcasts:**
- Event: `wheel_spin`, `room_updated`
- Payload: `{ hotseatPlayerId: string, previousHistory: string[] }`

**Errors:**
- `401`: Unauthorized
- `403`: Not host or not in WHEEL state
- `400`: No eligible players remaining

---

### POST /api/rooms/[code]/vote

Submit a vote for who the hotseat was pretending to be.

**URL Parameters:**
- `code`: 6-letter room code

**Request Body:**
```json
{
  "sessionId": "uuid-v4-string",
  "guessedTargetId": "uuid-of-target-player"
}
```

**Success Response (200):**
```json
{
  "vote": {
    "id": "uuid",
    "room_id": "uuid",
    "hotseat_player_id": "uuid",
    "guesser_player_id": "uuid",
    "guessed_target_id": "uuid",
    "is_correct": null,  // Set to true/false on reveal
    "round_number": 1,
    "created_at": "2025-11-25T12:00:00Z"
  }
}
```

**Logic:**
1. Upserts vote record (allows changing vote)
2. Player can't vote if they're the hotseat
3. Vote correctness evaluated during reveal phase

**Errors:**
- `401`: Unauthorized
- `403`: Not in VOTING state
- `400`: Can't vote for yourself (if you're hotseat)

---

### POST /api/rooms/[code]/next

Advance to the next game phase (host only).

**URL Parameters:**
- `code`: 6-letter room code

**Request Body:**
```json
{
  "sessionId": "uuid-v4-string"
}
```

**Success Response (200):**
```json
{
  "room": { ...room with updated state... },
  "players": [ ...players with updated scores... ],
  "voteResults": {  // Only present when transitioning from VOTING
    "votes": [ ...votes... ],
    "correctVoters": [ ...players... ],
    "incorrectVoters": [ ...players... ],
    "actualTargetId": "uuid"
  }
}
```

**State Transitions:**

| From | To | Notes |
|------|-----|-------|
| INTRO | WHEEL | Simple transition |
| HOTSEAT | VOTING | Ready to vote |
| VOTING | REVEAL | Evaluates votes, calculates scores |
| REVEAL | SCOREBOARD | Show results |
| SCOREBOARD | WHEEL | Continue to next round |
| SCOREBOARD | COMPLETE | If all players have been hotseat |

**Scoring Logic (VOTING → REVEAL):**
1. Find hotseat player's actual assignment
2. Mark each vote as correct/incorrect
3. Award +1 point to each correct guesser
4. Update player scores in database

**Broadcasts:**
- Event: `room_updated`, `players_updated` (if scores changed)

**Errors:**
- `401`: Unauthorized
- `403`: Not host
- `403`: Invalid state transition

---

## Imposter Game Endpoints

### POST /api/imposter/rooms

Create a new Imposter game room.

**Request Body:**
```json
{
  "displayName": "Alice",
  "sessionId": "uuid-v4-string",
  "gameType": "IMPOSTER"  // Required for Imposter games
}
```

**Success Response (200):**
```json
{
  "room": {
    ...standard room fields...,
    "game_type": "IMPOSTER",
    "state": "LOBBY",
    "topic": null,
    "secret_word": null
  },
  "player": { ...host player... }
}
```

---

### POST /api/imposter/rooms/[code]/join

Join an existing Imposter game room.

**URL Parameters:**
- `code`: 6-letter room code

**Request Body:**
```json
{
  "displayName": "Bob",
  "sessionId": "uuid-v4-string"
}
```

**Success Response (200):**
```json
{
  "room": { ...room... },
  "player": { ...new player... },
  "players": [ ...all players... ]
}
```

**Broadcasts:**
- Event: `imposter_players_updated`

---

### GET /api/imposter/rooms/[code]

Get current state of an Imposter game room.

**URL Parameters:**
- `code`: 6-letter room code

**Success Response (200):**
```json
{
  "room": { ...room... },
  "players": [ ...players with role and is_alive fields... ]
}
```

---

### POST /api/imposter/rooms/[code]/start

Start an Imposter game round (host only).

**URL Parameters:**
- `code`: 6-letter room code

**Request Body:**
```json
{
  "sessionId": "uuid-v4-string",
  "topic": "Athletes"  // One of the predefined topics
}
```

**Available Topics:**
- Athletes
- Foods
- Animals
- Countries
- Careers
- Movies
- Celebrities
- Apps

**Success Response (200):**
```json
{
  "room": {
    ...room...,
    "state": "SECRET_REVEAL",
    "topic": "Athletes",
    "secret_word": "LeBron James",
    "round_number": 1
  },
  "players": [
    {
      ...player...,
      "role": "CIVILIAN",  // or "IMPOSTER"
      "is_alive": true
    },
    ...
  ]
}
```

**Logic:**
1. Validates topic is valid
2. Selects random word from topic's word list
3. Assigns roles:
   - 1 imposter for 3-7 players
   - 2 imposters for 8+ players
4. Sets all players to is_alive: true
5. Transitions to SECRET_REVEAL state

**Role Assignment:**
- Random selection
- Imposters don't know each other
- Civilians see topic + secret word
- Imposters see only topic

**Broadcasts:**
- Event: `imposter_room_updated`, `imposter_players_updated`

**Errors:**
- `401`: Unauthorized
- `403`: Not host
- `400`: Invalid topic
- `400`: Not enough players (need 3+)

---

### POST /api/imposter/rooms/[code]/advance

Advance to the next Imposter game phase (host only).

**URL Parameters:**
- `code`: 6-letter room code

**Request Body:**
```json
{
  "sessionId": "uuid-v4-string"
}
```

**Success Response (200):**
```json
{
  "room": { ...room with updated state... },
  "players": [ ...players... ]
}
```

**State Transitions:**

| From | To | Notes |
|------|-----|-------|
| SECRET_REVEAL | VOTING | Ready to vote |

**Broadcasts:**
- Event: `imposter_room_updated`

**Errors:**
- `401`: Unauthorized
- `403`: Not host or invalid state

---

### POST /api/imposter/rooms/[code]/vote

Vote for suspected imposter.

**URL Parameters:**
- `code`: 6-letter room code

**Request Body:**
```json
{
  "sessionId": "uuid-v4-string",
  "targetId": "uuid-of-suspected-imposter"
}
```

**Success Response (200):**
```json
{
  "vote": {
    "id": "uuid",
    "room_id": "uuid",
    "round_number": 1,
    "voter_id": "uuid",
    "target_id": "uuid",
    "created_at": "2025-11-25T12:00:00Z"
  },
  "roundResult": {  // Only present if all votes are in
    "eliminatedPlayerId": "uuid",
    "eliminatedRole": "CIVILIAN",  // or "IMPOSTER"
    "imposterIds": [ ...uuids... ],
    "correctVoterIds": [ ...uuids... ],
    "incorrectVoterIds": [ ...uuids... ],
    "winner": null  // "CIVILIANS" or "IMPOSTERS" if game over
  }
}
```

**Logic:**
1. Upserts vote (allows changing vote)
2. Only alive players can vote
3. Player can't vote for themselves
4. When all alive players have voted:
   - Determine most-voted player
   - Eliminate that player (set is_alive: false)
   - Calculate scoring:
     - If imposter eliminated: Correct voters get +1
     - If civilian eliminated: Imposters get +1 per incorrect voter
   - Check win conditions:
     - Civilians win if all imposters eliminated
     - Imposters win if imposters >= civilians (parity)
   - If no winner:
     - Increment round_number
     - Host picks new topic for next round

**Tie Breaking:**
- If multiple players tied for most votes, random selection

**Broadcasts:**
- Event: `imposter_votes_updated` (after each vote)
- Event: `imposter_round_result` (when voting completes)
- Event: `imposter_room_updated`, `imposter_players_updated` (on resolution)

**Errors:**
- `401`: Unauthorized
- `403`: Not in VOTING state or player is dead
- `400`: Can't vote for yourself

---

### POST /api/imposter/rooms/[code]/clue

Submit a clue (currently tracked but not used for game logic).

**URL Parameters:**
- `code`: 6-letter room code

**Request Body:**
```json
{
  "sessionId": "uuid-v4-string",
  "clueText": "Tall basketball player"
}
```

**Success Response (200):**
```json
{
  "clue": {
    "id": "uuid",
    "room_id": "uuid",
    "round_number": 1,
    "player_id": "uuid",
    "text": "Tall basketball player",
    "created_at": "2025-11-25T12:00:00Z"
  }
}
```

**Note:** Clues are currently stored but not used for game progression. The game assumes clues are given verbally IRL.

**Broadcasts:**
- Event: `imposter_clues_updated`

---

## Common Patterns

### Request/Response Flow

1. **Client Action**
   ```javascript
   const response = await fetch(`/api/rooms/${code}/action`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       sessionId: getSessionId(),
       ...params,
     }),
   });
   ```

2. **Server Processing**
   - Parse request body
   - Validate session ID → find player
   - Check authorization (host status if needed)
   - Validate state machine transition
   - Execute database mutations
   - Broadcast realtime updates
   - Return response

3. **Realtime Update**
   ```javascript
   // All connected clients receive:
   channel.on('broadcast', { event: 'room_updated' }, ({ payload }) => {
     setRoom(payload.room);
   });
   ```

### Host Authorization Pattern

Many endpoints require host privileges. The pattern is:

```typescript
// 1. Find player
const player = await supabaseAdmin
  .from('players')
  .select('*')
  .eq('room_id', roomId)
  .eq('session_id', sessionId)
  .single();

if (!player.data) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

// 2. Check host status
if (!player.data.is_host) {
  return Response.json({ error: 'Forbidden' }, { status: 403 });
}

// 3. Proceed with action
```

### Broadcast Pattern

After database mutations, broadcast to all clients:

```typescript
import { supabase } from '@/lib/supabaseClient';

// Send broadcast
await supabase.channel(`room:${roomCode}`).send({
  type: 'broadcast',
  event: 'room_updated',
  payload: { room: updatedRoom },
});
```

### Error Handling Pattern

All endpoints follow consistent error handling:

```typescript
export async function POST(request: Request) {
  try {
    // ... endpoint logic ...
    return Response.json(successData);
  } catch (error) {
    console.error('Endpoint error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Rate Limiting & Quotas

**Current Status:** No rate limiting implemented.

**Supabase Limits (Free Tier):**
- Database connections: 60 concurrent
- Realtime connections: 200 concurrent
- API requests: 500 requests/second
- Storage: 500 MB

For production deployment, consider:
- Adding rate limiting middleware
- Implementing request throttling per session ID
- Monitoring Supabase usage metrics

---

## Versioning

**Current API Version:** v1 (implicit, no version in URLs)

**Breaking Changes:** None planned. If needed, version URLs: `/api/v2/...`

---

## Testing

### Manual Testing with curl

```bash
# Create room
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Alice","sessionId":"test-uuid-1"}'

# Join room
curl -X POST http://localhost:3000/api/rooms/ABC123/join \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Bob","sessionId":"test-uuid-2"}'

# Get room state
curl http://localhost:3000/api/rooms/ABC123

# Start game (host only)
curl -X POST http://localhost:3000/api/rooms/ABC123/start \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-uuid-1"}'
```

### Automated Testing

Tests are located in `/src/app/api/` with `.test.ts` suffix.

Run tests:
```bash
npm run test
```

Test pattern using MSW:
```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.post('/api/rooms', () => {
    return HttpResponse.json({
      room: mockRoom,
      player: mockPlayer,
    });
  })
);
```

---

## Deprecations

No deprecated endpoints at this time.

---

## Support

For API issues or questions:
- Check browser console for error messages
- Verify Supabase connection in Supabase dashboard
- Review server logs in Vercel dashboard (production)
- Check `/docs/ARCHITECTURE.md` for system design details

---

**Document Version:** 1.0
**API Version:** v1
**Last Updated:** 2025-11-25

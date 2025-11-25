/**
 * GAME PHASE TYPES
 *
 * These types define the state machine phases for both games.
 * Each phase represents a distinct stage in the game flow with specific UI and logic.
 */

/**
 * Assumptions Game Phase
 *
 * State machine flow:
 * LOBBY → ASSIGNMENT → INTRO → WHEEL → HOTSEAT → VOTING → REVEAL → SCOREBOARD → COMPLETE
 *                                ↑__________________________________|
 *
 * - LOBBY: Pre-game waiting room where players join
 * - ASSIGNMENT: Server assigns each player a secret target (who they'll pretend to be)
 * - INTRO: Players introduce themselves IRL while seeing their assignment
 * - WHEEL: Animated wheel spin to randomly select the hotseat player
 * - HOTSEAT: Selected player answers questions as their assigned person
 * - VOTING: All other players guess who the hotseat was pretending to be
 * - REVEAL: Show correct answer and award points to correct guessers
 * - SCOREBOARD: Display round results and progress, host decides to continue or end
 * - COMPLETE: Final game over screen with winner celebration
 */
export type GamePhase =
  | 'LOBBY'
  | 'ASSIGNMENT'
  | 'INTRO'
  | 'WHEEL'
  | 'HOTSEAT'
  | 'VOTING'
  | 'REVEAL'
  | 'SCOREBOARD'
  | 'COMPLETE';

/**
 * Imposter Game Phase
 *
 * State machine flow:
 * LOBBY → SECRET_REVEAL → CLUE → VOTING → GAME_OVER
 *          ↑___________________________________|
 *                      (or REVEAL for multi-round)
 *
 * - LOBBY: Pre-game waiting room, host selects topic
 * - SECRET_REVEAL: Civilians see topic+secret word, imposters see only topic
 * - CLUE: Optional phase where players can submit clues (handled offline)
 * - VOTING: Players vote on who they think is the imposter (discussion happens IRL)
 * - REVEAL: Show elimination result, check win conditions (for multi-round games)
 * - GAME_OVER: Final game state after voting completes
 */
export type ImposterPhase =
  | 'LOBBY'
  | 'SECRET_REVEAL'
  | 'CLUE'
  | 'VOTING'
  | 'REVEAL'
  | 'GAME_OVER';

/**
 * Union type for any room state across both games.
 * Used in the database rooms.state column.
 */
export type RoomState = GamePhase | ImposterPhase;

/**
 * Game Type Discriminator
 *
 * Determines which game logic and state machine to use.
 * Set when room is created and never changes.
 */
export type GameType = 'ASSUMPTIONS' | 'IMPOSTER';

/**
 * DATABASE TYPES
 *
 * These interfaces match the Supabase database schema exactly.
 * They represent the source of truth for game state.
 */

/**
 * Room - The core game container
 *
 * Represents a single game session. Each room has a unique 6-letter code
 * that players use to join. The room tracks the current game phase, round
 * number, and game-specific state like topic/secret word for Imposter games.
 *
 * Fields:
 * - id: UUID primary key
 * - code: Unique 6-letter uppercase code (no I/O for readability)
 * - host_player_id: FK to the player who created the room (has control)
 * - state: Current phase in the game state machine
 * - game_type: Which game is being played (ASSUMPTIONS or IMPOSTER)
 * - topic: (Imposter only) Category chosen by host (e.g., "Athletes")
 * - secret_word: (Imposter only) The word civilians know but imposters don't
 * - round_number: Current round counter, increments after each scoreboard/reveal
 * - hotseat_player_id: (Assumptions only) Current player in the hot seat
 * - hotseat_history: (Assumptions only) Array of player IDs who have been hotseat
 * - created_at: Room creation timestamp
 * - updated_at: Last state update timestamp
 */
export interface Room {
  id: string;
  code: string;
  host_player_id: string | null;
  state: RoomState;
  game_type?: GameType;
  topic?: string | null;
  secret_word?: string | null;
  round_number: number;
  hotseat_player_id: string | null;
  hotseat_history: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Player - Individual participant in a game
 *
 * Represents a person playing the game. Players are identified by session_id
 * (stored in localStorage) to maintain identity across page refreshes without
 * requiring authentication.
 *
 * Fields:
 * - id: UUID primary key
 * - room_id: FK to the room they're in (cascade delete when room is deleted)
 * - display_name: Name shown to other players (1-20 characters)
 * - is_host: Whether this player has host privileges (phase control)
 * - session_id: Browser session identifier from localStorage
 * - score: Current point total (incremented on correct guesses/plays)
 * - role: (Imposter only) CIVILIAN or IMPOSTER assignment
 * - is_alive: (Imposter only) False if eliminated through voting
 * - joined_at: When player entered the room
 * - last_seen_at: Last activity timestamp (for future reconnection logic)
 */
export interface Player {
  id: string;
  room_id: string;
  display_name: string;
  is_host: boolean;
  session_id: string;
  score: number;
  role?: 'CIVILIAN' | 'IMPOSTER';
  is_alive?: boolean;
  joined_at: string;
  last_seen_at: string;
}

/**
 * Assignment - Assumptions game target assignments
 *
 * In Assumptions, each player is assigned another player to "pretend to be"
 * when they're in the hotseat. Assignments form a circular chain where
 * everyone has exactly one target and is the target of exactly one other player.
 *
 * Example with 4 players:
 * - Alice → Bob (Alice pretends to be Bob)
 * - Bob → Charlie
 * - Charlie → Dana
 * - Dana → Alice
 *
 * Fields:
 * - room_id: The game room
 * - giver_player_id: Who will be pretending
 * - target_player_id: Who they'll pretend to be
 * - round_number: Which round this assignment is for
 *
 * Composite primary key: (room_id, giver_player_id, round_number)
 * This allows reassignments in future rounds if desired.
 */
export interface Assignment {
  room_id: string;
  giver_player_id: string;
  target_player_id: string;
  round_number: number;
}

/**
 * COMPOSITE TYPES
 *
 * These types combine multiple database types for convenience in client code.
 * They represent common data structures needed by components.
 */

/**
 * RoomWithPlayers - Room enriched with its player list
 *
 * Convenient type for passing around room + players together.
 * Used in API responses and component props.
 */
export interface RoomWithPlayers extends Room {
  players: Player[];
}

/**
 * GameState - Complete game state for a client
 *
 * Everything a component needs to render the current game phase.
 * Typically constructed in page components and passed down to views.
 *
 * Fields:
 * - room: Current room state with all game info
 * - players: All players in the room (live updated via realtime)
 * - assignments: Assignment mappings (Assumptions only, empty for Imposter)
 * - currentPlayer: The player record for this browser's session_id
 * - isHost: Convenience flag, true if currentPlayer.is_host
 */
export interface GameState {
  room: Room;
  players: Player[];
  assignments: Assignment[];
  currentPlayer: Player | null;
  isHost: boolean;
}

/**
 * API REQUEST/RESPONSE TYPES
 *
 * Types for HTTP request bodies and response payloads.
 * All requests include sessionId for player identification.
 */

/**
 * CreateRoomRequest - Create a new game room
 *
 * Used by: POST /api/rooms and POST /api/imposter/rooms
 *
 * Fields:
 * - displayName: Host's display name (1-20 chars)
 * - sessionId: Browser session identifier from localStorage
 * - gameType: Which game to create (defaults to ASSUMPTIONS if omitted)
 */
export interface CreateRoomRequest {
  displayName: string;
  sessionId: string;
  gameType?: GameType;
}

/**
 * CreateRoomResponse - Room creation result
 *
 * Returns both the created room and the host player record.
 */
export interface CreateRoomResponse {
  room: Room;
  player: Player;
}

/**
 * JoinRoomRequest - Join an existing room
 *
 * Used by: POST /api/rooms/[code]/join and POST /api/imposter/rooms/[code]/join
 *
 * Fields:
 * - displayName: Player's display name (1-20 chars)
 * - sessionId: Browser session identifier from localStorage
 */
export interface JoinRoomRequest {
  displayName: string;
  sessionId: string;
}

/**
 * JoinRoomResponse - Room join result
 *
 * Returns the room, the new player record, and all current players.
 */
export interface JoinRoomResponse {
  room: Room;
  player: Player;
  players: Player[];
}

/**
 * StartGameRequest - Start the game (host only)
 *
 * Used by: POST /api/rooms/[code]/start
 * Transitions from LOBBY to ASSIGNMENT phase.
 */
export interface StartGameRequest {
  sessionId: string;
}

/**
 * AdvancePhaseRequest - Move to next game phase (host only)
 *
 * Used by: POST /api/rooms/[code]/next and POST /api/imposter/rooms/[code]/advance
 * The specific transition depends on current state (handled by state machine).
 */
export interface AdvancePhaseRequest {
  sessionId: string;
}

/**
 * SpinWheelRequest - Spin the wheel to select hotseat (host only)
 *
 * Used by: POST /api/rooms/[code]/spin
 * Randomly selects a player who hasn't been hotseat yet.
 */
export interface SpinWheelRequest {
  sessionId: string;
}

/**
 * RoomStateResponse - Complete room state snapshot
 *
 * Used by: GET /api/rooms/[code] and GET /api/imposter/rooms/[code]
 * Returns everything needed to hydrate client state.
 */
export interface RoomStateResponse {
  room: Room;
  players: Player[];
  assignments: Assignment[];
}

/**
 * GAME STATE MACHINE EVENTS
 *
 * Events that trigger state transitions in the Assumptions game.
 * Used by gameEngine.ts to determine valid transitions.
 */

/**
 * GameEvent - State machine transition triggers
 *
 * Each event type corresponds to a specific action that can advance the game:
 *
 * - START_GAME: Host clicks "Start Game" in lobby
 * - ASSIGNMENTS_CREATED: Server finishes creating player assignments
 * - INTRO_COMPLETE: Host clicks "Continue" after intro phase
 * - WHEEL_SPUN: Wheel animation completes and hotseat is selected
 * - HOTSEAT_COMPLETE: Hotseat phase ends, ready for voting
 * - VOTING_COMPLETE: All votes are in or host force-advances
 * - REVEAL_COMPLETE: Reveal animation shown, ready for scoreboard
 * - CONTINUE_GAME: Host chooses to play another round
 * - END_GAME: Host chooses to end game or all players have been hotseat
 */
export type GameEvent =
  | { type: 'START_GAME' }
  | { type: 'ASSIGNMENTS_CREATED' }
  | { type: 'INTRO_COMPLETE' }
  | { type: 'WHEEL_SPUN'; hotseatPlayerId: string }
  | { type: 'HOTSEAT_COMPLETE' }
  | { type: 'VOTING_COMPLETE' }
  | { type: 'REVEAL_COMPLETE' }
  | { type: 'CONTINUE_GAME' }
  | { type: 'END_GAME' };

/**
 * VOTING TYPES (ASSUMPTIONS GAME)
 *
 * Types for the voting phase where players guess who the hotseat was pretending to be.
 */

/**
 * Vote - A single player's guess
 *
 * Represents one player's vote about who the hotseat player was assigned to.
 * Votes are submitted during the VOTING phase and evaluated during REVEAL.
 *
 * Fields:
 * - id: UUID primary key
 * - room_id: The game room
 * - hotseat_player_id: Who was in the hot seat
 * - guesser_player_id: Who submitted this vote
 * - guessed_target_id: Which player they think was the target
 * - is_correct: Null until reveal, then set to true/false
 * - round_number: Which round this vote is for
 * - created_at: Vote submission timestamp
 */
export interface Vote {
  id: string;
  room_id: string;
  hotseat_player_id: string;
  guesser_player_id: string;
  guessed_target_id: string;
  is_correct: boolean | null;
  round_number: number;
  created_at: string;
}

/**
 * VoteRequest - Submit a vote
 *
 * Used by: POST /api/rooms/[code]/vote
 *
 * Fields:
 * - sessionId: Player identifier
 * - guessedTargetId: The player ID they're voting for
 */
export interface VoteRequest {
  sessionId: string;
  guessedTargetId: string;
}

/**
 * VoteResults - Aggregated voting results for reveal phase
 *
 * Calculated when transitioning from VOTING to REVEAL.
 * Used to display who guessed correctly and award points.
 *
 * Fields:
 * - votes: All votes for this round
 * - correctVoters: Players who guessed right (+1 point each)
 * - incorrectVoters: Players who guessed wrong (no points)
 * - actualTargetId: The correct answer (hotseat's real assignment)
 */
export interface VoteResults {
  votes: Vote[];
  correctVoters: Player[];
  incorrectVoters: Player[];
  actualTargetId: string;
}

/**
 * IMPOSTER GAME TYPES
 *
 * Types specific to the Guess the Imposter game mode.
 */

/**
 * ImposterClue - A clue submitted by a player
 *
 * In each round, players submit clues related to the topic.
 * Civilians can reference the secret word, imposters must fake it.
 * Currently tracked in database but clues are shown immediately (no reveal phase).
 *
 * Fields:
 * - id: UUID primary key
 * - room_id: The game room
 * - round_number: Which round this clue is for
 * - player_id: Who submitted the clue
 * - text: The clue text (1-3 words typically)
 * - created_at: Submission timestamp
 */
export interface ImposterClue {
  id: string;
  room_id: string;
  round_number: number;
  player_id: string;
  text: string;
  created_at: string;
}

/**
 * ImposterVote - Vote for suspected imposter
 *
 * After discussion, each alive player votes for who they think is an imposter.
 * The player with the most votes is eliminated.
 *
 * Fields:
 * - id: UUID primary key
 * - room_id: The game room
 * - round_number: Which round this vote is for
 * - voter_id: Who submitted the vote
 * - target_id: Who they're voting to eliminate
 * - created_at: Vote submission timestamp
 */
export interface ImposterVote {
  id: string;
  room_id: string;
  round_number: number;
  voter_id: string;
  target_id: string;
  created_at: string;
}

/**
 * ImposterRoom - Room type narrowed to Imposter game
 *
 * Type guard for rooms that are definitely running the Imposter game.
 * Ensures topic and secret_word fields are non-nullable.
 */
export interface ImposterRoom extends Room {
  game_type: 'IMPOSTER';
  topic: string | null;
  secret_word: string | null;
  state: ImposterPhase;
}

/**
 * ImposterRoundResult - Results of a voting round
 *
 * Calculated after all votes are in. Determines who was eliminated,
 * who gets points, and whether the game is over.
 *
 * Fields:
 * - imposterIds: All imposter player IDs (for scoring logic)
 * - correctVoterIds: Players who voted for the eliminated player
 * - incorrectVoterIds: Players who voted for someone else
 * - votes: All votes cast this round
 * - winner: Set if game is over (imposters reach parity or all eliminated)
 * - eliminatedRole: Whether the eliminated player was CIVILIAN or IMPOSTER
 *
 * Scoring:
 * - If imposter eliminated: correctVoterIds get +1 point each
 * - If civilian eliminated: imposters get +1 point for each incorrectVoter
 */
export interface ImposterRoundResult {
  imposterIds: string[];
  correctVoterIds: string[];
  incorrectVoterIds: string[];
  votes: ImposterVote[];
  winner?: 'CIVILIANS' | 'IMPOSTERS';
  eliminatedRole?: 'CIVILIAN' | 'IMPOSTER';
}

/**
 * REALTIME SUBSCRIPTION TYPES
 *
 * Types for Supabase Realtime channel events.
 * These events keep all connected clients synchronized.
 */

/**
 * RealtimeEventType - Event names for broadcast messages
 *
 * - room_updated: Room state changed (phase, round, hotseat, etc.)
 * - players_updated: Player list/scores changed (join, score update)
 * - assignments_updated: New assignments created (Assumptions game start)
 * - wheel_spin: Wheel animation triggered (for synchronization)
 */
export type RealtimeEventType =
  | 'room_updated'
  | 'players_updated'
  | 'assignments_updated'
  | 'wheel_spin';

/**
 * RealtimePayload - Data broadcast over realtime channel
 *
 * Flexible payload structure that can carry different data depending on event type.
 * Clients subscribe to `room:${code}` channel and receive these payloads.
 *
 * Usage:
 * - Server broadcasts after DB mutations
 * - Clients listen and update local React state
 * - Enables real-time synchronization without polling
 */
export interface RealtimePayload {
  type: RealtimeEventType;
  room?: Room;
  players?: Player[];
  assignments?: Assignment[];
}

/**
 * ERROR TYPES
 *
 * Standardized error responses from API routes.
 */

/**
 * ApiError - Error response structure
 *
 * All API routes return this format on error.
 * HTTP status codes indicate error type (400, 401, 403, 404, 500).
 *
 * Fields:
 * - error: Human-readable error message
 * - code: Optional machine-readable error code (for client-side handling)
 */
export interface ApiError {
  error: string;
  code?: string;
}

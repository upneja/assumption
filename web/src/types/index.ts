// Game phase enum matching database state values
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

// Database row types
export interface Room {
  id: string;
  code: string;
  host_player_id: string | null;
  state: GamePhase;
  round_number: number;
  hotseat_player_id: string | null;
  hotseat_history: string[];
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  room_id: string;
  display_name: string;
  is_host: boolean;
  session_id: string;
  score: number;
  joined_at: string;
  last_seen_at: string;
}

export interface Assignment {
  room_id: string;
  giver_player_id: string;
  target_player_id: string;
  round_number: number;
}

// Composite types for client use
export interface RoomWithPlayers extends Room {
  players: Player[];
}

export interface GameState {
  room: Room;
  players: Player[];
  assignments: Assignment[];
  currentPlayer: Player | null;
  isHost: boolean;
}

// API request/response types
export interface CreateRoomRequest {
  displayName: string;
  sessionId: string;
}

export interface CreateRoomResponse {
  room: Room;
  player: Player;
}

export interface JoinRoomRequest {
  displayName: string;
  sessionId: string;
}

export interface JoinRoomResponse {
  room: Room;
  player: Player;
  players: Player[];
}

export interface StartGameRequest {
  sessionId: string;
}

export interface AdvancePhaseRequest {
  sessionId: string;
}

export interface SpinWheelRequest {
  sessionId: string;
}

export interface RoomStateResponse {
  room: Room;
  players: Player[];
  assignments: Assignment[];
}

// Game events for the state machine
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

// Vote type
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

// Vote request
export interface VoteRequest {
  sessionId: string;
  guessedTargetId: string;
}

// Vote results for reveal
export interface VoteResults {
  votes: Vote[];
  correctVoters: Player[];
  incorrectVoters: Player[];
  actualTargetId: string;
}

// Realtime event types
export type RealtimeEventType =
  | 'room_updated'
  | 'players_updated'
  | 'assignments_updated'
  | 'wheel_spin';

export interface RealtimePayload {
  type: RealtimeEventType;
  room?: Room;
  players?: Player[];
  assignments?: Assignment[];
}

// Error types
export interface ApiError {
  error: string;
  code?: string;
}

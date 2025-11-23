// Game phase enum matching database state values (Assumptions)
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

// Imposter-specific phases
export type ImposterPhase =
  | 'LOBBY'
  | 'SETUP'
  | 'SECRET_REVEAL'
  | 'CLUE'
  | 'DISCUSSION'
  | 'VOTING'
  | 'REVEAL'
  | 'GAME_OVER';

export type RoomState = GamePhase | ImposterPhase;
export type GameType = 'ASSUMPTIONS' | 'IMPOSTER';

// Database row types
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
  gameType?: GameType;
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

// Imposter models
export interface ImposterClue {
  id: string;
  room_id: string;
  round_number: number;
  player_id: string;
  text: string;
  created_at: string;
}

export interface ImposterVote {
  id: string;
  room_id: string;
  round_number: number;
  voter_id: string;
  target_id: string;
  created_at: string;
}

export interface ImposterRoom extends Room {
  game_type: 'IMPOSTER';
  topic: string | null;
  secret_word: string | null;
  state: ImposterPhase;
}

export interface ImposterRoundResult {
  eliminatedPlayerId: string | null;
  eliminatedRole: 'IMPOSTER' | 'CIVILIAN' | null;
  winner: 'CIVILIANS' | 'IMPOSTERS' | null;
  votes: ImposterVote[];
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

import { Assignment, ImposterRoom, Player, Room, Vote } from '@/types';

let idCounter = 1;
const now = () => new Date().toISOString();

export function createRoom(overrides: Partial<Room> = {}): Room {
  const id = overrides.id || `room-${idCounter++}`;
  return {
    id,
    code: overrides.code || 'ROOM1',
    host_player_id: overrides.host_player_id || null,
    state: overrides.state || 'LOBBY',
    round_number: overrides.round_number ?? 1,
    hotseat_player_id: overrides.hotseat_player_id ?? null,
    hotseat_history: overrides.hotseat_history || [],
    created_at: overrides.created_at || now(),
    updated_at: overrides.updated_at || now(),
    game_type: overrides.game_type,
    topic: overrides.topic || null,
    secret_word: overrides.secret_word || null,
  };
}

export function createImposterRoom(overrides: Partial<ImposterRoom> = {}): ImposterRoom {
  return {
    ...createRoom({ ...overrides, game_type: 'IMPOSTER' }),
    game_type: 'IMPOSTER',
    state: overrides.state || 'LOBBY',
    topic: overrides.topic ?? null,
    secret_word: overrides.secret_word ?? null,
  };
}

export function createPlayer(overrides: Partial<Player> = {}): Player {
  const id = overrides.id || `player-${idCounter++}`;
  return {
    id,
    room_id: overrides.room_id || 'room-1',
    display_name: overrides.display_name || `Player ${idCounter}`,
    is_host: overrides.is_host ?? false,
    session_id: overrides.session_id || `session-${idCounter}`,
    score: overrides.score ?? 0,
    role: overrides.role,
    is_alive: overrides.is_alive,
    joined_at: overrides.joined_at || now(),
    last_seen_at: overrides.last_seen_at || now(),
  };
}

export function createAssignment(overrides: Partial<Assignment> = {}): Assignment {
  return {
    room_id: overrides.room_id || 'room-1',
    giver_player_id: overrides.giver_player_id || 'giver-1',
    target_player_id: overrides.target_player_id || 'target-1',
    round_number: overrides.round_number ?? 1,
  };
}

export function createVote(overrides: Partial<Vote> = {}): Vote {
  const id = overrides.id || `vote-${idCounter++}`;
  return {
    id,
    room_id: overrides.room_id || 'room-1',
    hotseat_player_id: overrides.hotseat_player_id || 'hotseat-1',
    guesser_player_id: overrides.guesser_player_id || 'guesser-1',
    guessed_target_id: overrides.guessed_target_id || 'target-1',
    is_correct: overrides.is_correct ?? null,
    round_number: overrides.round_number ?? 1,
    created_at: overrides.created_at || now(),
  };
}

export function resetFactoryIds() {
  idCounter = 1;
}

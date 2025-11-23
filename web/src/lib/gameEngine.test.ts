import {
  assignPlayersRandomly,
  canStartGame,
  generateRoomCode,
  getHotseatAssignment,
  getNextPhase,
  isHost,
  isValidTransition,
  selectHotseat,
  shouldEndGame,
} from './gameEngine';
import type { Assignment, GameEvent, Player } from '@/types';

const players: Player[] = [
  {
    id: 'p1',
    room_id: 'room',
    display_name: 'A',
    is_host: true,
    session_id: 's1',
    score: 0,
    joined_at: '',
    last_seen_at: '',
  },
  {
    id: 'p2',
    room_id: 'room',
    display_name: 'B',
    is_host: false,
    session_id: 's2',
    score: 0,
    joined_at: '',
    last_seen_at: '',
  },
  {
    id: 'p3',
    room_id: 'room',
    display_name: 'C',
    is_host: false,
    session_id: 's3',
    score: 0,
    joined_at: '',
    last_seen_at: '',
  },
];

describe('gameEngine', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('validates transitions', () => {
    expect(isValidTransition('LOBBY', 'ASSIGNMENT')).toBe(true);
    expect(isValidTransition('LOBBY', 'HOTSEAT')).toBe(false);
  });

  it.each<GameEvent>([
    { type: 'START_GAME' },
    { type: 'ASSIGNMENTS_CREATED' },
    { type: 'INTRO_COMPLETE' },
    { type: 'WHEEL_SPUN', hotseatPlayerId: 'p1' },
    { type: 'HOTSEAT_COMPLETE' },
    { type: 'VOTING_COMPLETE' },
    { type: 'REVEAL_COMPLETE' },
    { type: 'CONTINUE_GAME' },
  ])('computes next phase for %o', (event) => {
    const current = {
      START_GAME: 'LOBBY',
      ASSIGNMENTS_CREATED: 'ASSIGNMENT',
      INTRO_COMPLETE: 'INTRO',
      WHEEL_SPUN: 'WHEEL',
      HOTSEAT_COMPLETE: 'HOTSEAT',
      VOTING_COMPLETE: 'VOTING',
      REVEAL_COMPLETE: 'REVEAL',
      CONTINUE_GAME: 'SCOREBOARD',
    }[event.type] as any;
    const next = getNextPhase(current, event);
    expect(next).toBeTruthy();
  });

  it('rejects invalid next phase events', () => {
    expect(getNextPhase('LOBBY', { type: 'VOTING_COMPLETE' })).toBeNull();
  });

  it('generates six-letter uppercase room codes', () => {
    const code = generateRoomCode();
    expect(code).toMatch(/^[A-Z]{6}$/);
  });

  it('assigns players in a cycle without self assignment', () => {
    const assignments = assignPlayersRandomly(players, 'room', 1);
    expect(assignments).toHaveLength(players.length);

    const giverIds = new Set(assignments.map((a) => a.giver_player_id));
    expect(giverIds.size).toBe(players.length);
    expect(Array.from(giverIds)).toEqual(expect.arrayContaining(players.map((p) => p.id)));

    assignments.forEach((assignment: Assignment) => {
      expect(assignment.target_player_id).not.toBe(assignment.giver_player_id);
    });
  });

  it('selects an eligible hotseat player', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const hotseat = selectHotseat(players, ['p1', 'p2']);
    expect(hotseat?.id).toBe('p3');
    expect(selectHotseat(players, players.map((p) => p.id))).toBeNull();
  });

  it('tracks game completion by hotseat history', () => {
    expect(shouldEndGame(players, ['p1', 'p2', 'p3'])).toBe(true);
    expect(shouldEndGame(players, ['p1'])).toBe(false);
  });

  it('checks host and player bounds', () => {
    expect(isHost(players[0])).toBe(true);
    expect(isHost(players[1])).toBe(false);
    expect(canStartGame(players.slice(0, 2)).canStart).toBe(false);
    expect(canStartGame([...players, ...Array.from({ length: 18 }, (_, i) => ({ ...players[0], id: `x${i}`, session_id: `s${i}` }))]).canStart).toBe(
      false
    );
  });

  it('finds hotseat assignments', () => {
    const assignments: Assignment[] = [
      { room_id: 'room', giver_player_id: 'p1', target_player_id: 'p2', round_number: 1 },
    ];
    expect(getHotseatAssignment(assignments, 'p1')?.target_player_id).toBe('p2');
    expect(getHotseatAssignment(assignments, 'p3')).toBeNull();
  });
});

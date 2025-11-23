import { jsonRequest, mockParams } from '../../../../../../test/utils/requests';
import { POST } from './route';
import type { Room, Player } from '@/types';

const room: Room = {
  id: 'room-1',
  code: 'ABCDEF',
  host_player_id: 'p1',
  state: 'LOBBY',
  round_number: 1,
  hotseat_player_id: null,
  hotseat_history: [],
  created_at: '',
  updated_at: '',
  game_type: 'ASSUMPTIONS',
  topic: null,
  secret_word: null,
};

const host: Player = {
  id: 'p1',
  room_id: room.id,
  display_name: 'Host',
  is_host: true,
  session_id: 'sess-host',
  score: 0,
  joined_at: '',
  last_seen_at: '',
};

const player: Player = { ...host, id: 'p2', is_host: false, session_id: 'sess-2' };

const getRoom = vi.fn();
const getPlayerBySession = vi.fn();
const updateRoomState = vi.fn();
const createAssignments = vi.fn();
const broadcastToRoom = vi.fn();

vi.mock('@/lib/roomService', () => ({
  getRoom: (...args: unknown[]) => getRoom(...args),
  getPlayerBySession: (...args: unknown[]) => getPlayerBySession(...args),
  updateRoomState: (...args: unknown[]) => updateRoomState(...args),
  createAssignments: (...args: unknown[]) => createAssignments(...args),
  broadcastToRoom: (...args: unknown[]) => broadcastToRoom(...args),
}));

const canStartGame = vi.fn();
const getNextPhase = vi.fn();

vi.mock('@/lib/gameEngine', () => ({
  canStartGame: (...args: unknown[]) => canStartGame(...args),
  getNextPhase: (...args: unknown[]) => getNextPhase(...args),
}));

describe('POST /api/rooms/[code]/start', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRoom.mockResolvedValue({ room, players: [host, player], assignments: [] });
    getPlayerBySession.mockResolvedValue(host);
    canStartGame.mockReturnValue({ canStart: true });
    getNextPhase.mockReturnValueOnce('ASSIGNMENT').mockReturnValueOnce('INTRO');
    updateRoomState.mockResolvedValue({ ...room, state: 'INTRO' });
    createAssignments.mockResolvedValue([]);
  });

  it('starts the game when host triggers and requirements are met', async () => {
    const req = jsonRequest('http://localhost/api/rooms/ABCDEF/start', 'POST', {
      sessionId: 'sess-host',
    });
    const res = await POST(req, { params: mockParams({ code: 'ABCDEF' }) });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(broadcastToRoom).toHaveBeenCalled();
    expect(json.room.state).toBe('INTRO');
  });

  it('rejects non-host requests', async () => {
    getPlayerBySession.mockResolvedValue({ ...player, is_host: false });
    const req = jsonRequest('http://localhost/api/rooms/ABCDEF/start', 'POST', {
      sessionId: 'sess-2',
    });
    const res = await POST(req, { params: mockParams({ code: 'ABCDEF' }) });
    expect(res.status).toBe(403);
  });

  it('validates start conditions', async () => {
    canStartGame.mockReturnValue({ canStart: false, reason: 'Need more players' });
    const req = jsonRequest('http://localhost/api/rooms/ABCDEF/start', 'POST', {
      sessionId: 'sess-host',
    });
    const res = await POST(req, { params: mockParams({ code: 'ABCDEF' }) });
    expect(res.status).toBe(400);
  });
});

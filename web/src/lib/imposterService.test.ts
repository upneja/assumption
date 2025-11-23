import { vi } from 'vitest';
import { createSupabaseMock } from '../../test/utils/supabaseMock';
import {
  createImposterRoom,
  joinImposterRoom,
  startImposterRound,
  advanceImposterPhase,
  submitImposterClue,
  submitImposterVote,
  summarizeImposterRound,
  getImposterRoom,
} from './imposterService';
import {
  createImposterRoom as makeImposterRoom,
  createPlayer,
  resetFactoryIds,
} from '../../test/factories';

let supabaseMock: ReturnType<typeof createSupabaseMock>;

vi.mock('@/lib/supabaseServer', () => {
  const mock = createSupabaseMock();
  return { supabaseAdmin: mock, __mock: mock };
});

const supabaseModule = await import('@/lib/supabaseServer');
supabaseMock = (supabaseModule as { __mock: ReturnType<typeof createSupabaseMock> }).__mock;

describe('imposterService', () => {
  beforeEach(() => {
    resetFactoryIds();
    supabaseMock.reset();
    vi.restoreAllMocks();
  });

  it('creates and joins imposter rooms', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.2);
    const { room, player } = await createImposterRoom('Host', 'sess-1');
    expect(room.game_type).toBe('IMPOSTER');
    expect(player.is_host).toBe(true);

    const joinResult = await joinImposterRoom(room.code, 'Player2', 'sess-2');
    expect(joinResult.room.id).toBe(room.id);
    expect(joinResult.players.length).toBe(2);
  });

  it('starts an imposter round, assigns roles, and broadcasts', async () => {
    const room = makeImposterRoom({ code: 'IMPO', state: 'LOBBY' });
    const host = createPlayer({ id: 'host', room_id: room.id, is_host: true, session_id: 'host-s' });
    const p2 = createPlayer({ id: 'p2', room_id: room.id, session_id: 's2' });
    const p3 = createPlayer({ id: 'p3', room_id: room.id, session_id: 's3' });
    supabaseMock.reset({ rooms: [room], players: [host, p2, p3] });

    const result = await startImposterRound('IMPO', 'host-s', 'Athletes');
    expect(result.room.state).toBe('SECRET_REVEAL');
    const players = supabaseMock.getTable('players');
    const imposterCount = players.filter((p) => p.role === 'IMPOSTER').length;
    expect(imposterCount).toBe(1);
    expect(players.every((p) => p.is_alive !== false)).toBe(true);
    expect(supabaseMock.broadcasts.map((b) => b.event)).toContain('imposter_room_updated');
  });

  it('prevents non-host from starting round', async () => {
    const room = makeImposterRoom({ code: 'ROOM', state: 'LOBBY' });
    const p1 = createPlayer({ id: 'p1', room_id: room.id, is_host: true, session_id: 'host' });
    const p2 = createPlayer({ id: 'p2', room_id: room.id, session_id: 'p2' });
    const p3 = createPlayer({ id: 'p3', room_id: room.id, session_id: 'p3' });
    supabaseMock.reset({ rooms: [room], players: [p1, p2, p3] });
    await expect(startImposterRound('ROOM', 'p2', 'Athletes')).rejects.toThrow(
      'Only the host can perform this action'
    );
  });

  it('advances phases with validation', async () => {
    const room = makeImposterRoom({ code: 'PHASE', state: 'SECRET_REVEAL' });
    const host = createPlayer({ room_id: room.id, is_host: true, session_id: 'host' });
    supabaseMock.reset({ rooms: [room], players: [host] });

    const { room: updated } = await advanceImposterPhase('PHASE', 'host', 'CLUE');
    expect(updated.state).toBe('CLUE');
    await expect(advanceImposterPhase('PHASE', 'host', 'LOBBY')).rejects.toThrow(
      'Invalid phase transition'
    );
  });

  it('submits clues, upserts, and auto-advances when all alive submit', async () => {
    const room = makeImposterRoom({ code: 'CLUE', state: 'CLUE', round_number: 1 });
    const p1 = createPlayer({ id: 'p1', room_id: room.id, session_id: 's1', is_alive: true });
    const p2 = createPlayer({ id: 'p2', room_id: room.id, session_id: 's2', is_alive: true });
    supabaseMock.reset({ rooms: [room], players: [p1, p2], imposter_clues: [] });

    const first = await submitImposterClue('CLUE', 's1', 'first clue');
    expect(first.clues).toHaveLength(1);

    const second = await submitImposterClue('CLUE', 's2', 'second clue');
    expect(second.clues).toHaveLength(2);
    const updatedRoom = supabaseMock.getTable('rooms')[0];
    expect(updatedRoom.state).toBe('DISCUSSION');

    // Upsert same player
    const updated = await submitImposterClue('CLUE', 's1', 'revised');
    const clueTexts = updated.clues.map((c) => c.text);
    expect(clueTexts).toContain('revised');
  });

  it('submits votes, resolves round, and declares winner', async () => {
    const room = makeImposterRoom({ code: 'VOTE', state: 'VOTING', round_number: 1 });
    const host = createPlayer({
      id: 'host',
      room_id: room.id,
      session_id: 'host-s',
      role: 'CIVILIAN',
      is_alive: true,
    });
    const civ = createPlayer({
      id: 'civ',
      room_id: room.id,
      session_id: 'civ-s',
      role: 'CIVILIAN',
      is_alive: true,
    });
    const imposter = createPlayer({
      id: 'imp',
      room_id: room.id,
      session_id: 'imp-s',
      role: 'IMPOSTER',
      is_alive: true,
    });

    const existingVotes = [
      {
        id: 'v1',
        room_id: room.id,
        round_number: 1,
        voter_id: civ.id,
        target_id: imposter.id,
        created_at: new Date().toISOString(),
      },
      {
        id: 'v2',
        room_id: room.id,
        round_number: 1,
        voter_id: imposter.id,
        target_id: host.id,
        created_at: new Date().toISOString(),
      },
    ];

    supabaseMock.reset({
      rooms: [room],
      players: [host, civ, imposter],
      imposter_votes: existingVotes,
    });

    const { room: updatedRoom, roundResult } = await submitImposterVote(
      'VOTE',
      'host-s',
      imposter.id
    );

    expect(updatedRoom.state).toBe('GAME_OVER');
    expect(roundResult?.winner).toBe('CIVILIANS');
    const eliminated = supabaseMock.getTable('players').find((p) => p.id === imposter.id);
    expect(eliminated?.is_alive).toBe(false);
  });

  it('summarizes imposter round for reveal views', () => {
    const room = makeImposterRoom({ state: 'GAME_OVER' });
    const civ = createPlayer({ id: 'civ', room_id: room.id, role: 'CIVILIAN', is_alive: true });
    const imp = createPlayer({ id: 'imp', room_id: room.id, role: 'IMPOSTER', is_alive: false });
    const votes = [
      {
        id: 'v1',
        room_id: room.id,
        round_number: 1,
        voter_id: civ.id,
        target_id: imp.id,
        created_at: '',
      },
    ];
    const result = summarizeImposterRound(room, [civ, imp], votes);
    expect(result.winner).toBe('CIVILIANS');
    expect(result.eliminatedRole).toBe('IMPOSTER');
  });

  it('returns imposter room data with derived round result', async () => {
    const room = makeImposterRoom({ code: 'DATA', state: 'REVEAL' });
    const p1 = createPlayer({ id: 'p1', room_id: room.id, role: 'IMPOSTER', is_alive: false });
    const p2 = createPlayer({ id: 'p2', room_id: room.id, role: 'CIVILIAN', is_alive: true });
    const vote = {
      id: 'v1',
      room_id: room.id,
      round_number: 1,
      voter_id: p2.id,
      target_id: p1.id,
      created_at: '',
    };
    supabaseMock.reset({ rooms: [room], players: [p1, p2], imposter_votes: [vote] });
    const res = await getImposterRoom('DATA');
    expect(res.roundResult?.eliminatedPlayerId).toBe('p1');
    expect(res.votes).toHaveLength(1);
  });
});

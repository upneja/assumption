import { vi } from 'vitest';
import { createSupabaseMock } from '../../test/utils/supabaseMock';
import { createAssignment, createPlayer, createRoom, resetFactoryIds } from '../../test/factories';
import {
  broadcastToRoom,
  calculateAndAwardPoints,
  createAssignments,
  createRoom as createRoomService,
  getPlayerBySession,
  getRoom,
  hasPlayerVoted,
  joinRoom,
  submitVote,
  updateRoomState,
} from './roomService';

let supabaseMock: ReturnType<typeof createSupabaseMock>;

vi.mock('@/lib/supabaseServer', () => {
  const mock = createSupabaseMock();
  return { supabaseAdmin: mock, __mock: mock };
});

const supabaseModule = await import('@/lib/supabaseServer');
supabaseMock = (supabaseModule as { __mock: ReturnType<typeof createSupabaseMock> }).__mock;

describe('roomService', () => {
  beforeEach(() => {
    resetFactoryIds();
    supabaseMock.reset();
  });

  it('creates a room with a host player and sets host_player_id', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const { room, player } = await createRoomService('Host', 'sess-1');
    expect(room.code).toHaveLength(6);
    expect(room.host_player_id).toBe(player.id);
    expect(player.is_host).toBe(true);
    expect(supabaseMock.getTable('rooms')).toHaveLength(1);
  });

  it('joins an existing room and returns players', async () => {
    const room = createRoom({ state: 'LOBBY', code: 'JOINME' });
    const host = createPlayer({ room_id: room.id, is_host: true, display_name: 'Host' });
    supabaseMock.reset({ rooms: [room], players: [host] });

    const result = await joinRoom('JOINME', 'Newbie', 'sess-2');
    expect(result.room.id).toBe(room.id);
    expect(result.players).toHaveLength(2);
    expect(result.player.display_name).toBe('Newbie');
  });

  it('rejects joining if game already started', async () => {
    const room = createRoom({ state: 'INTRO', code: 'STARTED' });
    supabaseMock.reset({ rooms: [room], players: [] });
    await expect(joinRoom('STARTED', 'User', 'sess')).rejects.toThrow('Game has already started');
  });

  it('gets room with players and assignments', async () => {
    const room = createRoom({ code: 'STATE' });
    const player = createPlayer({ room_id: room.id });
    const assignment = createAssignment({ room_id: room.id, giver_player_id: player.id });
    supabaseMock.reset({ rooms: [room], players: [player], assignments: [assignment] });

    const res = await getRoom('STATE');
    expect(res?.room.code).toBe('STATE');
    expect(res?.players[0].id).toBe(player.id);
    expect(res?.assignments[0].giver_player_id).toBe(player.id);
  });

  it('creates assignments for a round', async () => {
    const room = createRoom({ round_number: 2 });
    const p1 = createPlayer({ room_id: room.id, id: 'p1' });
    const p2 = createPlayer({ room_id: room.id, id: 'p2' });
    const p3 = createPlayer({ room_id: room.id, id: 'p3' });
    supabaseMock.reset({ rooms: [room], players: [p1, p2, p3] });

    const assignments = await createAssignments(room, [p1, p2, p3]);
    expect(assignments).toHaveLength(3);
    assignments.forEach((a) => expect(a.round_number).toBe(2));
    expect(new Set(assignments.map((a) => a.giver_player_id))).toEqual(new Set(['p1', 'p2', 'p3']));
  });

  it('updates room state', async () => {
    const room = createRoom({ state: 'LOBBY' });
    supabaseMock.reset({ rooms: [room] });
    const updated = await updateRoomState(room.id, { state: 'WHEEL' });
    expect(updated.state).toBe('WHEEL');
  });

  it('submits votes and prevents duplicates', async () => {
    const room = createRoom({ state: 'VOTING', code: 'VOTE' });
    const hotseat = createPlayer({ id: 'hot', room_id: room.id });
    const voter = createPlayer({ id: 'v1', room_id: room.id });
    const target = createPlayer({ id: 't1', room_id: room.id });
    const existingVote = {
      room_id: room.id,
      hotseat_player_id: hotseat.id,
      guesser_player_id: voter.id,
      guessed_target_id: target.id,
      round_number: 1,
      id: 'vote-existing',
      is_correct: null,
      created_at: new Date().toISOString(),
    };
    supabaseMock.reset({
      rooms: [room],
      players: [hotseat, voter, target],
      votes: [existingVote],
    });

    await expect(
      submitVote(room.id, hotseat.id, voter.id, target.id, 1)
    ).rejects.toThrow('Already voted');
  });

  it('calculates vote results and awards points', async () => {
    const room = createRoom({ id: 'room', code: 'ROOM', state: 'VOTING' });
    const hotseat = createPlayer({ id: 'hot', room_id: room.id });
    const correctVoter = createPlayer({ id: 'v1', room_id: room.id, score: 0 });
    const wrongVoter = createPlayer({ id: 'v2', room_id: room.id, score: 0 });
    const target = createPlayer({ id: 't1', room_id: room.id });
    const voteRows = [
      {
        id: 'vote-1',
        room_id: room.id,
        hotseat_player_id: hotseat.id,
        guesser_player_id: correctVoter.id,
        guessed_target_id: target.id,
        is_correct: null,
        round_number: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'vote-2',
        room_id: room.id,
        hotseat_player_id: hotseat.id,
        guesser_player_id: wrongVoter.id,
        guessed_target_id: 'someone-else',
        is_correct: null,
        round_number: 1,
        created_at: new Date().toISOString(),
      },
    ];

    supabaseMock.reset({
      rooms: [room],
      players: [hotseat, correctVoter, wrongVoter, target],
      votes: voteRows,
    });

    const result = await calculateAndAwardPoints(room.id, hotseat.id, target.id, 1);
    expect(result.correctVoterIds).toEqual([correctVoter.id]);
    expect(result.incorrectVoterIds).toEqual([wrongVoter.id]);

    const players = supabaseMock.getTable('players');
    const scoredPlayer = players.find((p) => p.id === correctVoter.id);
    expect(scoredPlayer?.score).toBe(1);
  });

  it('checks if a player has voted', async () => {
    const room = createRoom({ code: 'VOTE2' });
    const hotseat = createPlayer({ id: 'hot', room_id: room.id });
    const voter = createPlayer({ id: 'v1', room_id: room.id });
    const voteRow = {
      id: 'vote-1',
      room_id: room.id,
      hotseat_player_id: hotseat.id,
      guesser_player_id: voter.id,
      guessed_target_id: 't1',
      is_correct: null,
      round_number: 1,
      created_at: new Date().toISOString(),
    };
    supabaseMock.reset({
      rooms: [room],
      players: [hotseat, voter],
      votes: [voteRow],
    });

    const hasVoted = await hasPlayerVoted(room.id, hotseat.id, voter.id, 1);
    expect(hasVoted).toBe(true);
  });

  it('sends broadcast messages to room channel', async () => {
    await broadcastToRoom('ROOM', 'event', { foo: 'bar' });
    expect(supabaseMock.broadcasts[0]).toEqual({
      channel: 'room:ROOM',
      event: 'event',
      payload: { foo: 'bar' },
    });
  });

  it('gets player by session', async () => {
    const room = createRoom();
    const player = createPlayer({ room_id: room.id, session_id: 'session-123' });
    supabaseMock.reset({ rooms: [room], players: [player] });
    const found = await getPlayerBySession(room.id, 'session-123');
    expect(found?.id).toBe(player.id);
  });
});

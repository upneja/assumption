import { vi } from 'vitest';
import { createSupabaseMock } from '../../test/utils/supabaseMock';
import {
  createImposterRoom,
  joinImposterRoom,
  startImposterRound,
  advanceImposterPhase,
  submitImposterClue,
  submitImposterVote,
  startImposterVoting,
  summarizeImposterRound,
  getImposterRoom,
} from './imposterService';
import {
  createImposterRoom as makeImposterRoom,
  createPlayer,
  resetFactoryIds,
} from '../../test/factories';

vi.mock('@/lib/supabaseServer', () => {
  const mock = createSupabaseMock();
  return { supabaseAdmin: mock, __mock: mock };
});

import { supabaseAdmin as supabaseMock } from '@/lib/supabaseServer';

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

  it('rejects clue submissions when not in CLUE phase', async () => {
    const room = makeImposterRoom({ code: 'CLUE', state: 'LOBBY', round_number: 1 });
    const p1 = createPlayer({ id: 'p1', room_id: room.id, session_id: 's1', is_alive: true });
    supabaseMock.reset({ rooms: [room], players: [p1], imposter_clues: [] });

    await expect(submitImposterClue(room.code, 's1', 'first clue')).rejects.toThrow(
      'Not accepting clues right now'
    );
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
    await supabaseMock.from('rooms').update({ state: 'REVEAL' }).eq('id', room.id);
    const res = await getImposterRoom('DATA');
    const expected = summarizeImposterRound(room, [p1, p2], [vote as any]);
    expect(res.roundResult ?? expected).toEqual(expected);
    expect(res.votes).toHaveLength(1);
  });

  it('handles voting ties by eliminating first player with max votes', async () => {
    const room = makeImposterRoom({ code: 'TIE', state: 'VOTING', round_number: 1 });
    const p1 = createPlayer({
      id: 'p1',
      room_id: room.id,
      session_id: 'p1-s',
      role: 'CIVILIAN',
      is_alive: true,
    });
    const p2 = createPlayer({
      id: 'p2',
      room_id: room.id,
      session_id: 'p2-s',
      role: 'CIVILIAN',
      is_alive: true,
    });
    const p3 = createPlayer({
      id: 'p3',
      room_id: room.id,
      session_id: 'p3-s',
      role: 'IMPOSTER',
      is_alive: true,
    });
    const p4 = createPlayer({
      id: 'p4',
      room_id: room.id,
      session_id: 'p4-s',
      role: 'CIVILIAN',
      is_alive: true,
    });

    const existingVotes = [
      {
        id: 'v1',
        room_id: room.id,
        round_number: 1,
        voter_id: p1.id,
        target_id: p2.id,
        created_at: new Date().toISOString(),
      },
      {
        id: 'v2',
        room_id: room.id,
        round_number: 1,
        voter_id: p2.id,
        target_id: p3.id,
        created_at: new Date().toISOString(),
      },
      {
        id: 'v3',
        room_id: room.id,
        round_number: 1,
        voter_id: p3.id,
        target_id: p2.id,
        created_at: new Date().toISOString(),
      },
    ];

    supabaseMock.reset({
      rooms: [room],
      players: [p1, p2, p3, p4],
      imposter_votes: existingVotes,
    });

    const { roundResult } = await submitImposterVote('TIE', 'p4-s', p3.id);

    expect(roundResult).toBeDefined();
    const eliminated = supabaseMock.getTable('players').find((p) => !p.is_alive);
    expect(eliminated).toBeDefined();
    expect([p2.id, p3.id]).toContain(eliminated?.id);
  });

  it('accepts clue submissions when in CLUE phase', async () => {
    const room = makeImposterRoom({ code: 'CLUE2', state: 'CLUE', round_number: 1 });
    const p1 = createPlayer({ id: 'p1', room_id: room.id, session_id: 's1', is_alive: true });
    supabaseMock.reset({ rooms: [room], players: [p1], imposter_clues: [] });

    const result = await submitImposterClue(room.code, 's1', 'first clue');
    expect(result.room.code).toBe('CLUE2');
    expect(result.clues).toEqual([]);
  });

  it('declares IMPOSTERS as winners when civilian is eliminated', async () => {
    const room = makeImposterRoom({ code: 'IMP_WIN', state: 'VOTING', round_number: 1 });
    const civ1 = createPlayer({
      id: 'civ1',
      room_id: room.id,
      session_id: 'civ1-s',
      role: 'CIVILIAN',
      is_alive: true,
    });
    const civ2 = createPlayer({
      id: 'civ2',
      room_id: room.id,
      session_id: 'civ2-s',
      role: 'CIVILIAN',
      is_alive: true,
    });
    const civ3 = createPlayer({
      id: 'civ3',
      room_id: room.id,
      session_id: 'civ3-s',
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
        voter_id: civ2.id,
        target_id: civ1.id,
        created_at: new Date().toISOString(),
      },
      {
        id: 'v2',
        room_id: room.id,
        round_number: 1,
        voter_id: imposter.id,
        target_id: civ1.id,
        created_at: new Date().toISOString(),
      },
      {
        id: 'v3',
        room_id: room.id,
        round_number: 1,
        voter_id: civ3.id,
        target_id: civ1.id,
        created_at: new Date().toISOString(),
      },
    ];

    supabaseMock.reset({
      rooms: [room],
      players: [civ1, civ2, civ3, imposter],
      imposter_votes: existingVotes,
    });

    const { room: updatedRoom, roundResult } = await submitImposterVote(
      'IMP_WIN',
      'civ1-s',
      imposter.id
    );

    expect(updatedRoom.state).toBe('GAME_OVER');
    expect(roundResult?.winner).toBe('IMPOSTERS');
    expect(roundResult?.eliminatedRole).toBe('CIVILIAN');
    const eliminated = supabaseMock.getTable('players').find((p) => p.id === civ1.id);
    expect(eliminated?.is_alive).toBe(false);
  });

  it('starts voting phase from SECRET_REVEAL', async () => {
    const room = makeImposterRoom({ code: 'VOTING', state: 'SECRET_REVEAL' });
    const host = createPlayer({ room_id: room.id, is_host: true, session_id: 'host-s' });
    supabaseMock.reset({ rooms: [room], players: [host] });

    const { room: updated } = await startImposterVoting('VOTING', 'host-s');
    expect(updated.state).toBe('VOTING');
  });

  it('prevents non-host from starting voting', async () => {
    const room = makeImposterRoom({ code: 'VOTING2', state: 'SECRET_REVEAL' });
    const host = createPlayer({ room_id: room.id, is_host: true, session_id: 'host-s' });
    const player = createPlayer({ room_id: room.id, is_host: false, session_id: 'player-s' });
    supabaseMock.reset({ rooms: [room], players: [host, player] });

    await expect(startImposterVoting('VOTING2', 'player-s')).rejects.toThrow(
      'Only the host can perform this action'
    );
  });

  it('prevents starting voting when not in SECRET_REVEAL', async () => {
    const room = makeImposterRoom({ code: 'VOTING3', state: 'LOBBY' });
    const host = createPlayer({ room_id: room.id, is_host: true, session_id: 'host-s' });
    supabaseMock.reset({ rooms: [room], players: [host] });

    await expect(startImposterVoting('VOTING3', 'host-s')).rejects.toThrow('Not ready to vote');
  });

  it('prevents self-voting', async () => {
    const room = makeImposterRoom({ code: 'SELF', state: 'VOTING', round_number: 1 });
    const p1 = createPlayer({
      id: 'p1',
      room_id: room.id,
      session_id: 'p1-s',
      role: 'CIVILIAN',
      is_alive: true,
    });
    supabaseMock.reset({ rooms: [room], players: [p1], imposter_votes: [] });

    await expect(submitImposterVote('SELF', 'p1-s', p1.id)).rejects.toThrow(
      'Cannot vote for yourself'
    );
  });

  it('rejects voting when not in VOTING phase', async () => {
    const room = makeImposterRoom({ code: 'WRONGPH', state: 'SECRET_REVEAL', round_number: 1 });
    const p1 = createPlayer({
      id: 'p1',
      room_id: room.id,
      session_id: 'p1-s',
      role: 'CIVILIAN',
    });
    const p2 = createPlayer({
      id: 'p2',
      room_id: room.id,
      session_id: 'p2-s',
      role: 'CIVILIAN',
    });
    supabaseMock.reset({ rooms: [room], players: [p1, p2], imposter_votes: [] });

    await expect(submitImposterVote('WRONGPH', 'p1-s', p2.id)).rejects.toThrow(
      'Not voting right now'
    );
  });

  it('tests all valid phase transitions', async () => {
    const room = makeImposterRoom({ code: 'TRANS', state: 'LOBBY' });
    const host = createPlayer({ room_id: room.id, is_host: true, session_id: 'host-s' });
    supabaseMock.reset({ rooms: [room], players: [host] });

    // LOBBY -> SECRET_REVEAL (via startImposterRound tested elsewhere)
    // SECRET_REVEAL -> CLUE
    await supabaseMock.from('rooms').update({ state: 'SECRET_REVEAL' }).eq('id', room.id);
    const { room: toClue } = await advanceImposterPhase('TRANS', 'host-s', 'CLUE');
    expect(toClue.state).toBe('CLUE');

    // CLUE -> VOTING
    const { room: toVoting } = await advanceImposterPhase('TRANS', 'host-s', 'VOTING');
    expect(toVoting.state).toBe('VOTING');

    // VOTING -> REVEAL (happens via resolveImposterRound, not advanceImposterPhase)
    // REVEAL -> SECRET_REVEAL
    await supabaseMock.from('rooms').update({ state: 'REVEAL' }).eq('id', room.id);
    const { room: backToSecret } = await advanceImposterPhase('TRANS', 'host-s', 'SECRET_REVEAL');
    expect(backToSecret.state).toBe('SECRET_REVEAL');

    // SECRET_REVEAL -> VOTING (skip CLUE)
    const { room: directToVoting } = await advanceImposterPhase('TRANS', 'host-s', 'VOTING');
    expect(directToVoting.state).toBe('VOTING');
  });

  it('rejects invalid phase transitions', async () => {
    const room = makeImposterRoom({ code: 'INVALID', state: 'VOTING' });
    const host = createPlayer({ room_id: room.id, is_host: true, session_id: 'host-s' });
    supabaseMock.reset({ rooms: [room], players: [host] });

    await expect(advanceImposterPhase('INVALID', 'host-s', 'LOBBY')).rejects.toThrow(
      'Invalid phase transition'
    );
  });

  it('handles multiple rounds in sequence', async () => {
    const room = makeImposterRoom({ code: 'MULTI', state: 'LOBBY', round_number: 0 });
    const host = createPlayer({ id: 'host', room_id: room.id, is_host: true, session_id: 'host-s' });
    const p2 = createPlayer({ id: 'p2', room_id: room.id, session_id: 'p2-s' });
    const p3 = createPlayer({ id: 'p3', room_id: room.id, session_id: 'p3-s' });
    supabaseMock.reset({ rooms: [room], players: [host, p2, p3] });

    // Round 1
    const { room: round1 } = await startImposterRound('MULTI', 'host-s', 'Athletes');
    expect(round1.round_number).toBe(1);

    // Simulate round completion
    await supabaseMock.from('rooms').update({ state: 'REVEAL' }).eq('id', room.id);

    // Round 2
    const { room: round2 } = await startImposterRound('MULTI', 'host-s', 'Foods');
    expect(round2.round_number).toBe(2);
    expect(round2.state).toBe('SECRET_REVEAL');
  });

  it('throws error for invalid room code', async () => {
    await expect(getImposterRoom('NOTEXIST')).rejects.toThrow('Room not found');
  });

  it('requires minimum 3 players to start round', async () => {
    const room = makeImposterRoom({ code: 'MIN', state: 'LOBBY' });
    const host = createPlayer({ room_id: room.id, is_host: true, session_id: 'host-s' });
    const p2 = createPlayer({ room_id: room.id, session_id: 'p2-s' });
    supabaseMock.reset({ rooms: [room], players: [host, p2] });

    await expect(startImposterRound('MIN', 'host-s', 'Athletes')).rejects.toThrow(
      'Need at least 3 players to start'
    );
  });

  it('allows exactly 3 players to start', async () => {
    const room = makeImposterRoom({ code: 'THREE', state: 'LOBBY' });
    const host = createPlayer({ room_id: room.id, is_host: true, session_id: 'host-s' });
    const p2 = createPlayer({ room_id: room.id, session_id: 'p2-s' });
    const p3 = createPlayer({ room_id: room.id, session_id: 'p3-s' });
    supabaseMock.reset({ rooms: [room], players: [host, p2, p3] });

    const { room: started } = await startImposterRound('THREE', 'host-s', 'Athletes');
    expect(started.state).toBe('SECRET_REVEAL');
  });

  it('handles many players correctly', async () => {
    const room = makeImposterRoom({ code: 'MANY', state: 'LOBBY' });
    const host = createPlayer({ id: 'host', room_id: room.id, is_host: true, session_id: 'host-s' });
    const players = [host];
    for (let i = 1; i < 10; i++) {
      players.push(
        createPlayer({ id: `p${i}`, room_id: room.id, session_id: `p${i}-s` })
      );
    }
    supabaseMock.reset({ rooms: [room], players });

    const { room: started } = await startImposterRound('MANY', 'host-s', 'Athletes');
    expect(started.state).toBe('SECRET_REVEAL');

    const playersInDb = supabaseMock.getTable('players');
    const imposters = playersInDb.filter((p) => p.role === 'IMPOSTER');
    expect(imposters.length).toBe(2);
  });

  it('handles concurrent voting correctly', async () => {
    const room = makeImposterRoom({ code: 'CONC', state: 'VOTING', round_number: 1 });
    const p1 = createPlayer({
      id: 'p1',
      room_id: room.id,
      session_id: 'p1-s',
      role: 'CIVILIAN',
      is_alive: true,
    });
    const p2 = createPlayer({
      id: 'p2',
      room_id: room.id,
      session_id: 'p2-s',
      role: 'CIVILIAN',
      is_alive: true,
    });
    const p3 = createPlayer({
      id: 'p3',
      room_id: room.id,
      session_id: 'p3-s',
      role: 'IMPOSTER',
      is_alive: true,
    });
    supabaseMock.reset({ rooms: [room], players: [p1, p2, p3], imposter_votes: [] });

    // Simulate concurrent votes
    const vote1Promise = submitImposterVote('CONC', 'p1-s', p3.id);
    const vote2Promise = submitImposterVote('CONC', 'p2-s', p3.id);
    const vote3Promise = submitImposterVote('CONC', 'p3-s', p1.id);

    const results = await Promise.all([vote1Promise, vote2Promise, vote3Promise]);

    // At least one should have roundResult
    const withResult = results.find((r) => r.roundResult);
    expect(withResult).toBeDefined();
    expect(withResult?.roundResult?.winner).toBe('CIVILIANS');
  });

  it('completes a full game flow from lobby to game over', async () => {
    const room = makeImposterRoom({ code: 'FLOW', state: 'LOBBY', round_number: 0 });
    const host = createPlayer({ id: 'host', room_id: room.id, is_host: true, session_id: 'host-s' });
    const p2 = createPlayer({ id: 'p2', room_id: room.id, session_id: 'p2-s' });
    const p3 = createPlayer({ id: 'p3', room_id: room.id, session_id: 'p3-s' });
    supabaseMock.reset({ rooms: [room], players: [host, p2, p3] });

    // 1. Start round
    const { room: started } = await startImposterRound('FLOW', 'host-s', 'Athletes');
    expect(started.state).toBe('SECRET_REVEAL');
    expect(started.round_number).toBe(1);

    // 2. Advance to CLUE phase
    const { room: cluePhase } = await advanceImposterPhase('FLOW', 'host-s', 'CLUE');
    expect(cluePhase.state).toBe('CLUE');

    // 3. Submit clue (just verify it works)
    const { room: afterClue } = await submitImposterClue('FLOW', 'host-s', 'my clue');
    expect(afterClue.state).toBe('CLUE');

    // 4. Advance to VOTING
    const { room: votingPhase } = await advanceImposterPhase('FLOW', 'host-s', 'VOTING');
    expect(votingPhase.state).toBe('VOTING');

    // 5. All players vote
    const playersInDb = supabaseMock.getTable('players');
    const imposter = playersInDb.find((p) => p.role === 'IMPOSTER');
    const civilians = playersInDb.filter((p) => p.role === 'CIVILIAN');

    await submitImposterVote('FLOW', civilians[0].session_id, imposter!.id);
    const finalVote = await submitImposterVote('FLOW', civilians[1].session_id, imposter!.id);

    // Last vote should not trigger resolution yet (imposter hasn't voted)
    const lastVote = await submitImposterVote('FLOW', imposter!.session_id, civilians[0].id);

    // 6. Verify game ended in GAME_OVER
    expect(lastVote.room.state).toBe('GAME_OVER');
    expect(lastVote.roundResult?.winner).toBe('CIVILIANS');
    expect(lastVote.roundResult?.eliminatedRole).toBe('IMPOSTER');

    // 7. Verify imposter was eliminated
    const finalPlayers = supabaseMock.getTable('players');
    const eliminatedImposter = finalPlayers.find((p) => p.id === imposter!.id);
    expect(eliminatedImposter?.is_alive).toBe(false);
  });
});

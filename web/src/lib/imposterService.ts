import { supabaseAdmin } from './supabaseServer';
import { broadcastToRoom, getPlayerBySession, createRoom, joinRoom } from './roomService';
import {
  GameType,
  ImposterClue,
  ImposterPhase,
  ImposterRoom,
  ImposterRoundResult,
  ImposterVote,
  Player,
} from '@/types';
import { IMPOSTER_TOPICS, getImposterCount, getRandomWord } from './imposter/constants';

const IMPOSTER_GAME: GameType = 'IMPOSTER';

function assertHost(player: Player | null) {
  if (!player || !player.is_host) {
    throw new Error('Only the host can perform this action');
  }
}

function normalizeTopic(topic: string): string {
  const entry = Object.keys(IMPOSTER_TOPICS).find((key) => key.toLowerCase() === topic.toLowerCase());
  if (!entry) {
    throw new Error('Invalid topic');
  }
  return entry;
}

async function assignImposterRoles(roomId: string, players: Player[]) {
  const impostersNeeded = getImposterCount(players.length);
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const imposterIds = shuffled.slice(0, impostersNeeded).map((p) => p.id);
  const civilianIds = shuffled.slice(impostersNeeded).map((p) => p.id);

  if (imposterIds.length) {
    await supabaseAdmin.from('players').update({ role: 'IMPOSTER' }).in('id', imposterIds);
  }
  if (civilianIds.length) {
    await supabaseAdmin.from('players').update({ role: 'CIVILIAN' }).in('id', civilianIds);
  }
}

async function getRoomByCode(code: string): Promise<ImposterRoom | null> {
  const { data } = await supabaseAdmin
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('game_type', IMPOSTER_GAME)
    .single();
  return (data as ImposterRoom) || null;
}

async function getPlayers(roomId: string): Promise<Player[]> {
  const { data } = await supabaseAdmin
    .from('players')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });
  return data || [];
}

async function getCluesForRound(roomId: string, roundNumber: number): Promise<ImposterClue[]> {
  const { data } = await supabaseAdmin
    .from('imposter_clues')
    .select('*')
    .eq('room_id', roomId)
    .eq('round_number', roundNumber)
    .order('created_at', { ascending: true });
  return (data as ImposterClue[]) || [];
}

async function getVotesForRound(roomId: string, roundNumber: number): Promise<ImposterVote[]> {
  const { data } = await supabaseAdmin
    .from('imposter_votes')
    .select('*')
    .eq('room_id', roomId)
    .eq('round_number', roundNumber);
  return (data as ImposterVote[]) || [];
}

export async function createImposterRoom(
  displayName: string,
  sessionId: string
): Promise<{ room: ImposterRoom; player: Player }> {
  const { room, player } = await createRoom(displayName, sessionId, IMPOSTER_GAME);
  return { room: room as ImposterRoom, player };
}

export async function joinImposterRoom(
  code: string,
  displayName: string,
  sessionId: string
): Promise<{ room: ImposterRoom; player: Player; players: Player[] }> {
  const { room, player, players } = await joinRoom(code, displayName, sessionId, IMPOSTER_GAME);
  if (room.game_type !== IMPOSTER_GAME) {
    throw new Error('This room is for a different game');
  }

  await broadcastToRoom(room.code, 'imposter_players_updated', { players });
  return { room: room as ImposterRoom, player, players };
}

export async function getImposterRoom(
  code: string
): Promise<{ room: ImposterRoom; players: Player[]; clues: ImposterClue[]; votes: ImposterVote[] }> {
  const room = await getRoomByCode(code);
  if (!room) {
    throw new Error('Room not found');
  }
  const [players, clues, votes] = await Promise.all([
    getPlayers(room.id),
    getCluesForRound(room.id, room.round_number),
    getVotesForRound(room.id, room.round_number),
  ]);

  return { room, players, clues, votes };
}

export async function startImposterRound(
  code: string,
  sessionId: string,
  topic: string
): Promise<{ room: ImposterRoom; players: Player[] }> {
  const room = await getRoomByCode(code);
  if (!room) throw new Error('Room not found');
  const host = await getPlayerBySession(room.id, sessionId);
  assertHost(host);

  if (room.state !== 'LOBBY' && room.state !== 'REVEAL') {
    throw new Error('Cannot start a new round right now');
  }

  const normalizedTopic = normalizeTopic(topic);
  const players = await getPlayers(room.id);

  if (players.length < 3) {
    throw new Error('Need at least 3 players to start');
  }

  // Assign roles fresh each round
  await assignImposterRoles(room.id, players);

  const secretWord = getRandomWord(normalizedTopic);
  const nextRound = room.state === 'LOBBY' ? 1 : room.round_number + 1;

  const { data: updatedRoom, error } = await supabaseAdmin
    .from('rooms')
    .update({
      topic: normalizedTopic,
      secret_word: secretWord,
      round_number: nextRound,
      state: 'SECRET_REVEAL' as ImposterPhase,
      game_type: IMPOSTER_GAME,
    })
    .eq('id', room.id)
    .select()
    .single();

  if (error || !updatedRoom) {
    throw new Error(`Failed to start round: ${error?.message}`);
  }

  const freshPlayers = await getPlayers(room.id);

  await broadcastToRoom(code, 'imposter_room_updated', { room: updatedRoom });
  await broadcastToRoom(code, 'imposter_players_updated', { players: freshPlayers });

  return { room: updatedRoom as ImposterRoom, players: freshPlayers };
}

export async function advanceImposterPhase(
  code: string,
  sessionId: string,
  to: ImposterPhase
): Promise<{ room: ImposterRoom }> {
  const room = await getRoomByCode(code);
  if (!room) throw new Error('Room not found');
  const host = await getPlayerBySession(room.id, sessionId);
  assertHost(host);

  const validTransitions: Record<ImposterPhase, ImposterPhase[]> = {
    LOBBY: ['SECRET_REVEAL'],
    SECRET_REVEAL: ['CLUE', 'VOTING'],
    CLUE: ['VOTING'],
    VOTING: ['REVEAL'],
    REVEAL: ['SECRET_REVEAL'],
    GAME_OVER: [],
  };

  const allowed = validTransitions[room.state as ImposterPhase] || [];
  if (!allowed.includes(to)) {
    throw new Error('Invalid phase transition');
  }

  const { data: updatedRoom, error } = await supabaseAdmin
    .from('rooms')
    .update({ state: to })
    .eq('id', room.id)
    .select()
    .single();

  if (error || !updatedRoom) {
    throw new Error(`Failed to advance phase: ${error?.message}`);
  }

  await broadcastToRoom(code, 'imposter_room_updated', { room: updatedRoom });
  return { room: updatedRoom as ImposterRoom };
}

export async function submitImposterClue(
  code: string,
  sessionId: string,
  text: string
): Promise<{ room: ImposterRoom; clues: ImposterClue[] }> {
  const room = await getRoomByCode(code);
  if (!room) throw new Error('Room not found');
  if (room.state !== 'CLUE') {
    throw new Error('Not accepting clues right now');
  }
  // Clues are handled offline; keep endpoint for compatibility
  return { room, clues: [] };
}

export async function startImposterVoting(
  code: string,
  sessionId: string
): Promise<{ room: ImposterRoom }> {
  const room = await getRoomByCode(code);
  if (!room) throw new Error('Room not found');
  const host = await getPlayerBySession(room.id, sessionId);
  assertHost(host);

  if (room.state !== 'SECRET_REVEAL') {
    throw new Error('Not ready to vote');
  }

  const { data: updatedRoom, error } = await supabaseAdmin
    .from('rooms')
    .update({ state: 'VOTING' })
    .eq('id', room.id)
    .select()
    .single();

  if (error || !updatedRoom) {
    throw new Error(`Failed to start voting: ${error?.message}`);
  }

  await broadcastToRoom(code, 'imposter_room_updated', { room: updatedRoom });
  return { room: updatedRoom as ImposterRoom };
}

export async function submitImposterVote(
  code: string,
  sessionId: string,
  targetId: string
): Promise<{ room: ImposterRoom; votes: ImposterVote[]; roundResult?: ImposterRoundResult }> {
  const room = await getRoomByCode(code);
  if (!room) throw new Error('Room not found');
  if (room.state !== 'VOTING') {
    throw new Error('Not voting right now');
  }

  const voter = await getPlayerBySession(room.id, sessionId);
  if (!voter) {
    throw new Error('Player not found');
  }
  if (voter.id === targetId) {
    throw new Error('Cannot vote for yourself');
  }

  // Upsert vote
  const { data: existing } = await supabaseAdmin
    .from('imposter_votes')
    .select('id')
    .eq('room_id', room.id)
    .eq('round_number', room.round_number)
    .eq('voter_id', voter.id)
    .single();

  if (existing) {
    await supabaseAdmin
      .from('imposter_votes')
      .update({ target_id: targetId })
      .eq('id', existing.id);
  } else {
    await supabaseAdmin
      .from('imposter_votes')
      .insert({
        room_id: room.id,
        round_number: room.round_number,
        voter_id: voter.id,
        target_id: targetId,
      });
  }

  const votes = await getVotesForRound(room.id, room.round_number);
  await broadcastToRoom(code, 'imposter_votes_updated', { votes });

  const players = await getPlayers(room.id);
  let roundResult: (ImposterRoundResult & { room: ImposterRoom }) | undefined;

  if (votes.length >= players.length) {
    roundResult = await resolveImposterRound(room, players, votes, code);
  }

  return {
    room: roundResult?.room || room,
    votes,
    roundResult,
  };
}

async function resolveImposterRound(
  room: ImposterRoom,
  players: Player[],
  votes: ImposterVote[],
  code: string
): Promise<ImposterRoundResult & { room: ImposterRoom; players: Player[] }> {
  const imposters = players.filter((p) => p.role === 'IMPOSTER');
  const imposterIds = imposters.map((p) => p.id);
  const correctVoterIds = votes.filter((v) => imposterIds.includes(v.target_id)).map((v) => v.voter_id);
  const incorrectVoterIds = votes
    .filter((v) => !imposterIds.includes(v.target_id))
    .map((v) => v.voter_id);

  // Count votes for each player
  const voteCounts = new Map<string, number>();
  for (const vote of votes) {
    voteCounts.set(vote.target_id, (voteCounts.get(vote.target_id) || 0) + 1);
  }

  // Find player with most votes
  let maxVotes = 0;
  let eliminatedPlayerId: string | null = null;
  for (const [playerId, count] of voteCounts.entries()) {
    if (count > maxVotes) {
      maxVotes = count;
      eliminatedPlayerId = playerId;
    }
  }

  // Mark eliminated player as dead
  if (eliminatedPlayerId) {
    await supabaseAdmin
      .from('players')
      .update({ is_alive: false })
      .eq('id', eliminatedPlayerId);
  }

  for (const voterId of correctVoterIds) {
    await incrementScore(voterId, 1);
  }
  if (incorrectVoterIds.length) {
    for (const imposterId of imposterIds) {
      await incrementScore(imposterId, incorrectVoterIds.length);
    }
  }

  const updatedPlayers = await getPlayers(room.id);

  // Determine winner and eliminated role
  const eliminatedPlayer = updatedPlayers.find((p) => p.id === eliminatedPlayerId);
  const eliminatedRole = eliminatedPlayer?.role;
  const winner = eliminatedRole === 'IMPOSTER' ? 'CIVILIANS' : eliminatedRole === 'CIVILIAN' ? 'IMPOSTERS' : undefined;

  const result: ImposterRoundResult = {
    imposterIds,
    correctVoterIds,
    incorrectVoterIds,
    votes,
    winner,
    eliminatedRole,
  };

  const { data: updatedRoom, error } = await supabaseAdmin
    .from('rooms')
    .update({ state: 'GAME_OVER' })
    .eq('id', room.id)
    .select()
    .single();

  if (error || !updatedRoom) {
    throw new Error(`Failed to finalize round: ${error?.message}`);
  }

  await broadcastToRoom(code, 'imposter_room_updated', { room: updatedRoom });
  await broadcastToRoom(code, 'imposter_players_updated', { players: updatedPlayers });
  await broadcastToRoom(code, 'imposter_round_result', { result });

  return { ...result, room: updatedRoom as ImposterRoom, players: updatedPlayers };
}

export function summarizeImposterRound(
  room: ImposterRoom,
  players: Player[],
  votes: ImposterVote[]
): ImposterRoundResult {
  const imposters = players.filter((p) => p.role === 'IMPOSTER');
  const imposterIds = imposters.map((p) => p.id);
  const correctVoterIds = votes.filter((v) => imposterIds.includes(v.target_id)).map((v) => v.voter_id);
  const incorrectVoterIds = votes
    .filter((v) => !imposterIds.includes(v.target_id))
    .map((v) => v.voter_id);

  // Determine who was eliminated based on is_alive status
  const eliminatedPlayer = players.find((p) => p.is_alive === false);
  const eliminatedRole = eliminatedPlayer?.role;
  const winner = eliminatedRole === 'IMPOSTER' ? 'CIVILIANS' : eliminatedRole === 'CIVILIAN' ? 'IMPOSTERS' : undefined;

  return {
    imposterIds,
    correctVoterIds,
    incorrectVoterIds,
    votes,
    winner,
    eliminatedRole,
  };
}

async function incrementScore(playerId: string, scoreIncrement: number) {
  const { data: player } = await supabaseAdmin
    .from('players')
    .select('score')
    .eq('id', playerId)
    .single();

  if (player) {
    await supabaseAdmin
      .from('players')
      .update({ score: (player.score || 0) + scoreIncrement })
      .eq('id', playerId);
  }
}

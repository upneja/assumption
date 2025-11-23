import { supabaseAdmin } from './supabaseServer';
import { generateRoomCode, assignPlayersRandomly } from './gameEngine';
import type { Room, Player, Assignment, GamePhase, Vote, GameType } from '@/types';

// Create a new room with a host player
export async function createRoom(
  displayName: string,
  sessionId: string,
  gameType: GameType = 'ASSUMPTIONS'
): Promise<{ room: Room; player: Player }> {
  // Generate a unique room code
  let code = generateRoomCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const { data: existing } = await supabaseAdmin
      .from('rooms')
      .select('id')
      .eq('code', code)
      .single();

    if (!existing) break;
    code = generateRoomCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique room code');
  }

  // Create the room first (without host_player_id)
  const { data: room, error: roomError } = await supabaseAdmin
    .from('rooms')
    .insert({
      code,
      state: 'LOBBY' as GamePhase,
      game_type: gameType,
      round_number: 1,
    })
    .select()
    .single();

  if (roomError || !room) {
    throw new Error(`Failed to create room: ${roomError?.message}`);
  }

  // Create the host player
  const { data: player, error: playerError } = await supabaseAdmin
    .from('players')
    .insert({
      room_id: room.id,
      display_name: displayName,
      is_host: true,
      session_id: sessionId,
    })
    .select()
    .single();

  if (playerError || !player) {
    // Rollback room creation
    await supabaseAdmin.from('rooms').delete().eq('id', room.id);
    throw new Error(`Failed to create player: ${playerError?.message}`);
  }

  // Update room with host_player_id
  const { data: updatedRoom, error: updateError } = await supabaseAdmin
    .from('rooms')
    .update({ host_player_id: player.id })
    .eq('id', room.id)
    .select()
    .single();

  if (updateError || !updatedRoom) {
    throw new Error(`Failed to set host: ${updateError?.message}`);
  }

  return { room: updatedRoom, player };
}

// Join an existing room
export async function joinRoom(
  code: string,
  displayName: string,
  sessionId: string,
  gameType?: GameType
): Promise<{ room: Room; player: Player; players: Player[] }> {
  // Find the room
  const { data: room, error: roomError } = await supabaseAdmin
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (roomError || !room) {
    throw new Error('Room not found');
  }

  if (gameType && room.game_type && room.game_type !== gameType) {
    throw new Error('This room is for a different game');
  }

  if (room.state !== 'LOBBY') {
    throw new Error('Game has already started');
  }

  // Check if player already exists in this room with this session
  const { data: existingPlayer } = await supabaseAdmin
    .from('players')
    .select('*')
    .eq('room_id', room.id)
    .eq('session_id', sessionId)
    .single();

  let player: Player;

  if (existingPlayer) {
    // Update existing player's display name and last_seen
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('players')
      .update({
        display_name: displayName,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', existingPlayer.id)
      .select()
      .single();

    if (updateError || !updated) {
      throw new Error(`Failed to update player: ${updateError?.message}`);
    }
    player = updated;
  } else {
    // Create new player
    const { data: newPlayer, error: playerError } = await supabaseAdmin
      .from('players')
      .insert({
        room_id: room.id,
        display_name: displayName,
        is_host: false,
        session_id: sessionId,
      })
      .select()
      .single();

    if (playerError || !newPlayer) {
      throw new Error(`Failed to join room: ${playerError?.message}`);
    }
    player = newPlayer;
  }

  // Get all players in the room
  const { data: players, error: playersError } = await supabaseAdmin
    .from('players')
    .select('*')
    .eq('room_id', room.id)
    .order('joined_at', { ascending: true });

  if (playersError) {
    throw new Error(`Failed to get players: ${playersError.message}`);
  }

  return { room, player, players: players || [] };
}

// Get room by code with all players and assignments
export async function getRoom(code: string): Promise<{
  room: Room;
  players: Player[];
  assignments: Assignment[];
} | null> {
  const { data: room, error: roomError } = await supabaseAdmin
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (roomError || !room) {
    return null;
  }

  const { data: players } = await supabaseAdmin
    .from('players')
    .select('*')
    .eq('room_id', room.id)
    .order('joined_at', { ascending: true });

  const { data: assignments } = await supabaseAdmin
    .from('assignments')
    .select('*')
    .eq('room_id', room.id)
    .eq('round_number', room.round_number);

  return {
    room,
    players: players || [],
    assignments: assignments || [],
  };
}

// Get player by session ID and room ID
export async function getPlayerBySession(
  roomId: string,
  sessionId: string
): Promise<Player | null> {
  const { data } = await supabaseAdmin
    .from('players')
    .select('*')
    .eq('room_id', roomId)
    .eq('session_id', sessionId)
    .single();

  return data || null;
}

// Update room state
export async function updateRoomState(
  roomId: string,
  updates: Partial<Room>
): Promise<Room> {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .update(updates)
    .eq('id', roomId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update room: ${error?.message}`);
  }

  return data;
}

// Create assignments for the current round
export async function createAssignments(room: Room, players: Player[]): Promise<Assignment[]> {
  const assignments = assignPlayersRandomly(players, room.id, room.round_number);

  const { data, error } = await supabaseAdmin
    .from('assignments')
    .insert(assignments)
    .select();

  if (error) {
    throw new Error(`Failed to create assignments: ${error.message}`);
  }

  return data || [];
}

// Set the hotseat player
export async function setHotseat(roomId: string, playerId: string): Promise<Room> {
  return updateRoomState(roomId, { hotseat_player_id: playerId });
}

// Broadcast a realtime event to the room channel
export async function broadcastToRoom(
  roomCode: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const channel = supabaseAdmin.channel(`room:${roomCode}`);

  await channel.send({
    type: 'broadcast',
    event,
    payload,
  });

  await supabaseAdmin.removeChannel(channel);
}

// Submit a vote
export async function submitVote(
  roomId: string,
  hotseatPlayerId: string,
  guesserPlayerId: string,
  guessedTargetId: string,
  roundNumber: number
): Promise<Vote> {
  // Check if already voted
  const { data: existing } = await supabaseAdmin
    .from('votes')
    .select('*')
    .eq('room_id', roomId)
    .eq('hotseat_player_id', hotseatPlayerId)
    .eq('guesser_player_id', guesserPlayerId)
    .eq('round_number', roundNumber)
    .single();

  if (existing) {
    throw new Error('Already voted');
  }

  const { data, error } = await supabaseAdmin
    .from('votes')
    .insert({
      room_id: roomId,
      hotseat_player_id: hotseatPlayerId,
      guesser_player_id: guesserPlayerId,
      guessed_target_id: guessedTargetId,
      round_number: roundNumber,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to submit vote: ${error?.message}`);
  }

  return data;
}

// Get all votes for a hotseat round
export async function getVotesForHotseat(
  roomId: string,
  hotseatPlayerId: string,
  roundNumber: number
): Promise<Vote[]> {
  const { data, error } = await supabaseAdmin
    .from('votes')
    .select('*')
    .eq('room_id', roomId)
    .eq('hotseat_player_id', hotseatPlayerId)
    .eq('round_number', roundNumber);

  if (error) {
    throw new Error(`Failed to get votes: ${error.message}`);
  }

  return data || [];
}

// Check if a player has voted
export async function hasPlayerVoted(
  roomId: string,
  hotseatPlayerId: string,
  guesserPlayerId: string,
  roundNumber: number
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('votes')
    .select('id')
    .eq('room_id', roomId)
    .eq('hotseat_player_id', hotseatPlayerId)
    .eq('guesser_player_id', guesserPlayerId)
    .eq('round_number', roundNumber)
    .single();

  return !!data;
}

// Calculate and award points for correct votes
export async function calculateAndAwardPoints(
  roomId: string,
  hotseatPlayerId: string,
  actualTargetId: string,
  roundNumber: number
): Promise<{ correctVoterIds: string[]; incorrectVoterIds: string[] }> {
  // Get all votes for this hotseat round
  const votes = await getVotesForHotseat(roomId, hotseatPlayerId, roundNumber);

  const correctVoterIds: string[] = [];
  const incorrectVoterIds: string[] = [];

  // Update each vote with is_correct and track correct/incorrect
  for (const vote of votes) {
    const isCorrect = vote.guessed_target_id === actualTargetId;

    if (isCorrect) {
      correctVoterIds.push(vote.guesser_player_id);
    } else {
      incorrectVoterIds.push(vote.guesser_player_id);
    }

    // Update vote record
    await supabaseAdmin
      .from('votes')
      .update({ is_correct: isCorrect })
      .eq('id', vote.id);
  }

  // Award points to correct voters (1 point each)
  for (const playerId of correctVoterIds) {
    await updatePlayerScore(playerId, 1);
  }

  return { correctVoterIds, incorrectVoterIds };
}

// Update player score
export async function updatePlayerScore(
  playerId: string,
  scoreIncrement: number
): Promise<void> {
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

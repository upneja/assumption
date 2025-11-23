import { NextRequest, NextResponse } from 'next/server';
import {
  getRoom,
  getPlayerBySession,
  updateRoomState,
  broadcastToRoom,
  calculateAndAwardPoints,
  getVotesForHotseat,
} from '@/lib/roomService';
import { getNextPhase } from '@/lib/gameEngine';
import type { AdvancePhaseRequest, ApiError, GameEvent } from '@/types';

// POST /api/rooms/[code]/next - Advance to next phase (host only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = (await request.json()) as AdvancePhaseRequest;
    const { sessionId } = body;

    if (!code) {
      return NextResponse.json<ApiError>(
        { error: 'Room code is required' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json<ApiError>(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get room state
    const roomData = await getRoom(code);
    if (!roomData) {
      return NextResponse.json<ApiError>(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const { room, players, assignments } = roomData;

    // Verify player is host
    const player = await getPlayerBySession(room.id, sessionId);
    if (!player || !player.is_host) {
      return NextResponse.json<ApiError>(
        { error: 'Only the host can advance the game' },
        { status: 403 }
      );
    }

    // Determine the event based on current state
    let event: GameEvent;
    let voteResults = null;

    switch (room.state) {
      case 'INTRO':
        event = { type: 'INTRO_COMPLETE' };
        break;
      case 'HOTSEAT':
        event = { type: 'HOTSEAT_COMPLETE' };
        break;
      case 'VOTING':
        event = { type: 'VOTING_COMPLETE' };
        // Calculate scores when moving from VOTING to REVEAL
        if (room.hotseat_player_id) {
          // Find the hotseat player's actual target
          const hotseatAssignment = assignments.find(
            (a) => a.giver_player_id === room.hotseat_player_id
          );
          if (hotseatAssignment) {
            const { correctVoterIds, incorrectVoterIds } = await calculateAndAwardPoints(
              room.id,
              room.hotseat_player_id,
              hotseatAssignment.target_player_id,
              room.round_number
            );
            // Get votes for response
            const votes = await getVotesForHotseat(
              room.id,
              room.hotseat_player_id,
              room.round_number
            );
            voteResults = {
              votes,
              correctVoterIds,
              incorrectVoterIds,
              actualTargetId: hotseatAssignment.target_player_id,
            };
          }
        }
        break;
      case 'REVEAL':
        event = { type: 'REVEAL_COMPLETE' };
        break;
      case 'SCOREBOARD':
        // Check if all players have been in hotseat
        const hotseatHistory = room.hotseat_history || [];
        const allPlayersHadTurn = hotseatHistory.length >= players.length;
        event = allPlayersHadTurn ? { type: 'END_GAME' } : { type: 'CONTINUE_GAME' };
        break;
      default:
        return NextResponse.json<ApiError>(
          { error: `Cannot advance from ${room.state} state` },
          { status: 400 }
        );
    }

    // Get next phase
    const nextPhase = getNextPhase(room.state, event);
    if (!nextPhase) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid state transition' },
        { status: 400 }
      );
    }

    // Update room state
    const updatedRoom = await updateRoomState(room.id, {
      state: nextPhase,
      // Clear hotseat when moving to wheel (but keep history)
      ...(nextPhase === 'WHEEL' ? { hotseat_player_id: null } : {}),
    });

    // Refetch players to get updated scores
    const updatedRoomData = await getRoom(code);
    const updatedPlayers = updatedRoomData?.players || players;

    // Broadcast update
    await broadcastToRoom(code, 'room_updated', { room: updatedRoom });
    await broadcastToRoom(code, 'players_updated', { players: updatedPlayers });

    return NextResponse.json({
      room: updatedRoom,
      players: updatedPlayers,
      voteResults,
    });
  } catch (error) {
    console.error('Error advancing game:', error);
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : 'Failed to advance game' },
      { status: 500 }
    );
  }
}

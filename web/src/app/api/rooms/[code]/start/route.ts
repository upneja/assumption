import { NextRequest, NextResponse } from 'next/server';
import {
  getRoom,
  getPlayerBySession,
  updateRoomState,
  createAssignments,
  broadcastToRoom,
} from '@/lib/roomService';
import { canStartGame, getNextPhase } from '@/lib/gameEngine';
import type { StartGameRequest, ApiError, Room } from '@/types';

// POST /api/rooms/[code]/start - Start the game (host only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = (await request.json()) as StartGameRequest;
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

    const { room, players } = roomData;

    // Verify player is host
    const player = await getPlayerBySession(room.id, sessionId);
    if (!player || !player.is_host) {
      return NextResponse.json<ApiError>(
        { error: 'Only the host can start the game' },
        { status: 403 }
      );
    }

    // Check if game can start
    const { canStart, reason } = canStartGame(players);
    if (!canStart) {
      return NextResponse.json<ApiError>(
        { error: reason || 'Cannot start game' },
        { status: 400 }
      );
    }

    // Verify we're in LOBBY state
    if (room.state !== 'LOBBY') {
      return NextResponse.json<ApiError>(
        { error: 'Game has already started' },
        { status: 400 }
      );
    }

    // Transition to ASSIGNMENT
    const nextPhase = getNextPhase(room.state, { type: 'START_GAME' });
    if (!nextPhase) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid state transition' },
        { status: 400 }
      );
    }

    let updatedRoom: Room = await updateRoomState(room.id, { state: nextPhase });

    // Create assignments
    const assignments = await createAssignments(updatedRoom, players);

    // Transition to INTRO
    const introPhase = getNextPhase(nextPhase, { type: 'ASSIGNMENTS_CREATED' });
    if (introPhase) {
      updatedRoom = await updateRoomState(room.id, { state: introPhase });
    }

    // Broadcast updates
    await broadcastToRoom(code, 'room_updated', { room: updatedRoom });
    await broadcastToRoom(code, 'assignments_updated', { assignments });

    return NextResponse.json({ room: updatedRoom, assignments });
  } catch (error) {
    console.error('Error starting game:', error);
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : 'Failed to start game' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import {
  getRoom,
  getPlayerBySession,
  updateRoomState,
  broadcastToRoom,
} from '@/lib/roomService';
import { selectHotseat, getNextPhase } from '@/lib/gameEngine';
import type { SpinWheelRequest, ApiError } from '@/types';

// POST /api/rooms/[code]/spin - Spin the wheel to select hotseat (host only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = (await request.json()) as SpinWheelRequest;
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
        { error: 'Only the host can spin the wheel' },
        { status: 403 }
      );
    }

    // Verify we're in WHEEL state
    if (room.state !== 'WHEEL') {
      return NextResponse.json<ApiError>(
        { error: 'Can only spin wheel during WHEEL phase' },
        { status: 400 }
      );
    }

    // Get hotseat history (players already chosen)
    const hotseatHistory = room.hotseat_history || [];

    // Select a random player for hotseat, excluding those already chosen
    const hotseatPlayer = selectHotseat(players, hotseatHistory);
    if (!hotseatPlayer) {
      return NextResponse.json<ApiError>(
        { error: 'No eligible players for hotseat' },
        { status: 400 }
      );
    }

    // Update history with new hotseat player
    const newHistory = [...hotseatHistory, hotseatPlayer.id];

    // Broadcast spin event so all clients can animate with the same result
    await broadcastToRoom(code, 'wheel_spin', {
      hotseatPlayerId: hotseatPlayer.id,
      previousHistory: hotseatHistory,
    });

    // Transition to HOTSEAT
    const nextPhase = getNextPhase(room.state, {
      type: 'WHEEL_SPUN',
      hotseatPlayerId: hotseatPlayer.id,
    });

    if (!nextPhase) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid state transition' },
        { status: 400 }
      );
    }

    const updatedRoom = await updateRoomState(room.id, {
      state: nextPhase,
      hotseat_player_id: hotseatPlayer.id,
      hotseat_history: newHistory,
    });

    // Broadcast update
    await broadcastToRoom(code, 'room_updated', { room: updatedRoom });

    return NextResponse.json({
      room: updatedRoom,
      hotseatPlayer,
    });
  } catch (error) {
    console.error('Error spinning wheel:', error);
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : 'Failed to spin wheel' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { joinRoom, broadcastToRoom } from '@/lib/roomService';
import type { JoinRoomRequest, JoinRoomResponse, ApiError } from '@/types';

// POST /api/rooms/[code]/join - Join a room
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = (await request.json()) as JoinRoomRequest;
    const { displayName, sessionId } = body;

    if (!code) {
      return NextResponse.json<ApiError>(
        { error: 'Room code is required' },
        { status: 400 }
      );
    }

    if (!displayName || typeof displayName !== 'string') {
      return NextResponse.json<ApiError>(
        { error: 'Display name is required' },
        { status: 400 }
      );
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json<ApiError>(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const trimmedName = displayName.trim();
    if (trimmedName.length < 1 || trimmedName.length > 20) {
      return NextResponse.json<ApiError>(
        { error: 'Display name must be 1-20 characters' },
        { status: 400 }
      );
    }

    const { room, player, players } = await joinRoom(code, trimmedName, sessionId);

    // Broadcast player update to room
    await broadcastToRoom(room.code, 'players_updated', { players });

    return NextResponse.json<JoinRoomResponse>({ room, player, players });
  } catch (error) {
    console.error('Error joining room:', error);
    const message = error instanceof Error ? error.message : 'Failed to join room';
    const status = message === 'Room not found' ? 404 :
                   message === 'Game has already started' ? 400 : 500;

    return NextResponse.json<ApiError>({ error: message }, { status });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createRoom } from '@/lib/roomService';
import type { CreateRoomRequest, CreateRoomResponse, ApiError } from '@/types';

// POST /api/rooms - Create a new room
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateRoomRequest;
    const { displayName, sessionId } = body;

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

    const { room, player } = await createRoom(trimmedName, sessionId);

    return NextResponse.json<CreateRoomResponse>({ room, player });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : 'Failed to create room' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createImposterRoom } from '@/lib/imposterService';
import type { ApiError, CreateRoomResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { displayName, sessionId } = body as { displayName?: string; sessionId?: string };

    if (!displayName || typeof displayName !== 'string') {
      return NextResponse.json<ApiError>({ error: 'Display name is required' }, { status: 400 });
    }
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json<ApiError>({ error: 'Session ID is required' }, { status: 400 });
    }

    const trimmedName = displayName.trim();
    if (trimmedName.length < 1 || trimmedName.length > 20) {
      return NextResponse.json<ApiError>(
        { error: 'Display name must be 1-20 characters' },
        { status: 400 }
      );
    }

    const { room, player } = await createImposterRoom(trimmedName, sessionId);

    return NextResponse.json<CreateRoomResponse>({ room, player });
  } catch (error) {
    console.error('Error creating imposter room:', error);
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : 'Failed to create room' },
      { status: 500 }
    );
  }
}

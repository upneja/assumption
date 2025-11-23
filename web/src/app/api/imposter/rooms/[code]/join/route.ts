import { NextRequest, NextResponse } from 'next/server';
import { joinImposterRoom } from '@/lib/imposterService';
import type { ApiError, JoinRoomResponse } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { displayName, sessionId } = body as { displayName?: string; sessionId?: string };

    if (!code) {
      return NextResponse.json<ApiError>({ error: 'Room code is required' }, { status: 400 });
    }
    if (!displayName) {
      return NextResponse.json<ApiError>({ error: 'Display name is required' }, { status: 400 });
    }
    if (!sessionId) {
      return NextResponse.json<ApiError>({ error: 'Session ID is required' }, { status: 400 });
    }

    const { room, player, players } = await joinImposterRoom(
      code,
      displayName.trim(),
      sessionId
    );

    return NextResponse.json<JoinRoomResponse>({ room, player, players });
  } catch (error) {
    console.error('Error joining imposter room:', error);
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : 'Failed to join room' },
      { status: 500 }
    );
  }
}

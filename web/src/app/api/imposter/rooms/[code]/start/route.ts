import { NextRequest, NextResponse } from 'next/server';
import { startImposterRound } from '@/lib/imposterService';
import type { ApiError } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { sessionId, topic } = body as { sessionId?: string; topic?: string };

    if (!code) {
      return NextResponse.json<ApiError>({ error: 'Room code is required' }, { status: 400 });
    }
    if (!sessionId) {
      return NextResponse.json<ApiError>({ error: 'Session ID is required' }, { status: 400 });
    }
    if (!topic) {
      return NextResponse.json<ApiError>({ error: 'Topic is required' }, { status: 400 });
    }

    const { room, players } = await startImposterRound(code, sessionId, topic);

    return NextResponse.json({ room, players });
  } catch (error) {
    console.error('Error starting imposter round:', error);
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : 'Failed to start round' },
      { status: 500 }
    );
  }
}

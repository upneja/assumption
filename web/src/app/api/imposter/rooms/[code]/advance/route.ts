import { NextRequest, NextResponse } from 'next/server';
import { advanceImposterPhase } from '@/lib/imposterService';
import type { ApiError, ImposterPhase } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { sessionId, to } = body as { sessionId?: string; to?: ImposterPhase };

    if (!code) {
      return NextResponse.json<ApiError>({ error: 'Room code is required' }, { status: 400 });
    }
    if (!sessionId) {
      return NextResponse.json<ApiError>({ error: 'Session ID is required' }, { status: 400 });
    }
    if (!to) {
      return NextResponse.json<ApiError>({ error: 'Target phase is required' }, { status: 400 });
    }

    const { room } = await advanceImposterPhase(code, sessionId, to);
    return NextResponse.json({ room });
  } catch (error) {
    console.error('Error advancing imposter phase:', error);
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : 'Failed to advance phase' },
      { status: 500 }
    );
  }
}

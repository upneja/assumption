import { NextRequest, NextResponse } from 'next/server';
import { submitImposterVote } from '@/lib/imposterService';
import type { ApiError } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { sessionId, targetId } = body as { sessionId?: string; targetId?: string };

    if (!code) {
      return NextResponse.json<ApiError>({ error: 'Room code is required' }, { status: 400 });
    }
    if (!sessionId) {
      return NextResponse.json<ApiError>({ error: 'Session ID is required' }, { status: 400 });
    }
    if (!targetId) {
      return NextResponse.json<ApiError>({ error: 'Target is required' }, { status: 400 });
    }

    const { room, votes, roundResult } = await submitImposterVote(code, sessionId, targetId);
    return NextResponse.json({ room, votes, roundResult });
  } catch (error) {
    console.error('Error submitting imposter vote:', error);
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : 'Failed to submit vote' },
      { status: 500 }
    );
  }
}

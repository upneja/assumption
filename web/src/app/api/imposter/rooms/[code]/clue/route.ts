import { NextRequest, NextResponse } from 'next/server';
import { submitImposterClue } from '@/lib/imposterService';
import type { ApiError } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { sessionId, text } = body as { sessionId?: string; text?: string };

    if (!code) {
      return NextResponse.json<ApiError>({ error: 'Room code is required' }, { status: 400 });
    }
    if (!sessionId) {
      return NextResponse.json<ApiError>({ error: 'Session ID is required' }, { status: 400 });
    }
    if (!text || !text.trim()) {
      return NextResponse.json<ApiError>({ error: 'Clue text is required' }, { status: 400 });
    }

    const { room, clues } = await submitImposterClue(code, sessionId, text.trim());
    return NextResponse.json({ room, clues });
  } catch (error) {
    console.error('Error submitting clue:', error);
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : 'Failed to submit clue' },
      { status: 500 }
    );
  }
}

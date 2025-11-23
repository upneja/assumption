import { NextRequest, NextResponse } from 'next/server';
import { getImposterRoom, summarizeImposterRound } from '@/lib/imposterService';
import type { ApiError, ImposterRoundResult } from '@/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json<ApiError>({ error: 'Room code is required' }, { status: 400 });
    }

    const { room, players, clues, votes } = await getImposterRoom(code);
    let roundResult: ImposterRoundResult | null = null;
    if (room.state === 'REVEAL') {
      roundResult = summarizeImposterRound(room, players, votes);
    }

    return NextResponse.json({ room, players, clues, votes, roundResult });
  } catch (error) {
    console.error('Error fetching imposter room:', error);
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : 'Failed to get room' },
      { status: 500 }
    );
  }
}

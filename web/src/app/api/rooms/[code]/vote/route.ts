import { NextRequest, NextResponse } from 'next/server';
import {
  getRoom,
  getPlayerBySession,
  submitVote,
  broadcastToRoom,
} from '@/lib/roomService';
import type { VoteRequest, ApiError } from '@/types';

// POST /api/rooms/[code]/vote - Submit a vote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = (await request.json()) as VoteRequest;
    const { sessionId, guessedTargetId } = body;

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

    if (!guessedTargetId) {
      return NextResponse.json<ApiError>(
        { error: 'Guessed target ID is required' },
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

    const { room } = roomData;

    // Verify we're in VOTING state
    if (room.state !== 'VOTING') {
      return NextResponse.json<ApiError>(
        { error: 'Can only vote during VOTING phase' },
        { status: 400 }
      );
    }

    // Get the voting player
    const player = await getPlayerBySession(room.id, sessionId);
    if (!player) {
      return NextResponse.json<ApiError>(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Can't vote if you're the hotseat player
    if (player.id === room.hotseat_player_id) {
      return NextResponse.json<ApiError>(
        { error: 'Hotseat player cannot vote' },
        { status: 400 }
      );
    }

    // Submit the vote
    const vote = await submitVote(
      room.id,
      room.hotseat_player_id!,
      player.id,
      guessedTargetId,
      room.round_number
    );

    // Broadcast vote update
    await broadcastToRoom(code, 'vote_submitted', { playerId: player.id });

    return NextResponse.json({ vote });
  } catch (error) {
    console.error('Error submitting vote:', error);
    const message = error instanceof Error ? error.message : 'Failed to submit vote';
    const status = message === 'Already voted' ? 400 : 500;
    return NextResponse.json<ApiError>({ error: message }, { status });
  }
}

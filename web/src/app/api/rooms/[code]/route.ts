import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/roomService';
import type { RoomStateResponse, ApiError } from '@/types';

// GET /api/rooms/[code] - Get room state
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json<ApiError>(
        { error: 'Room code is required' },
        { status: 400 }
      );
    }

    const result = await getRoom(code);

    if (!result) {
      return NextResponse.json<ApiError>(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<RoomStateResponse>(result);
  } catch (error) {
    console.error('Error getting room:', error);
    return NextResponse.json<ApiError>(
      { error: error instanceof Error ? error.message : 'Failed to get room' },
      { status: 500 }
    );
  }
}

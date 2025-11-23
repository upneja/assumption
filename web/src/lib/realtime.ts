'use client';

import { supabase } from './supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  Room,
  Player,
  Assignment,
  ImposterClue,
  ImposterVote,
  ImposterRoundResult,
} from '@/types';

export interface RealtimeCallbacks {
  onRoomUpdate?: (room: Room) => void;
  onPlayersUpdate?: (players: Player[]) => void;
  onAssignmentsUpdate?: (assignments: Assignment[]) => void;
  onWheelSpin?: (payload: { hotseatPlayerId: string; previousHistory: string[] }) => void;
  onError?: (error: Error) => void;
}

let channel: RealtimeChannel | null = null;

// Subscribe to room updates
export function subscribeToRoom(
  roomCode: string,
  callbacks: RealtimeCallbacks
): () => void {
  // Unsubscribe from any existing channel
  if (channel) {
    supabase.removeChannel(channel);
  }

  channel = supabase.channel(`room:${roomCode}`, {
    config: {
      broadcast: { self: true },
    },
  });

  // Listen for broadcast events
  channel
    .on('broadcast', { event: 'room_updated' }, ({ payload }) => {
      if (payload?.room) {
        callbacks.onRoomUpdate?.(payload.room as Room);
      }
    })
    .on('broadcast', { event: 'players_updated' }, ({ payload }) => {
      if (payload?.players) {
        callbacks.onPlayersUpdate?.(payload.players as Player[]);
      }
    })
    .on('broadcast', { event: 'assignments_updated' }, ({ payload }) => {
      if (payload?.assignments) {
        callbacks.onAssignmentsUpdate?.(payload.assignments as Assignment[]);
      }
    })
    .on('broadcast', { event: 'wheel_spin' }, ({ payload }) => {
      if (payload?.hotseatPlayerId) {
        callbacks.onWheelSpin?.({
          hotseatPlayerId: payload.hotseatPlayerId as string,
          previousHistory: (payload.previousHistory as string[]) || [],
        });
      }
    })
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        callbacks.onError?.(new Error('Failed to connect to realtime channel'));
      }
    });

  // Return unsubscribe function
  return () => {
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
  };
}

// Unsubscribe from current room
export function unsubscribeFromRoom(): void {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
}

export interface ImposterRealtimeCallbacks {
  onRoomUpdate?: (room: Room) => void;
  onPlayersUpdate?: (players: Player[]) => void;
  onCluesUpdate?: (clues: ImposterClue[]) => void;
  onVotesUpdate?: (votes: ImposterVote[]) => void;
  onRoundResult?: (result: ImposterRoundResult) => void;
  onError?: (error: Error) => void;
}

export function subscribeToImposterRoom(
  roomCode: string,
  callbacks: ImposterRealtimeCallbacks
): () => void {
  if (channel) {
    supabase.removeChannel(channel);
  }

  channel = supabase.channel(`room:${roomCode}`, {
    config: { broadcast: { self: true } },
  });

  channel
    .on('broadcast', { event: 'imposter_room_updated' }, ({ payload }) => {
      if (payload?.room) callbacks.onRoomUpdate?.(payload.room as Room);
    })
    .on('broadcast', { event: 'imposter_players_updated' }, ({ payload }) => {
      if (payload?.players) callbacks.onPlayersUpdate?.(payload.players as Player[]);
    })
    .on('broadcast', { event: 'imposter_clues_updated' }, ({ payload }) => {
      if (payload?.clues) callbacks.onCluesUpdate?.(payload.clues as ImposterClue[]);
    })
    .on('broadcast', { event: 'imposter_votes_updated' }, ({ payload }) => {
      if (payload?.votes) callbacks.onVotesUpdate?.(payload.votes as ImposterVote[]);
    })
    .on('broadcast', { event: 'imposter_round_result' }, ({ payload }) => {
      if (payload?.result) callbacks.onRoundResult?.(payload.result as ImposterRoundResult);
    })
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        callbacks.onError?.(new Error('Failed to connect to realtime channel'));
      }
    });

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
  };
}

/**
 * REALTIME SUBSCRIPTION SYSTEM
 *
 * This module handles real-time synchronization of game state across all connected clients
 * using Supabase Realtime channels. It's the core mechanism that keeps players' views
 * in sync without requiring page refreshes or polling.
 *
 * Architecture:
 * 1. Server (API routes) makes changes to database
 * 2. Server broadcasts update over Supabase Realtime channel
 * 3. All subscribed clients receive the broadcast
 * 4. Clients update their local React state
 * 5. UI re-renders with new state
 *
 * Channel Naming:
 * - Assumptions game: `room:${roomCode}`
 * - Imposter game: `room:${roomCode}` (same pattern, different events)
 *
 * Event Types (Assumptions):
 * - room_updated: Room state changed (phase, round, hotseat)
 * - players_updated: Player list/scores changed
 * - assignments_updated: New assignments created
 * - wheel_spin: Wheel animation trigger (for synchronization)
 *
 * Event Types (Imposter):
 * - imposter_room_updated: Room state changed
 * - imposter_players_updated: Player list/roles/scores changed
 * - imposter_clues_updated: New clues submitted
 * - imposter_votes_updated: New votes cast
 * - imposter_round_result: Round resolution data
 *
 * Broadcast Configuration:
 * - self: true - Sender receives their own broadcasts (simplifies client logic)
 * - This means all clients use the same code path for updates
 *
 * Lifecycle:
 * 1. Component mounts → call subscribeToRoom()
 * 2. Provide callbacks for each event type
 * 3. Server actions trigger broadcasts
 * 4. Callbacks fire → update React state
 * 5. Component unmounts → call returned cleanup function
 *
 * Error Handling:
 * - Connection errors trigger onError callback
 * - Client should handle reconnection (Supabase handles this automatically)
 * - Consider displaying connection status to user
 *
 * Performance:
 * - Channels are lightweight (minimal overhead per client)
 * - Broadcasts are fast (typically <100ms latency)
 * - No message queuing (latest state always wins)
 *
 * Security:
 * - Channels are public (anyone can subscribe to any room code)
 * - This is acceptable because: (a) codes are random/unguessable, (b) game data
 *   is not sensitive, (c) write operations still require API routes
 * - Clients cannot forge broadcasts (server-side only)
 */

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

/**
 * Callback functions for Assumptions game realtime events.
 *
 * Each callback is optional - provide only the ones you need.
 * Callbacks receive typed payloads matching the database schema.
 *
 * Usage:
 * ```tsx
 * subscribeToRoom(code, {
 *   onRoomUpdate: (room) => setRoom(room),
 *   onPlayersUpdate: (players) => setPlayers(players),
 *   onWheelSpin: ({ hotseatPlayerId }) => startWheelAnimation(hotseatPlayerId),
 * });
 * ```
 */
export interface RealtimeCallbacks {
  onRoomUpdate?: (room: Room) => void;
  onPlayersUpdate?: (players: Player[]) => void;
  onAssignmentsUpdate?: (assignments: Assignment[]) => void;
  onWheelSpin?: (payload: { hotseatPlayerId: string; previousHistory: string[] }) => void;
  onError?: (error: Error) => void;
}

/**
 * Module-level channel singleton.
 * Only one channel active at a time (per client).
 */
let channel: RealtimeChannel | null = null;

/**
 * Subscribe to Assumptions game realtime updates.
 *
 * Creates a Supabase Realtime channel for the specified room and registers
 * callbacks for various game events. Automatically cleans up any previous
 * subscription.
 *
 * @param roomCode - The 6-letter room code
 * @param callbacks - Event handlers for room/player/assignment updates
 * @returns Cleanup function to unsubscribe (call on component unmount)
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   const unsubscribe = subscribeToRoom('ABC123', {
 *     onRoomUpdate: (room) => setRoom(room),
 *     onPlayersUpdate: (players) => setPlayers(players),
 *     onWheelSpin: ({ hotseatPlayerId }) => animateWheel(hotseatPlayerId),
 *   });
 *   return unsubscribe; // Cleanup on unmount
 * }, []);
 * ```
 */
export function subscribeToRoom(
  roomCode: string,
  callbacks: RealtimeCallbacks
): () => void {
  // Clean up any existing subscription (prevents memory leaks)
  if (channel) {
    supabase.removeChannel(channel);
  }

  // Create new channel for this room
  channel = supabase.channel(`room:${roomCode}`, {
    config: {
      broadcast: { self: true }, // Sender receives own broadcasts
    },
  });

  // Register event listeners for each broadcast type
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
      // Handle connection errors
      if (status === 'CHANNEL_ERROR') {
        callbacks.onError?.(new Error('Failed to connect to realtime channel'));
      }
    });

  // Return cleanup function for React useEffect
  return () => {
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
  };
}

/**
 * Manually unsubscribe from the current room.
 *
 * Typically not needed if using the cleanup function returned by subscribeToRoom().
 * Provided for cases where you need to unsubscribe outside of useEffect cleanup.
 */
export function unsubscribeFromRoom(): void {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
}

/**
 * Callback functions for Imposter game realtime events.
 *
 * Similar to RealtimeCallbacks but with Imposter-specific events.
 * All callbacks are optional.
 */
export interface ImposterRealtimeCallbacks {
  onRoomUpdate?: (room: Room) => void;
  onPlayersUpdate?: (players: Player[]) => void;
  onCluesUpdate?: (clues: ImposterClue[]) => void;
  onVotesUpdate?: (votes: ImposterVote[]) => void;
  onRoundResult?: (result: ImposterRoundResult) => void;
  onError?: (error: Error) => void;
}

/**
 * Subscribe to Imposter game realtime updates.
 *
 * Similar to subscribeToRoom() but handles Imposter-specific events.
 * Uses the same channel singleton, so only one subscription is active at a time.
 *
 * @param roomCode - The 6-letter room code
 * @param callbacks - Event handlers for Imposter game events
 * @returns Cleanup function to unsubscribe
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   const unsubscribe = subscribeToImposterRoom('XYZ789', {
 *     onRoomUpdate: setRoom,
 *     onPlayersUpdate: setPlayers,
 *     onRoundResult: (result) => showEliminationScreen(result),
 *   });
 *   return unsubscribe;
 * }, []);
 * ```
 */
export function subscribeToImposterRoom(
  roomCode: string,
  callbacks: ImposterRealtimeCallbacks
): () => void {
  // Clean up any existing subscription
  if (channel) {
    supabase.removeChannel(channel);
  }

  // Create channel with same naming convention as Assumptions
  channel = supabase.channel(`room:${roomCode}`, {
    config: { broadcast: { self: true } },
  });

  // Register Imposter-specific event listeners
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

  // Return cleanup function
  return () => {
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
  };
}

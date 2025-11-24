/**
 * GAME ENGINE - Core Logic for Assumptions Game
 *
 * This module contains pure functions for game rules and state machine logic.
 * NO I/O OPERATIONS - all functions are deterministic and testable in isolation.
 *
 * Key Responsibilities:
 * - State machine transitions (which phases can follow which)
 * - Player assignment algorithm (circular chain generation)
 * - Hotseat selection (random from eligible players)
 * - Game completion detection
 * - Validation logic (player counts, host status, etc.)
 *
 * Design Principles:
 * - Pure functions only (no side effects)
 * - No database access (used by API routes that handle I/O)
 * - No HTTP requests or external dependencies
 * - Fully unit testable
 * - Type-safe with TypeScript
 *
 * Usage Pattern:
 * 1. API routes import these functions
 * 2. Validate game state transitions before DB writes
 * 3. Generate deterministic game data (assignments, selections)
 * 4. Check game completion conditions
 *
 * See docs/GAME_FLOWS.md for visual state machine diagrams.
 * See gameEngine.test.ts for comprehensive test suite.
 */

import type { GamePhase, GameEvent, Player, Assignment } from '@/types';

/**
 * Valid state transition map for the Assumptions game.
 *
 * Each phase can only transition to specific next phases.
 * This enforces the game flow and prevents invalid states.
 *
 * State Flow:
 * LOBBY → ASSIGNMENT → INTRO → WHEEL → HOTSEAT → VOTING → REVEAL → SCOREBOARD
 *                                ↑___________________________________|
 *                                (loop for additional rounds)
 *
 * Special Cases:
 * - SCOREBOARD can go to WHEEL (continue game) or COMPLETE (end game)
 * - COMPLETE is terminal (no transitions out)
 */
const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  LOBBY: ['ASSIGNMENT'],
  ASSIGNMENT: ['INTRO'],
  INTRO: ['WHEEL'],
  WHEEL: ['HOTSEAT'],
  HOTSEAT: ['VOTING'],
  VOTING: ['REVEAL'],
  REVEAL: ['SCOREBOARD'],
  SCOREBOARD: ['WHEEL', 'COMPLETE'],
  COMPLETE: [], // Terminal state
};

/**
 * Check if a state transition is valid.
 *
 * Used by API routes to validate that a requested phase change is allowed
 * before writing to the database. Prevents invalid game states.
 *
 * @param from - Current game phase
 * @param to - Desired next phase
 * @returns true if transition is allowed, false otherwise
 *
 * @example
 * ```typescript
 * // Valid transition
 * isValidTransition('LOBBY', 'ASSIGNMENT') // → true
 *
 * // Invalid transition
 * isValidTransition('LOBBY', 'WHEEL') // → false
 *
 * // Use in API route
 * if (!isValidTransition(room.state, 'HOTSEAT')) {
 *   return Response.json({ error: 'Invalid transition' }, { status: 400 });
 * }
 * ```
 */
export function isValidTransition(from: GamePhase, to: GamePhase): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Determine the next phase based on current state and triggered event.
 *
 * This function encodes the game flow logic. Each event type has specific
 * effects depending on the current phase. Returns null if the event doesn't
 * apply to the current phase.
 *
 * @param currentPhase - The room's current game phase
 * @param event - The game event that occurred (e.g., host clicked "Start Game")
 * @returns The next phase, or null if event doesn't apply
 *
 * @example
 * ```typescript
 * // Host starts game from lobby
 * getNextPhase('LOBBY', { type: 'START_GAME' }) // → 'ASSIGNMENT'
 *
 * // Complete voting phase
 * getNextPhase('VOTING', { type: 'VOTING_COMPLETE' }) // → 'REVEAL'
 *
 * // Invalid event for phase
 * getNextPhase('LOBBY', { type: 'WHEEL_SPUN', hotseatPlayerId: '...' }) // → null
 *
 * // Use in API route
 * const nextPhase = getNextPhase(room.state, { type: 'INTRO_COMPLETE' });
 * if (!nextPhase) {
 *   return Response.json({ error: 'Cannot advance from this state' });
 * }
 * await updateRoomState(room.id, nextPhase);
 * ```
 */
export function getNextPhase(
  currentPhase: GamePhase,
  event: GameEvent
): GamePhase | null {
  switch (event.type) {
    case 'START_GAME':
      if (currentPhase === 'LOBBY') return 'ASSIGNMENT';
      break;

    case 'ASSIGNMENTS_CREATED':
      if (currentPhase === 'ASSIGNMENT') return 'INTRO';
      break;

    case 'INTRO_COMPLETE':
      if (currentPhase === 'INTRO') return 'WHEEL';
      break;

    case 'WHEEL_SPUN':
      if (currentPhase === 'WHEEL') return 'HOTSEAT';
      break;

    case 'HOTSEAT_COMPLETE':
      if (currentPhase === 'HOTSEAT') return 'VOTING';
      break;

    case 'VOTING_COMPLETE':
      if (currentPhase === 'VOTING') return 'REVEAL';
      break;

    case 'REVEAL_COMPLETE':
      if (currentPhase === 'REVEAL') return 'SCOREBOARD';
      break;

    case 'CONTINUE_GAME':
      if (currentPhase === 'SCOREBOARD') return 'WHEEL';
      break;

    case 'END_GAME':
      if (currentPhase === 'SCOREBOARD') return 'COMPLETE';
      break;
  }

  return null;
}

/**
 * Generate a unique 6-letter room code.
 *
 * Room codes use uppercase letters A-Z, excluding I and O to avoid visual
 * confusion with 1 and 0. This gives 24^6 = ~191 million possible codes.
 *
 * Format: ABCDEF (6 characters, no numbers)
 * Character set: A-H, J-N, P-Z (24 letters)
 *
 * @returns A random 6-letter room code (e.g., "HJKM PQ")
 *
 * @example
 * ```typescript
 * const code = generateRoomCode(); // "HJKMPQ"
 * const anotherCode = generateRoomCode(); // "TUVWXY"
 *
 * // Use in room creation
 * const room = await supabase.from('rooms').insert({
 *   code: generateRoomCode(),
 *   host_player_id: hostId,
 *   state: 'LOBBY',
 * });
 * ```
 *
 * Note: Codes are NOT guaranteed to be unique. Callers should handle
 * uniqueness constraints at the database level (unique index on rooms.code).
 * If collision occurs, retry with a new code.
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluding I and O to avoid confusion with 1/0
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Shuffle an array using the Fisher-Yates algorithm.
 *
 * Creates a new array with elements in random order. Original array is not modified.
 * Provides uniform distribution (each permutation equally likely).
 *
 * Algorithm: Fisher-Yates shuffle
 * Time complexity: O(n)
 * Space complexity: O(n) (creates copy)
 *
 * @param array - Array to shuffle (any type)
 * @returns New shuffled array
 *
 * @example
 * ```typescript
 * const players = [alice, bob, charlie];
 * const shuffled = shuffleArray(players);
 * // shuffled might be [charlie, alice, bob]
 * // players is unchanged: [alice, bob, charlie]
 * ```
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]; // Create copy to avoid mutation
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
  }
  return shuffled;
}

/**
 * Create random target assignments for all players.
 *
 * Generates a circular chain where each player is assigned exactly one other
 * player as their "target". When a player is in the hotseat, they answer
 * questions as if they were their assigned target.
 *
 * Algorithm:
 * 1. Shuffle players randomly
 * 2. Create circular chain: player[0] → player[1] → ... → player[n-1] → player[0]
 * 3. No player is assigned to themselves (guaranteed by circular chain)
 *
 * Properties:
 * - Everyone has exactly one target
 * - Everyone is the target of exactly one other player
 * - No self-assignments
 * - Forms a single cycle (not multiple smaller cycles)
 *
 * @param players - Array of players in the room (must be 2+)
 * @param roomId - Room UUID for assignment records
 * @param roundNumber - Round number for assignment records
 * @returns Array of Assignment objects
 * @throws Error if fewer than 2 players
 *
 * @example
 * ```typescript
 * const players = [
 *   { id: '1', display_name: 'Alice', ... },
 *   { id: '2', display_name: 'Bob', ... },
 *   { id: '3', display_name: 'Charlie', ... },
 *   { id: '4', display_name: 'Dana', ... },
 * ];
 *
 * const assignments = assignPlayersRandomly(players, roomId, 1);
 * // Result (example):
 * // [
 * //   { giver_player_id: '2', target_player_id: '3' }, // Bob → Charlie
 * //   { giver_player_id: '3', target_player_id: '1' }, // Charlie → Alice
 * //   { giver_player_id: '1', target_player_id: '4' }, // Alice → Dana
 * //   { giver_player_id: '4', target_player_id: '2' }, // Dana → Bob
 * // ]
 * // Forms cycle: Bob → Charlie → Alice → Dana → Bob
 * ```
 */
export function assignPlayersRandomly(
  players: Player[],
  roomId: string,
  roundNumber: number
): Assignment[] {
  if (players.length < 2) {
    throw new Error('Need at least 2 players to create assignments');
  }

  const shuffled = shuffleArray(players);
  const assignments: Assignment[] = [];

  // Create a cycle: player[0] -> player[1] -> ... -> player[n-1] -> player[0]
  for (let i = 0; i < shuffled.length; i++) {
    const giver = shuffled[i];
    const target = shuffled[(i + 1) % shuffled.length];

    assignments.push({
      room_id: roomId,
      giver_player_id: giver.id,
      target_player_id: target.id,
      round_number: roundNumber,
    });
  }

  return assignments;
}

/**
 * Select a random player for the hotseat from eligible players.
 *
 * Chooses uniformly at random from players who haven't been hotseat yet.
 * This function does NOT mutate any state - it just returns a selected player.
 * The caller is responsible for tracking hotseat history.
 *
 * @param players - All players in the room
 * @param excludeIds - Player IDs to exclude (typically hotseat history)
 * @returns Randomly selected eligible player, or null if none eligible
 *
 * @example
 * ```typescript
 * const players = [alice, bob, charlie, dana];
 * const history = [alice.id, bob.id]; // Alice and Bob already went
 *
 * const selected = selectHotseat(players, history);
 * // Returns either Charlie or Dana (50% chance each)
 *
 * // No eligible players left
 * const allDone = selectHotseat(players, players.map(p => p.id));
 * // Returns null
 *
 * // Use in API route
 * const hotseatPlayer = selectHotseat(players, room.hotseat_history);
 * if (!hotseatPlayer) {
 *   // Game should end - all players have been hotseat
 *   await updateRoomState(room.id, 'COMPLETE');
 * } else {
 *   await updateRoom(room.id, {
 *     hotseat_player_id: hotseatPlayer.id,
 *     hotseat_history: [...room.hotseat_history, hotseatPlayer.id],
 *   });
 * }
 * ```
 */
export function selectHotseat(
  players: Player[],
  excludeIds: string[] = []
): Player | null {
  const eligible = players.filter((p) => !excludeIds.includes(p.id));

  if (eligible.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * eligible.length);
  return eligible[randomIndex];
}

/**
 * Check if the game should end (all players have been hotseat).
 *
 * The game continues until every player has had a turn as the hotseat.
 * This ensures everyone participates equally.
 *
 * @param players - All players in the room
 * @param hotseatHistory - Array of player IDs who have been hotseat
 * @returns true if game should end, false if more rounds needed
 *
 * @example
 * ```typescript
 * const players = [alice, bob, charlie];
 * const history = [alice.id, bob.id];
 *
 * shouldEndGame(players, history); // false (Charlie hasn't gone)
 *
 * history.push(charlie.id);
 * shouldEndGame(players, history); // true (everyone's been hotseat)
 *
 * // Use in scoreboard phase
 * if (shouldEndGame(players, room.hotseat_history)) {
 *   await updateRoomState(room.id, 'COMPLETE');
 * } else {
 *   // Continue to next round
 *   await updateRoomState(room.id, 'WHEEL');
 * }
 * ```
 */
export function shouldEndGame(
  players: Player[],
  hotseatHistory: string[]
): boolean {
  // Game ends when all players have been in the hotseat
  return hotseatHistory.length >= players.length;
}

/**
 * Check if a player is the host.
 *
 * Simple utility for host authorization checks.
 * Handles null players gracefully (returns false).
 *
 * @param player - Player object or null
 * @returns true if player exists and is host, false otherwise
 *
 * @example
 * ```typescript
 * const player = await getPlayerBySession(sessionId);
 * if (!isHost(player)) {
 *   return Response.json({ error: 'Forbidden' }, { status: 403 });
 * }
 * // Proceed with host-only action
 * ```
 */
export function isHost(player: Player | null): boolean {
  return player?.is_host === true;
}

/**
 * Player count constraints for game start.
 *
 * - MIN_PLAYERS: Need at least 3 for interesting gameplay
 * - MAX_PLAYERS: Cap at 20 to keep game duration reasonable
 */
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 20;

/**
 * Validate that a game can start with the current player count.
 *
 * Checks both minimum and maximum player requirements.
 * Returns a structured result with success flag and error reason if applicable.
 *
 * @param players - Current players in the room
 * @returns Object with canStart boolean and optional reason string
 *
 * @example
 * ```typescript
 * const result = canStartGame(players);
 *
 * if (!result.canStart) {
 *   return Response.json({ error: result.reason }, { status: 400 });
 * }
 *
 * // Proceed to start game
 * await createAssignments(players);
 *
 * // Example results:
 * canStartGame([alice, bob]) // { canStart: false, reason: "Need at least 3 players..." }
 * canStartGame([alice, bob, charlie]) // { canStart: true }
 * canStartGame(Array(21).fill(alice)) // { canStart: false, reason: "Maximum 20 players..." }
 * ```
 */
export function canStartGame(players: Player[]): { canStart: boolean; reason?: string } {
  if (players.length < MIN_PLAYERS) {
    return {
      canStart: false,
      reason: `Need at least ${MIN_PLAYERS} players to start (currently ${players.length})`,
    };
  }

  if (players.length > MAX_PLAYERS) {
    return {
      canStart: false,
      reason: `Maximum ${MAX_PLAYERS} players allowed (currently ${players.length})`,
    };
  }

  return { canStart: true };
}

/**
 * Get the hotseat player's assignment (who they're pretending to be).
 *
 * Looks up which player the hotseat was assigned to at the start of the game.
 * This is the "correct answer" that voters should guess.
 *
 * @param assignments - All assignments for the current round
 * @param hotseatPlayerId - ID of the player currently in the hotseat
 * @returns Assignment object if found, null otherwise
 *
 * @example
 * ```typescript
 * // Assignments:
 * // Alice → Bob
 * // Bob → Charlie
 * // Charlie → Alice
 *
 * const assignment = getHotseatAssignment(assignments, bob.id);
 * // Returns: { giver_player_id: bob.id, target_player_id: charlie.id, ... }
 *
 * // Use during reveal phase to check correct votes
 * const hotseatAssignment = getHotseatAssignment(assignments, room.hotseat_player_id);
 * const correctTargetId = hotseatAssignment?.target_player_id;
 *
 * votes.forEach(vote => {
 *   vote.is_correct = (vote.guessed_target_id === correctTargetId);
 *   if (vote.is_correct) {
 *     // Award point to voter
 *     await incrementScore(vote.guesser_player_id);
 *   }
 * });
 * ```
 */
export function getHotseatAssignment(
  assignments: Assignment[],
  hotseatPlayerId: string
): Assignment | null {
  return assignments.find((a) => a.giver_player_id === hotseatPlayerId) || null;
}

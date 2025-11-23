import type { GamePhase, GameEvent, Player, Assignment } from '@/types';

// Valid state transitions
const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  LOBBY: ['ASSIGNMENT'],
  ASSIGNMENT: ['INTRO'],
  INTRO: ['WHEEL'],
  WHEEL: ['HOTSEAT'],
  HOTSEAT: ['VOTING'],
  VOTING: ['REVEAL'],
  REVEAL: ['SCOREBOARD'],
  SCOREBOARD: ['WHEEL', 'COMPLETE'],
  COMPLETE: [],
};

// Check if a transition is valid
export function isValidTransition(from: GamePhase, to: GamePhase): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// Get the next phase based on current state and event
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

// Generate a random room code (6 uppercase letters)
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluding I and O to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Shuffle an array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Create random assignments where each player is assigned to guess about another player
// No player guesses themselves, and ideally forms a cycle
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

// Select a random player for the hotseat who hasn't been selected this round
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

// Check if the game should end (all players have been in hotseat)
export function shouldEndGame(
  players: Player[],
  hotseatHistory: string[]
): boolean {
  // Game ends when all players have been in the hotseat
  return hotseatHistory.length >= players.length;
}

// Validate that a player is the host
export function isHost(player: Player | null): boolean {
  return player?.is_host === true;
}

// Minimum players required to start the game
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 20;

// Check if the game can start
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

// Get the hotseat player's assignment (who they're answering about)
export function getHotseatAssignment(
  assignments: Assignment[],
  hotseatPlayerId: string
): Assignment | null {
  return assignments.find((a) => a.giver_player_id === hotseatPlayerId) || null;
}

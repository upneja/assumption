'use client';

import { Player, Assignment } from '@/types';

interface IntroViewProps {
  players: Player[];
  currentPlayer: Player | null;
  assignment: Assignment | null;
  isHost: boolean;
  onContinue: () => void;
  isLoading: boolean;
}

export function IntroView({
  players,
  currentPlayer,
  assignment,
  isHost,
  onContinue,
  isLoading,
}: IntroViewProps) {
  // Find the target player for this player's assignment
  const targetPlayer = assignment
    ? players.find((p) => p.id === assignment.target_player_id)
    : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-blue-900 to-purple-900">
      <div className="w-full max-w-md text-center">
        {/* Phase Title */}
        <h1 className="text-3xl font-bold text-white mb-2">Introductions</h1>
        <p className="text-blue-300 mb-8">
          Time to meet everyone! Go around and introduce yourselves.
        </p>

        {/* Assignment Card */}
        {targetPlayer && currentPlayer && (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-8">
            <p className="text-blue-300 text-sm uppercase tracking-wide mb-2">
              Your Secret Assignment
            </p>
            <p className="text-white text-xl mb-4">
              You will be making assumptions about:
            </p>
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl p-4">
              <span className="text-2xl font-bold text-white">
                {targetPlayer.display_name}
              </span>
            </div>
            <p className="text-blue-300 text-sm mt-4">
              Keep this secret! Pay attention during intros.
            </p>
          </div>
        )}

        {/* Players List */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6">
          <h2 className="text-white text-lg font-semibold mb-4">
            Players in this game
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {players.map((player) => (
              <span
                key={player.id}
                className={`px-3 py-2 rounded-lg text-sm ${
                  player.id === currentPlayer?.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/20 text-white'
                }`}
              >
                {player.display_name}
                {player.id === currentPlayer?.id && ' (you)'}
              </span>
            ))}
          </div>
        </div>

        {/* Continue Button (Host Only) */}
        {isHost && (
          <button
            onClick={onContinue}
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-xl font-semibold text-lg bg-blue-500 hover:bg-blue-400 text-white transition-all disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Continue to Wheel'}
          </button>
        )}

        {!isHost && (
          <p className="text-blue-300">Waiting for host to continue...</p>
        )}
      </div>
    </div>
  );
}

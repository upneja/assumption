'use client';

import { useState } from 'react';
import { Player } from '@/types';

interface VotingViewProps {
  hotseatPlayer: Player | null;
  players: Player[];
  currentPlayer: Player | null;
  isHost: boolean;
  onVote: (guessedTargetId: string) => void;
  onContinue: () => void;
  hasVoted: boolean;
  isLoading: boolean;
}

export function VotingView({
  hotseatPlayer,
  players,
  currentPlayer,
  isHost,
  onVote,
  onContinue,
  hasVoted,
  isLoading,
}: VotingViewProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  // The hotseat player doesn't vote
  const isHotseatPlayer = hotseatPlayer?.id === currentPlayer?.id;

  // Voting options: everyone except the hotseat player
  const votingOptions = players.filter((p) => p.id !== hotseatPlayer?.id);

  const handleSubmitVote = () => {
    if (selectedPlayer) {
      onVote(selectedPlayer);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-indigo-900 via-purple-900 to-violet-900 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="w-full max-w-md text-center relative z-10">
        {/* Phase Title */}
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">
          VOTING TIME
        </h1>
        <p className="text-purple-300 mb-6">
          Who was {hotseatPlayer?.display_name} talking about?
        </p>

        {isHotseatPlayer ? (
          // Hotseat player view - they can't vote
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-purple-500/30">
              <p className="text-purple-300 text-sm uppercase tracking-wide mb-2">
                You were in the hotseat
              </p>
              <p className="text-white text-lg">
                Everyone is voting on who they think your target was...
              </p>
              <div className="mt-4 text-4xl animate-pulse">🤔</div>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-purple-300 text-sm">
                Sit tight! The reveal is coming soon.
              </p>
            </div>
          </div>
        ) : hasVoted ? (
          // Already voted view
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur rounded-2xl p-6 border border-green-500/50">
              <div className="text-4xl mb-3">✓</div>
              <p className="text-green-300 text-lg font-semibold">
                Vote submitted!
              </p>
              <p className="text-green-200 text-sm mt-2">
                Waiting for others to vote...
              </p>
            </div>
          </div>
        ) : (
          // Voting view
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-purple-500/30">
              <p className="text-purple-300 text-sm uppercase tracking-wide mb-4">
                Cast your vote
              </p>
              <p className="text-white mb-4">
                Who do you think <span className="font-bold">{hotseatPlayer?.display_name}</span> was pretending to be?
              </p>

              {/* Voting buttons */}
              <div className="space-y-3">
                {votingOptions.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayer(player.id)}
                    disabled={isLoading}
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
                      selectedPlayer === player.id
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white scale-105 shadow-lg shadow-purple-500/50'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    }`}
                  >
                    {player.display_name}
                    {player.id === currentPlayer?.id && ' (you)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmitVote}
              disabled={!selectedPlayer || isLoading}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                selectedPlayer
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Submitting...' : 'Lock In Vote'}
            </button>
          </div>
        )}

        {/* Host continue button - always visible to host */}
        {isHost && (
          <button
            onClick={onContinue}
            disabled={isLoading}
            className="w-full mt-6 py-4 px-6 rounded-xl font-bold text-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white transition-all disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'End Voting → Reveal Answer'}
          </button>
        )}
      </div>
    </div>
  );
}

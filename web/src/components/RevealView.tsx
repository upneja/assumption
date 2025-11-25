'use client';

import { useMemo, useEffect } from 'react';
import { Player, Assignment, Vote } from '@/types';
import { hapticsSuccess, hapticsError } from '@/lib/haptics';

interface RevealViewProps {
  hotseatPlayer: Player | null;
  hotseatAssignment: Assignment | null;
  players: Player[];
  currentPlayer: Player | null;
  voteResults: {
    votes: Vote[];
    correctVoterIds: string[];
    incorrectVoterIds: string[];
    actualTargetId: string;
  } | null;
  isHost: boolean;
  onContinue: () => void;
  isLoading: boolean;
}

export function RevealView({
  hotseatPlayer,
  hotseatAssignment,
  players,
  voteResults,
  isHost,
  onContinue,
  isLoading,
}: RevealViewProps) {
  // The actual target
  const actualTarget = hotseatAssignment
    ? players.find((p) => p.id === hotseatAssignment.target_player_id)
    : null;

  // Get player names for correct/incorrect voters
  const correctVoters = voteResults
    ? players.filter((p) => voteResults.correctVoterIds.includes(p.id))
    : [];
  const incorrectVoters = voteResults
    ? players.filter((p) => voteResults.incorrectVoterIds.includes(p.id))
    : [];

  // Get who each player voted for
  const getVotedFor = (playerId: string): Player | null => {
    const vote = voteResults?.votes.find((v) => v.guesser_player_id === playerId);
    if (!vote) return null;
    return players.find((p) => p.id === vote.guessed_target_id) || null;
  };

  // Haptic feedback on reveal
  useEffect(() => {
    // Trigger appropriate haptic based on whether current player voted correctly
    const currentPlayerId = voteResults?.correctVoterIds.find((id) =>
      players.some(p => p.id === id)
    );
    if (currentPlayerId) {
      hapticsSuccess(); // Success haptic if player voted correctly
    } else {
      hapticsError(); // Error haptic if player voted incorrectly or didn't vote
    }
  }, [voteResults, players]);

  const confettiBits = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        top: `${(i * 61) % 100}%`,
        color: ['#fbbf24', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4'][i % 5],
        delay: `${(i % 5) * 0.2}s`,
        duration: `${2 + (i % 4) * 0.4}s`,
        id: i,
      })),
    []
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-amber-900 via-yellow-900 to-orange-900 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Confetti-like particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confettiBits.map((bit) => (
          <div
            key={bit.id}
            className="absolute w-3 h-3 rounded-full animate-bounce"
            style={{
              left: bit.left,
              top: bit.top,
              backgroundColor: bit.color,
              animationDelay: bit.delay,
              animationDuration: bit.duration,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md text-center relative z-10">
        {/* Phase Title */}
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-2">
          THE REVEAL
        </h1>
        <p className="text-yellow-300 mb-6">The moment of truth!</p>

        {/* Hotseat player */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-4 border border-yellow-500/30">
          <p className="text-yellow-300 text-sm uppercase tracking-wide mb-1">
            In the hotseat
          </p>
          <span className="text-2xl font-bold text-white">
            {hotseatPlayer?.display_name}
          </span>
        </div>

        {/* Arrow */}
        <div className="text-4xl mb-4 animate-bounce">⬇️</div>

        {/* The reveal */}
        <div className="bg-gradient-to-r from-yellow-500/30 to-orange-500/30 backdrop-blur rounded-2xl p-6 mb-6 border-2 border-yellow-500/50 shadow-2xl shadow-yellow-500/20">
          <p className="text-yellow-300 text-sm uppercase tracking-wide mb-2">
            Was pretending to be
          </p>
          <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse">
            {actualTarget?.display_name || '???'}
          </div>
        </div>

        {/* Vote Results */}
        {voteResults && (correctVoters.length > 0 || incorrectVoters.length > 0) && (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-6">
            <p className="text-white font-semibold mb-4">Vote Results</p>

            {/* Correct guesses */}
            {correctVoters.length > 0 && (
              <div className="mb-4">
                <p className="text-green-400 text-sm uppercase tracking-wide mb-2">
                  Correct (+1 point each)
                </p>
                <div className="space-y-2">
                  {correctVoters.map((voter) => (
                    <div
                      key={voter.id}
                      className="flex items-center justify-between bg-green-500/20 rounded-lg px-3 py-2 border border-green-500/30"
                    >
                      <span className="text-white">{voter.display_name}</span>
                      <span className="text-green-400 text-sm">
                        ✓ {getVotedFor(voter.id)?.display_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Incorrect guesses */}
            {incorrectVoters.length > 0 && (
              <div>
                <p className="text-red-400 text-sm uppercase tracking-wide mb-2">
                  Incorrect
                </p>
                <div className="space-y-2">
                  {incorrectVoters.map((voter) => (
                    <div
                      key={voter.id}
                      className="flex items-center justify-between bg-red-500/20 rounded-lg px-3 py-2 border border-red-500/30"
                    >
                      <span className="text-white">{voter.display_name}</span>
                      <span className="text-red-400 text-sm">
                        ✗ {getVotedFor(voter.id)?.display_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions for IRL verification */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-6 text-left">
          <p className="text-white font-semibold mb-2 text-center">
            🎤 Time for {actualTarget?.display_name} to speak!
          </p>
          <ul className="text-yellow-200 text-sm space-y-1">
            <li>• How accurate were the answers?</li>
            <li>• Any funny moments to call out?</li>
          </ul>
        </div>

        {/* Continue Button (Host Only) */}
        {isHost && (
          <button
            onClick={onContinue}
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-xl font-bold text-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white transition-all disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Continue to Scoreboard'}
          </button>
        )}

        {!isHost && (
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-yellow-500/30">
            <p className="text-yellow-300">
              Waiting for host to continue...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

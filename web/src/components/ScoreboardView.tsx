'use client';

import { Player } from '@/types';

interface ScoreboardViewProps {
  players: Player[];
  hotseatHistory: string[];
  lastHotseatPlayer: Player | null;
  isHost: boolean;
  onContinue: () => void;
  isLoading: boolean;
}

export function ScoreboardView({
  players,
  hotseatHistory,
  lastHotseatPlayer,
  isHost,
  onContinue,
  isLoading,
}: ScoreboardViewProps) {
  const playersRemaining = players.length - hotseatHistory.length;
  const isLastRound = playersRemaining === 0;
  const progress = (hotseatHistory.length / players.length) * 100;

  // Sort players by score (highest first)
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-emerald-900 via-teal-900 to-cyan-900">
      <div className="w-full max-w-md text-center">
        {/* Phase Title */}
        <h1 className="text-3xl font-bold text-white mb-2">
          {isLastRound ? '🏆 Final Scores!' : 'Scoreboard'}
        </h1>
        <p className="text-emerald-300 mb-6">
          {isLastRound
            ? 'Everyone has had their turn!'
            : `${hotseatHistory.length} of ${players.length} rounds complete`}
        </p>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-emerald-400 mt-2">
            <span>Start</span>
            <span>{Math.round(progress)}%</span>
            <span>Finish</span>
          </div>
        </div>

        {/* Last Hotseat */}
        {lastHotseatPlayer && (
          <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 backdrop-blur rounded-2xl p-4 mb-6 border border-emerald-500/30">
            <p className="text-emerald-300 text-sm uppercase tracking-wide mb-1">
              Just finished
            </p>
            <span className="text-2xl font-bold text-white">
              {lastHotseatPlayer.display_name}
            </span>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-white/5 backdrop-blur rounded-2xl p-6 mb-6">
          <h2 className="text-white text-lg font-semibold mb-4">
            {isLastRound ? '🏆 Final Leaderboard' : 'Leaderboard'}
          </h2>
          <div className="space-y-2">
            {sortedPlayers.map((player, index) => {
              const hasGone = hotseatHistory.includes(player.id);
              const isTop3 = index < 3;
              const medals = ['🥇', '🥈', '🥉'];

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between rounded-lg px-4 py-3 transition-all ${
                    isTop3 && isLastRound
                      ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30'
                      : hasGone
                      ? 'bg-emerald-500/20 border border-emerald-500/30'
                      : 'bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${isTop3 ? 'text-2xl' : 'text-emerald-400'}`}>
                      {isTop3 && isLastRound ? medals[index] : `#${index + 1}`}
                    </span>
                    <div className="flex flex-col items-start">
                      <span className={hasGone || isTop3 ? 'text-white' : 'text-slate-400'}>
                        {player.display_name}
                      </span>
                      {!hasGone && !isLastRound && (
                        <span className="text-xs text-slate-500">Not yet</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-bold ${
                      isTop3 && isLastRound ? 'text-yellow-400' : 'text-emerald-400'
                    }`}>
                      {player.score || 0}
                    </span>
                    <span className="text-xs text-slate-500">pts</span>
                    {player.is_host && (
                      <span className="text-xs bg-yellow-500 text-yellow-900 px-2 py-0.5 rounded-full font-semibold ml-2">
                        HOST
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scoring info */}
        <div className="bg-white/5 rounded-xl p-3 mb-6 text-sm text-emerald-300">
          +1 point for correctly guessing who the hotseat player was pretending to be
        </div>

        {/* Continue Button (Host Only) */}
        {isHost && (
          <button
            onClick={onContinue}
            disabled={isLoading}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all disabled:opacity-50 ${
              isLastRound
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white'
            }`}
          >
            {isLoading
              ? 'Loading...'
              : isLastRound
              ? '🎉 End Game'
              : `Next Round (${playersRemaining} left)`}
          </button>
        )}

        {!isHost && (
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-emerald-500/30">
            <p className="text-emerald-300">
              Waiting for host to continue...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

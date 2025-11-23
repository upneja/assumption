'use client';

import { Player, Assignment } from '@/types';

interface HotseatViewProps {
  hotseatPlayer: Player | null;
  hotseatAssignment: Assignment | null; // The hotseat player's secret target
  players: Player[];
  currentPlayer: Player | null;
  isHost: boolean;
  onComplete: () => void;
  isLoading: boolean;
}

export function HotseatView({
  hotseatPlayer,
  hotseatAssignment,
  players,
  currentPlayer,
  isHost,
  onComplete,
  isLoading,
}: HotseatViewProps) {
  const isInHotseat = hotseatPlayer?.id === currentPlayer?.id;

  // The hotseat player's secret target (only shown to the hotseat player)
  const secretTarget = hotseatAssignment
    ? players.find((p) => p.id === hotseatAssignment.target_player_id)
    : null;

  // Other players (excluding hotseat player) - these are the voting options later
  const otherPlayers = players.filter((p) => p.id !== hotseatPlayer?.id);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-rose-900 via-red-900 to-orange-900 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="w-full max-w-md text-center relative z-10">
        {/* Phase Title */}
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 mb-2">
          HOTSEAT
        </h1>

        {/* Hotseat Player Display */}
        {hotseatPlayer && (
          <div className="bg-gradient-to-r from-red-500/30 to-orange-500/30 backdrop-blur rounded-2xl p-6 mb-6 border border-red-500/50">
            <p className="text-red-300 text-sm uppercase tracking-wide mb-2">
              In the hotseat
            </p>
            <span className="text-4xl font-black text-white">
              {hotseatPlayer.display_name}
            </span>
          </div>
        )}

        {/* Different views for hotseat player vs everyone else */}
        {isInHotseat ? (
          // HOTSEAT PLAYER VIEW - They see their secret target
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 backdrop-blur rounded-2xl p-6 border border-purple-500/50">
              <p className="text-purple-300 text-sm uppercase tracking-wide mb-2">
                Your secret target
              </p>
              <p className="text-white mb-2">Answer questions as if you were:</p>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 mt-3">
                <span className="text-3xl font-black text-white">
                  {secretTarget?.display_name || '???'}
                </span>
              </div>
              <p className="text-purple-300 text-sm mt-4">
                Others will ask you questions. Answer how you think <span className="font-bold">{secretTarget?.display_name}</span> would answer!
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-left">
              <p className="text-white font-semibold mb-2">How to play:</p>
              <ul className="text-red-200 text-sm space-y-1">
                <li>• Others will ask you questions</li>
                <li>• Answer as if you were <span className="font-bold">{secretTarget?.display_name}</span></li>
                <li>• Try to be convincing!</li>
                <li>• Don&apos;t reveal who your target is</li>
              </ul>
            </div>
          </div>
        ) : (
          // AUDIENCE VIEW - They're trying to figure out who the target is
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
              <p className="text-red-300 text-sm uppercase tracking-wide mb-3">
                The mystery
              </p>
              <p className="text-white text-lg mb-4">
                <span className="font-bold">{hotseatPlayer?.display_name}</span> is answering questions about someone...
              </p>
              <p className="text-red-300">
                Who do you think it is?
              </p>
            </div>

            {/* Show possible targets */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-4">
              <p className="text-xs text-red-400 uppercase tracking-widest mb-3">
                Possible targets
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {otherPlayers.map((player) => (
                  <span
                    key={player.id}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white border border-white/20"
                  >
                    {player.display_name}
                    {player.id === currentPlayer?.id && ' (you)'}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-left">
              <p className="text-white font-semibold mb-2">Your job:</p>
              <ul className="text-red-200 text-sm space-y-1">
                <li>• Ask {hotseatPlayer?.display_name} questions</li>
                <li>• Listen carefully to their answers</li>
                <li>• Figure out who they&apos;re pretending to be</li>
                <li>• You&apos;ll vote after this round!</li>
              </ul>
            </div>
          </div>
        )}

        {/* Sample Questions */}
        <div className="bg-white/5 backdrop-blur rounded-2xl p-4 mt-6 text-left">
          <p className="text-white font-semibold mb-2 text-center">Sample Questions</p>
          <ul className="text-red-200 text-sm space-y-1">
            <li>• &quot;What&apos;s your most embarrassing moment?&quot;</li>
            <li>• &quot;What&apos;s your biggest fear?&quot;</li>
            <li>• &quot;What would you do with a million dollars?&quot;</li>
            <li>• &quot;What&apos;s your guilty pleasure?&quot;</li>
          </ul>
        </div>

        {/* Continue Button (Host Only) */}
        {isHost && (
          <button
            onClick={onComplete}
            disabled={isLoading}
            className="w-full mt-6 py-4 px-6 rounded-xl font-bold text-lg bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white transition-all disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'End Hotseat → Start Voting'}
          </button>
        )}

        {!isHost && (
          <div className="mt-6 bg-slate-800/50 rounded-2xl p-4 border border-red-500/30">
            <p className="text-red-300">
              Waiting for host to end hotseat...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

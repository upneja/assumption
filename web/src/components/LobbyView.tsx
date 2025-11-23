'use client';

import { Player } from '@/types';

interface LobbyViewProps {
  roomCode: string;
  players: Player[];
  isHost: boolean;
  canStart: boolean;
  startReason?: string;
  onStart: () => void;
  isLoading: boolean;
}

export function LobbyView({
  roomCode,
  players,
  isHost,
  canStart,
  startReason,
  onStart,
  isLoading,
}: LobbyViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-purple-900 to-indigo-900">
      <div className="w-full max-w-md">
        {/* Room Code Display */}
        <div className="text-center mb-8">
          <p className="text-purple-300 text-sm uppercase tracking-wide mb-2">
            Room Code
          </p>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
            <span className="text-4xl font-mono font-bold text-white tracking-[0.3em]">
              {roomCode}
            </span>
          </div>
          <p className="text-purple-300 text-sm mt-2">
            Share this code with your friends!
          </p>
        </div>

        {/* Players List */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6">
          <h2 className="text-white text-lg font-semibold mb-4">
            Players ({players.length})
          </h2>
          <ul className="space-y-2">
            {players.map((player) => (
              <li
                key={player.id}
                className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-3"
              >
                <span className="text-white">{player.display_name}</span>
                {player.is_host && (
                  <span className="text-xs bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full font-semibold">
                    HOST
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Start Button (Host Only) */}
        {isHost && (
          <div className="text-center">
            <button
              onClick={onStart}
              disabled={!canStart || isLoading}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
                canStart && !isLoading
                  ? 'bg-green-500 hover:bg-green-400 text-white'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Starting...' : 'Start Game'}
            </button>
            {!canStart && startReason && (
              <p className="text-yellow-400 text-sm mt-2">{startReason}</p>
            )}
          </div>
        )}

        {/* Waiting Message (Non-Host) */}
        {!isHost && (
          <div className="text-center">
            <p className="text-purple-300">Waiting for host to start...</p>
          </div>
        )}
      </div>
    </div>
  );
}

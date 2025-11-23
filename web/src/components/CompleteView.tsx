'use client';

import { Player } from '@/types';
import Link from 'next/link';

interface CompleteViewProps {
  players: Player[];
}

export function CompleteView({ players }: CompleteViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-indigo-900 to-purple-900">
      <div className="w-full max-w-md text-center">
        {/* Celebration */}
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-white mb-2">Game Over!</h1>
        <p className="text-purple-300 mb-8">
          Thanks for playing Assumptions!
        </p>

        {/* Players */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-8">
          <h2 className="text-white text-lg font-semibold mb-4">
            Players
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {players.map((player) => (
              <span
                key={player.id}
                className="px-3 py-2 rounded-lg text-sm bg-white/20 text-white"
              >
                {player.display_name}
              </span>
            ))}
          </div>
        </div>

        {/* Play Again */}
        <Link
          href="/"
          className="inline-block w-full py-4 px-6 rounded-xl font-semibold text-lg bg-purple-500 hover:bg-purple-400 text-white transition-all"
        >
          Play Again
        </Link>
      </div>
    </div>
  );
}

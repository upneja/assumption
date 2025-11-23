'use client';

import { Player } from '@/types';

interface AvatarChipProps {
  player: Player;
  highlight?: boolean;
  delay?: number;
}

export function AvatarChip({ player, highlight = false, delay = 0 }: AvatarChipProps) {
  const colors = ['bg-pink-500/80', 'bg-cyan-500/80', 'bg-amber-500/80', 'bg-indigo-500/80'];
  const color = colors[Math.abs(player.display_name.charCodeAt(0)) % colors.length];

  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-full text-sm font-semibold text-white backdrop-blur neon-card ${
        highlight ? 'ring-2 ring-cyan-400/70 shadow-lg' : 'ring-1 ring-white/10'
      } wiggle-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`w-9 h-9 rounded-full ${color} flex items-center justify-center font-bold uppercase shadow-lg`}
      >
        {player.display_name.slice(0, 2)}
      </div>
      <div className="flex flex-col leading-tight">
        <span>{player.display_name}</span>
        {player.is_host && <span className="text-xs text-cyan-200">Host</span>}
      </div>
    </div>
  );
}

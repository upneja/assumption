'use client';

import { Player } from '@/types';
import { AvatarChip } from './AvatarChip';

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
    <div className="min-h-screen flex flex-col px-4 py-6 gap-4">
      <div className="neon-card rounded-3xl p-5 border border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Room</p>
            <div className="text-3xl font-black text-white tracking-[0.3em] font-mono">
              {roomCode}
            </div>
            <p className="text-slate-400 text-sm mt-1">Share this code. Zero onboarding.</p>
          </div>
          <div className="h-14 px-4 rounded-2xl flex items-center gap-2 bg-white/5 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-200 text-sm">Players: {players.length}</span>
          </div>
        </div>
      </div>

      <div className="neon-card rounded-3xl p-5 border border-white/10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Who&apos;s here</h2>
          <div className="text-xs text-slate-300">Wiggle in as people join</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {players.map((player, idx) => (
            <AvatarChip
              key={player.id}
              player={player}
              highlight={player.is_host}
              delay={idx * 60}
            />
          ))}
        </div>
      </div>

      <div className="neon-card rounded-3xl p-5 border border-white/10">
        <div className="flex flex-col gap-3">
          {isHost ? (
            <>
              <button
                onClick={onStart}
                disabled={!canStart || isLoading}
                className={`w-full py-4 rounded-2xl text-lg font-extrabold text-slate-900 tap-pop animate-gradient-bg ${
                  !canStart || isLoading ? 'opacity-60' : ''
                }`}
              >
                {isLoading ? 'Starting...' : 'Start the game'}
              </button>
              {!canStart && startReason && (
                <p className="text-orange-300 text-sm text-center">{startReason}</p>
              )}
            </>
          ) : (
            <div className="text-center text-slate-200 text-base">
              Waiting for host to start
              <div className="mt-2 text-sm text-slate-400">Keep your screen up—everything syncs.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

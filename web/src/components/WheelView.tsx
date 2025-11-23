'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Player } from '@/types';

interface WheelViewProps {
  players: Player[];
  hotseatHistory: string[];
  isHost: boolean;
  onSpin: () => void;
  isLoading: boolean;
  activeSpin: {
    targetPlayerId: string;
    eligiblePlayerIds: string[];
  } | null;
  onSpinComplete: () => void;
}

export function WheelView({
  players,
  hotseatHistory,
  isHost,
  onSpin,
  isLoading,
  activeSpin,
  onSpinComplete,
}: WheelViewProps) {
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'reveal'>('idle');
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const displayedIndexRef = useRef(0);
  const activeSpinIdRef = useRef<string | null>(null);
  const hasCompletedRef = useRef(false);

  // Get eligible players for current view (either current room state or the active spin payload)
  const baseEligiblePlayers = players.filter((p) => !hotseatHistory.includes(p.id));
  const spinEligiblePlayers = activeSpin
    ? activeSpin.eligiblePlayerIds
        .map((id) => players.find((p) => p.id === id))
        .filter((p): p is Player => Boolean(p))
    : baseEligiblePlayers;
  const eliminatedPlayers = activeSpin
    ? players.filter((p) => !activeSpin.eligiblePlayerIds.includes(p.id))
    : players.filter((p) => hotseatHistory.includes(p.id));

  const displayEligiblePlayers = spinEligiblePlayers.length > 0 ? spinEligiblePlayers : baseEligiblePlayers;
  const targetIndex = activeSpin
    ? spinEligiblePlayers.findIndex((p) => p.id === activeSpin.targetPlayerId)
    : -1;

  const currentPlayer = displayEligiblePlayers[displayedIndex] || displayEligiblePlayers[0];

  // Particle explosion effect
  const createParticles = useCallback(() => {
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'];
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1000);
  }, []);

  // Kick off a synchronized spin when we receive a target player
  useEffect(() => {
    if (!activeSpin || targetIndex === -1 || spinEligiblePlayers.length === 0) return;
    if (activeSpin.targetPlayerId === activeSpinIdRef.current) return;

    activeSpinIdRef.current = activeSpin.targetPlayerId;
    hasCompletedRef.current = false;

    const startIndex = Math.floor(Math.random() * spinEligiblePlayers.length);
    displayedIndexRef.current = startIndex;
    setDisplayedIndex(startIndex);
    setPhase('spinning');
  }, [activeSpin, spinEligiblePlayers.length, targetIndex]);

  // Reset state when spin completes
  useEffect(() => {
    if (!activeSpin && phase !== 'idle') {
      setPhase('idle');
      activeSpinIdRef.current = null;
      displayedIndexRef.current = 0;
      setDisplayedIndex(0);
    }
  }, [activeSpin, phase]);

  // Spinning animation that lands on the server-selected player
  useEffect(() => {
    if (phase !== 'spinning' || !activeSpin || targetIndex === -1 || spinEligiblePlayers.length === 0) {
      return;
    }

    let currentIndex = displayedIndexRef.current;
    let steps = 0;
    const loops = spinEligiblePlayers.length * 2;
    const offsetToTarget =
      (targetIndex - currentIndex + spinEligiblePlayers.length) % spinEligiblePlayers.length;
    const totalSteps = loops + offsetToTarget;
    let delay = 70;
    let timeout: NodeJS.Timeout;

    const tick = () => {
      currentIndex = (currentIndex + 1) % spinEligiblePlayers.length;
      displayedIndexRef.current = currentIndex;
      setDisplayedIndex(currentIndex);
      steps++;

      if (steps < totalSteps) {
        if (steps > spinEligiblePlayers.length) {
          delay = Math.min(delay * 1.08, 400);
        }
        timeout = setTimeout(tick, delay);
        return;
      }

      setPhase('reveal');
      createParticles();
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        setTimeout(() => {
          onSpinComplete();
        }, 900);
      }
    };

    timeout = setTimeout(tick, delay);
    return () => clearTimeout(timeout);
  }, [phase, activeSpin, spinEligiblePlayers.length, targetIndex, createParticles, onSpinComplete]);

  const handleSpin = () => {
    if (isLoading || activeSpin || displayEligiblePlayers.length === 0) return;
    onSpin();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 rounded-full animate-ping"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            animationDuration: '1s',
          }}
        />
      ))}

      <div className="w-full max-w-md text-center relative z-10">
        {/* Title */}
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 mb-2 tracking-tight">
          WHEEL OF FATE
        </h1>
        <p className="text-purple-300 mb-8 text-sm">
          {displayEligiblePlayers.length} player{displayEligiblePlayers.length !== 1 ? 's' : ''} remaining
        </p>

        {/* Main display - the "slot machine" */}
        <div className="relative mb-8">
          {/* Glow effect */}
          <div className={`absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl blur-xl transition-opacity duration-300 ${phase !== 'idle' ? 'opacity-60' : 'opacity-30'}`} />

          {/* Display box */}
          <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-2xl border-2 border-purple-500/50 p-8 overflow-hidden">
            {/* Scan line effect */}
            {phase === 'spinning' && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent animate-scan" />
            )}

            {/* The name display */}
            <div className={`transition-all duration-100 ${phase === 'spinning' ? 'scale-95' : 'scale-100'}`}>
              {displayEligiblePlayers.length > 0 ? (
                <span
                  className={`text-4xl font-black transition-all ${
                    phase === 'reveal'
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500 scale-110'
                      : 'text-white'
                  }`}
                >
                  {currentPlayer?.display_name || '???'}
                </span>
              ) : (
                <span className="text-2xl text-purple-400">Everyone&apos;s had a turn!</span>
              )}
            </div>

            {/* Decorative corners */}
            <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-purple-400" />
            <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-purple-400" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-purple-400" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-purple-400" />
          </div>
        </div>

        {/* Eligible players - the "remaining" pool */}
        <div className="mb-6">
          <p className="text-xs text-purple-400 uppercase tracking-widest mb-3">Still in the game</p>
          <div className="flex flex-wrap justify-center gap-2">
            {displayEligiblePlayers.map((player) => (
              <span
                key={player.id}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  phase !== 'idle' && currentPlayer?.id === player.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white scale-110 shadow-lg shadow-pink-500/50'
                    : 'bg-slate-700/50 text-purple-200 border border-purple-500/30'
                }`}
              >
                {player.display_name}
              </span>
            ))}
          </div>
        </div>

        {/* Eliminated players */}
        {eliminatedPlayers.length > 0 && (
          <div className="mb-8">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Already chosen</p>
            <div className="flex flex-wrap justify-center gap-2">
              {eliminatedPlayers.map((player) => (
                <span
                  key={player.id}
                  className="px-3 py-1.5 rounded-full text-sm bg-slate-800/50 text-slate-500 line-through"
                >
                  {player.display_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Spin Button */}
        {isHost && displayEligiblePlayers.length > 0 && (
          <button
            onClick={handleSpin}
            disabled={isLoading || activeSpin !== null}
            className={`
              relative w-full py-5 px-8 rounded-2xl font-black text-xl uppercase tracking-wider
              transition-all duration-300 transform
              ${activeSpin === null && !isLoading
                ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 text-white hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 active:scale-95'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }
              bg-[length:200%_100%] animate-gradient
            `}
          >
            {/* Button glow */}
            {activeSpin === null && !isLoading && (
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl blur-xl opacity-50 -z-10" />
            )}

            {activeSpin ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⚡</span>
                CHOOSING...
              </span>
            ) : phase === 'reveal' ? (
              'SELECTED!'
            ) : isLoading ? (
              'LOADING...'
            ) : (
              <span className="flex items-center justify-center gap-2">
                🎰 SPIN THE WHEEL
              </span>
            )}
          </button>
        )}

        {!isHost && (
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-purple-500/30">
            <p className="text-purple-300">
              {phase !== 'idle' ? '🎰 Spinning...' : 'Waiting for host to spin...'}
            </p>
          </div>
        )}
      </div>

      {/* Add keyframe animations */}
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scan {
          animation: scan 0.5s linear infinite;
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionId } from '@/lib/session';

export default function Home() {
  const router = useRouter();
  const games = useMemo(
    () => [
      { id: 'assumptions', name: 'Assumptions', tag: 'Hot seat guessing' },
      { id: 'imposter', name: 'Guess the Imposter', tag: 'Find the faker' },
    ],
    []
  );

  const [selectedGame, setSelectedGame] = useState<{ id: string; name: string } | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [precreatedRoomCode, setPrecreatedRoomCode] = useState<string | null>(null);
  const [precreatedGameId, setPrecreatedGameId] = useState<string | null>(null);
  const isPrecreating = useRef(false);

  const goatCurtain = useMemo(
    () =>
      Array.from({ length: 500 }, (_, i) => ({
        left: `${(i * 7 + 11 * (i % 5)) % 100}%`,
        delay: `${(i % 40) * 0.05}s`,
        duration: `${2.5 + (i % 6) * 0.4}s`,
        size: 20 + (i % 10) * 4,
        top: `-${5 + (i % 50)}vh`,
        id: i,
      })),
    []
  );

  // Pre-create a room to make hosting instant
  useEffect(() => {
    if (!displayName.trim() || isPrecreating.current || !selectedGame) return;
    if (precreatedRoomCode && precreatedGameId === selectedGame.id) return;

    let cancelled = false;
    isPrecreating.current = true;

    (async () => {
      try {
        const sessionId = getSessionId();
        const endpoint =
          selectedGame.id === 'imposter' ? '/api/imposter/rooms' : '/api/rooms';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: displayName.trim(),
            sessionId,
            gameType: selectedGame.id === 'imposter' ? 'IMPOSTER' : 'ASSUMPTIONS',
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to precreate room');
        if (!cancelled) {
          setPrecreatedRoomCode(data.room.code);
          setPrecreatedGameId(selectedGame.id);
        }
      } catch (err) {
        console.error('Precreate room failed', err);
      } finally {
        isPrecreating.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [displayName, precreatedRoomCode, precreatedGameId, selectedGame]);

  const handleCreate = async () => {
    if (!displayName.trim()) {
      setError('Add your name to host');
      return;
    }
    if (!selectedGame) {
      setError('Pick a game to host');
      return;
    }
    setIsTransitioning(true);
    setError('');
    // Use pre-created room for instant navigation
    if (precreatedRoomCode && precreatedGameId === selectedGame.id) {
      router.push(
        selectedGame.id === 'imposter'
          ? `/imposter/room/${precreatedRoomCode}`
          : `/room/${precreatedRoomCode}`
      );
      return;
    }
    setIsLoading(true);

    try {
      const sessionId = getSessionId();
      const endpoint =
        selectedGame.id === 'imposter' ? '/api/imposter/rooms' : '/api/rooms';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          sessionId,
          gameType: selectedGame.id === 'imposter' ? 'IMPOSTER' : 'ASSUMPTIONS',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create room');
      if (data.room && data.player && selectedGame.id !== 'imposter') {
        localStorage.setItem(
          `pregame_room_seed_${data.room.code}`,
          JSON.stringify({
            room: data.room,
            players: [data.player],
            assignments: [],
            ts: Date.now(),
          })
        );
      }
      router.push(
        selectedGame.id === 'imposter'
          ? `/imposter/room/${data.room.code}`
          : `/room/${data.room.code}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsTransitioning(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!displayName.trim()) {
      setError('Add your name to join');
      return;
    }
    if (!selectedGame) {
      setError('Pick a game to join');
      return;
    }
    if (!roomCode.trim()) {
      setError('Enter a room code to join');
      return;
    }
    setIsTransitioning(true);
    setIsLoading(true);
    setError('');

    try {
      const sessionId = getSessionId();
      const endpoint =
        selectedGame.id === 'imposter'
          ? `/api/imposter/rooms/${roomCode.toUpperCase()}/join`
          : `/api/rooms/${roomCode.toUpperCase()}/join`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim(), sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join room');
      if (data.room && data.player && data.players && selectedGame.id !== 'imposter') {
        localStorage.setItem(
          `pregame_room_seed_${data.room.code}`,
          JSON.stringify({
            room: data.room,
            players: data.players,
            assignments: data.assignments || [],
            ts: Date.now(),
          })
        );
      }
      router.push(
        selectedGame.id === 'imposter'
          ? `/imposter/room/${data.room.code}`
          : `/room/${data.room.code}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsTransitioning(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-50 animate-gradient-bg blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col px-4 py-6 gap-6 max-w-5xl w-full mx-auto">
        {isTransitioning && (
          <div className="fixed inset-0 z-50 pointer-events-auto overflow-hidden bg-black/70 backdrop-blur-sm">
            <style jsx global>{`
              @keyframes goatFallSpin {
                0% {
                  transform: translateY(-140vh) rotate(0deg);
                }
                100% {
                  transform: translateY(140vh) rotate(1440deg);
                }
              }
            `}</style>
            {goatCurtain.map((goat) => (
              <div
                key={goat.id}
                className="absolute z-20"
                style={{
                  left: goat.left,
                  top: goat.top,
                  fontSize: `${goat.size}px`,
                  animation: `goatFallSpin ${goat.duration} linear infinite`,
                  animationDelay: goat.delay,
                  filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.45))',
                }}
                aria-hidden
              >
                🐐
              </div>
            ))}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
              <div className="text-white text-xl font-bold">Loading your room...</div>
              <div className="text-slate-300 text-sm">Goats are working overtime</div>
            </div>
          </div>
        )}
        {!isTransitioning && (
          <>
            <header className="text-center space-y-2">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">pregame.lol</div>
              <h1 className="text-4xl font-black text-white leading-tight">goated party games</h1>
              <p className="text-slate-300 text-base">Play in person. Built for phones. No accounts.</p>
              <div className="flex justify-center">
                <Link
                  href="/how-to-play"
                  className="inline-flex items-center gap-2 text-sm text-slate-200 border border-white/15 bg-white/5 rounded-full px-4 py-2 hover:bg-white/10 transition"
                >
                  How to play each game
                  <span className="text-lg">{"->"}</span>
                </Link>
              </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {games.map((game) => (
                <button
                  key={game.id}
                  className="h-full text-left rounded-3xl p-5 neon-card border border-white/10 flex flex-col gap-3 tap-pop"
                  onClick={() => {
                    setSelectedGame(game);
                    setError('');
                    setJoining(false);
                    setRoomCode('');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-white text-2xl font-bold">{game.name}</div>
                    <div className="text-slate-200 text-xs px-3 py-1 rounded-full bg-white/5">Tap to play</div>
                  </div>
                  <div className="text-slate-300 text-sm leading-relaxed">
                    {game.id === 'assumptions'
                      ? 'One player answers as someone else. Everyone votes who they were pretending to be.'
                      : 'One player has no idea what’s going on. Drag them, roast them, vote them out.'}
                  </div>
                  <div className="text-slate-400 text-sm">{game.tag}</div>
                </button>
              ))}
            </section>

            {selectedGame && (
              <div className="neon-card rounded-3xl p-5 border border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Selected game</div>
                    <div className="text-white text-2xl font-black">{selectedGame.name}</div>
                  </div>
                  <button
                    className="text-slate-400 text-sm hover:text-white"
                    onClick={() => {
                      setSelectedGame(null);
                      setRoomCode('');
                      setError('');
                      setJoining(false);
                    }}
                  >
                    Close
                  </button>
                </div>
                <p className="text-slate-300 text-sm">How do you want to play?</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    maxLength={20}
                    className="w-full px-4 py-4 rounded-2xl bg-white/10 text-white placeholder-slate-400 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400 tap-pop"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={isLoading}
                    className="flex-1 py-4 rounded-2xl text-lg font-extrabold text-slate-900 tap-pop animate-gradient-bg disabled:opacity-60"
                  >
                    {isLoading ? 'Starting...' : 'Host a room'}
                  </button>
                  <button
                    onClick={() => {
                      setJoining(true);
                      setError('');
                    }}
                    className="flex-1 py-4 rounded-2xl text-lg font-extrabold text-white bg-white/5 border border-white/10 tap-pop"
                  >
                    Join a room
                  </button>
                </div>
                {joining && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      placeholder="ROOM CODE"
                      maxLength={6}
                      className="w-full px-4 py-4 rounded-2xl bg-white/10 text-white placeholder-slate-400 text-2xl font-mono tracking-[0.35em] text-center focus:outline-none focus:ring-2 focus:ring-cyan-400 tap-pop"
                    />
                    {error && <p className="text-orange-300 text-sm">{error}</p>}
                    <button
                      onClick={handleJoin}
                      disabled={isLoading}
                      className="w-full py-4 rounded-2xl text-lg font-extrabold text-slate-900 tap-pop animate-gradient-bg shadow-lg shadow-cyan-500/30 disabled:opacity-60"
                    >
                      {isLoading ? 'Joining...' : 'Join room'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <footer className="text-center text-slate-400 text-sm mt-auto">
              3–20 players • Mobile-first • Play together in person
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

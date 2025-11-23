'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionId } from '@/lib/session';

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [displayName, setDisplayName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const sessionId = getSessionId();
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim(), sessionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      router.push(`/room/${data.room.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const sessionId = getSessionId();
      const res = await fetch(`/api/rooms/${roomCode.toUpperCase()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim(), sessionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join room');
      }

      router.push(`/room/${data.room.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-purple-900 to-indigo-900">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">Assumptions</h1>
          <p className="text-purple-300">
            Kahoot meets Jackbox for friends
          </p>
        </div>

        {mode === 'home' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full py-4 px-6 rounded-xl font-semibold text-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90 transition-opacity"
            >
              Create Room
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full py-4 px-6 rounded-xl font-semibold text-lg bg-white/10 backdrop-blur text-white hover:bg-white/20 transition-colors"
            >
              Join Room
            </button>
          </div>
        )}

        {(mode === 'create' || mode === 'join') && (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
            <button
              onClick={() => {
                setMode('home');
                setError('');
              }}
              className="text-purple-300 hover:text-white mb-4"
            >
              &larr; Back
            </button>

            <h2 className="text-xl font-semibold text-white mb-4">
              {mode === 'create' ? 'Create a Room' : 'Join a Room'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-purple-300 text-sm mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {mode === 'join' && (
                <div>
                  <label className="block text-purple-300 text-sm mb-2">
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="ABCDEF"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-center text-xl tracking-widest"
                  />
                </div>
              )}

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <button
                onClick={mode === 'create' ? handleCreate : handleJoin}
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-xl font-semibold text-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoading
                  ? 'Loading...'
                  : mode === 'create'
                  ? 'Create Room'
                  : 'Join Room'}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-purple-400 text-sm mt-8">
          3-20 players | Mobile-first | No accounts needed
        </p>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ImposterPhase, ImposterRoundResult, ImposterVote, Player, Room } from '@/types';
import { IMPOSTER_TOPICS } from '@/lib/imposter/constants';
import { getSessionId } from '@/lib/session';
import { subscribeToImposterRoom, unsubscribeFromRoom } from '@/lib/realtime';
import { AvatarChip } from '@/components/AvatarChip';

const topicList = Object.keys(IMPOSTER_TOPICS);

export default function ImposterRoomPage() {
  const params = useParams();
  const code = params.code as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [votes, setVotes] = useState<ImposterVote[]>([]);
  const [roundResult, setRoundResult] = useState<ImposterRoundResult | null>(null);
  const [topicChoice, setTopicChoice] = useState<string>(topicList[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasVoted, setHasVoted] = useState(false);

  const currentPlayer = useMemo(() => {
    const sessionId = getSessionId();
    return players.find((p) => p.session_id === sessionId) || null;
  }, [players]);

  const isHost = currentPlayer?.is_host ?? false;
  const isImposter = currentPlayer?.role === 'IMPOSTER';

  const fetchRoom = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/imposter/rooms/${code}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load room');
      setRoom(data.room);
      setPlayers(data.players || []);
      setVotes(data.votes || []);
      if (data.roundResult) setRoundResult(data.roundResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load room');
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchRoom();
    const unsubscribe = subscribeToImposterRoom(code, {
      onRoomUpdate: (updated) => setRoom(updated),
      onPlayersUpdate: (updated) => setPlayers(updated),
      onVotesUpdate: (updated) => setVotes(updated),
      onRoundResult: (result) => setRoundResult(result),
      onError: (err) => console.error(err),
    });
    return () => {
      unsubscribe();
      unsubscribeFromRoom();
    };
  }, [code, fetchRoom]);

  useEffect(() => {
    if (room?.state === 'VOTING') {
      setHasVoted(false);
    }
  }, [room?.state]);

  useEffect(() => {
    if (!room) return;
    setVotes([]);
    setRoundResult(null);
    setHasVoted(false);
  }, [room]);

  const perform = async (endpoint: string, body: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      if (data.room) setRoom(data.room);
      if (data.players) setPlayers(data.players);
      if (data.votes) setVotes(data.votes);
      if (data.roundResult) setRoundResult(data.roundResult);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
      return null;
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    const sessionId = getSessionId();
    const res = await perform(`/api/imposter/rooms/${code}/start`, { sessionId, topic: topicChoice });
    if (res) {
      setVotes([]);
      setRoundResult(null);
      setHasVoted(false);
    }
  };

  const handleAdvance = async (to: ImposterPhase) => {
    const sessionId = getSessionId();
    await perform(`/api/imposter/rooms/${code}/advance`, { sessionId, to });
  };

  const handleVote = async (targetId: string) => {
    const sessionId = getSessionId();
    const res = await perform(`/api/imposter/rooms/${code}/vote`, { sessionId, targetId });
    if (res) setHasVoted(true);
  };

  const renderTopNav = () => (
    <div className="fixed top-3 left-0 right-0 flex justify-center z-30 pointer-events-none">
      <div className="flex gap-2 pointer-events-auto">
        <Link
          href="/"
          className="px-3 py-2 rounded-full text-sm font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/15 transition"
        >
          {"<-"} Home
        </Link>
        <Link
          href="/"
          className="px-3 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 text-black shadow-md hover:scale-[1.01] transition"
        >
          Start a new game
        </Link>
      </div>
    </div>
  );

  const renderGoatLoader = () => (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center animate-spin text-3xl">{"🐐"}</div>
        <div className="text-white text-xl font-bold">Loading...</div>
        <div className="text-slate-400 text-sm">Getting you into the room</div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black relative">
        {renderTopNav()}
        {renderGoatLoader()}
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-slate-900 to-black">
        <div className="text-red-400 text-xl mb-4">{error || 'Room not found'}</div>
        <Link href="/" className="text-slate-200 hover:text-white">
          {"<-"} Back to home
        </Link>
      </div>
    );
  }

  const renderLobby = () => (
    <div className="min-h-screen flex flex-col gap-6 px-4 py-6 max-w-4xl mx-auto">
      <div className="neon-card rounded-3xl p-5 border border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Room</p>
            <div className="text-3xl font-black text-white tracking-[0.3em] font-mono">{room.code}</div>
            <p className="text-slate-400 text-sm mt-1">Share this code.</p>
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
          <div className="text-xs text-slate-300">Roles are dealt at start</div>
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

      <div className="neon-card rounded-3xl p-5 border border-white/10 flex flex-col gap-3">
        {isHost ? (
          <>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Topic</p>
                <p className="text-white text-lg font-semibold">Pick the category</p>
              </div>
              <select
                value={topicChoice}
                onChange={(e) => setTopicChoice(e.target.value)}
                className="px-4 py-3 rounded-2xl bg-white/10 text-white border border-white/15"
              >
                {topicList.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleStart}
              disabled={players.length < 3 || actionLoading}
              className="w-full py-4 rounded-2xl text-lg font-extrabold text-slate-900 tap-pop animate-gradient-bg disabled:opacity-60"
            >
              {actionLoading ? 'Starting...' : 'Start the game'}
            </button>
            {players.length < 3 && (
              <p className="text-orange-300 text-sm text-center">Need at least 3 players</p>
            )}
          </>
        ) : (
          <div className="text-center text-slate-200 text-base">
            Waiting for host to pick a topic and start.
          </div>
        )}
      </div>
    </div>
  );

  const renderSecretReveal = () => (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 gap-4">
      <div className="neon-card rounded-3xl p-6 border border-white/10 max-w-xl w-full text-center space-y-4">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Topic</div>
        <div className="text-3xl font-black text-white">{room.topic}</div>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          {isImposter ? (
            <div className="space-y-2">
              <p className="text-xl font-bold text-amber-300">You are an Imposter.</p>
              <p className="text-slate-200">You only know the topic. Blend in.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Secret word</p>
              <p className="text-3xl font-black text-white">{room.secret_word}</p>
            </div>
          )}
        </div>
        {isHost && (
          <button
            onClick={() => handleAdvance('VOTING')}
            disabled={actionLoading}
            className="w-full py-4 rounded-2xl text-lg font-extrabold text-slate-900 tap-pop animate-gradient-bg disabled:opacity-60"
          >
            {actionLoading ? 'Moving...' : 'Start voting'}
          </button>
        )}
      </div>
    </div>
  );

  const renderVoting = () => (
    <div className="min-h-screen flex flex-col gap-4 px-4 py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white">Vote the imposter</h1>
        <div className="text-slate-300 text-sm">
          {votes.length}/{players.length} votes in
        </div>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => handleVote(player.id)}
            disabled={player.id === currentPlayer?.id || actionLoading}
            className={`rounded-2xl p-4 border border-white/10 text-left bg-white/5 hover:bg-white/10 transition ${
              votes.find((v) => v.voter_id === currentPlayer?.id)?.target_id === player.id
                ? 'ring-2 ring-amber-400'
                : ''
            } ${player.id === currentPlayer?.id ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className="text-white font-semibold">{player.display_name}</div>
            {player.id === currentPlayer?.id && (
              <div className="text-xs text-slate-400">You can&apos;t vote yourself</div>
            )}
          </button>
        ))}
      </div>
      {hasVoted && <div className="text-emerald-300 text-sm">Vote locked in.</div>}
    </div>
  );

  const renderReveal = () => {
    const imposters =
      roundResult?.imposterIds?.map((id) => players.find((p) => p.id === id)?.display_name).filter(Boolean) || [];
    return (
      <div className="min-h-screen flex flex-col gap-4 px-4 py-6 max-w-4xl mx-auto">
        <div className="neon-card rounded-3xl p-6 border border-white/10 text-center space-y-4">
          <h1 className="text-3xl font-black text-white">Round results</h1>
          <p className="text-slate-200 text-lg">
            Imposter: <span className="font-bold text-white">{imposters.join(', ') || 'Unknown'}</span>
          </p>
          <div className="text-slate-300 text-sm">
            Correct votes: {roundResult?.correctVoterIds?.length || 0} • Fooled: {roundResult?.incorrectVoterIds?.length || 0}
          </div>
          {isHost && (
            <div className="flex flex-col gap-2 items-center">
              <select
                value={topicChoice}
                onChange={(e) => setTopicChoice(e.target.value)}
                className="px-4 py-3 rounded-2xl bg-white/10 text-white border border-white/15"
              >
                {topicList.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStart}
                disabled={actionLoading}
                className="w-full md:w-auto px-6 py-3 rounded-2xl text-lg font-extrabold text-slate-900 tap-pop animate-gradient-bg disabled:opacity-60"
              >
                {actionLoading ? 'Starting...' : 'Next round'}
              </button>
            </div>
          )}
        </div>

        <div className="neon-card rounded-3xl p-5 border border-white/10">
          <h2 className="text-white font-bold mb-3">Votes</h2>
          <div className="space-y-2">
            {votes.map((vote) => {
              const voter = players.find((p) => p.id === vote.voter_id);
              const target = players.find((p) => p.id === vote.target_id);
              return (
                <div key={vote.id} className="flex items-center justify-between text-slate-200">
                  <span>{voter?.display_name}</span>
                  <span className="text-slate-400 text-sm">voted</span>
                  <span className="font-semibold">{target?.display_name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="neon-card rounded-3xl p-5 border border-white/10">
          <h2 className="text-white font-bold mb-3">Status</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="p-3 rounded-2xl border border-white/10"
              >
                <div className="text-white font-semibold">{player.display_name}</div>
                <div className="text-xs text-slate-400">
                  {player.role || 'Unknown'} • Score: {player.score ?? 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  switch (room.state as ImposterPhase) {
    case 'LOBBY':
      return (
        <>
          {renderTopNav()}
          {renderLobby()}
        </>
      );
    case 'SECRET_REVEAL':
      return (
        <>
          {renderTopNav()}
          {renderSecretReveal()}
        </>
      );
    case 'VOTING':
      return (
        <>
          {renderTopNav()}
          {renderVoting()}
        </>
      );
    case 'REVEAL':
      return (
        <>
          {renderTopNav()}
          {renderReveal()}
        </>
      );
    default:
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-black">
          {renderTopNav()}
          <div className="text-white text-xl">Waiting for host...</div>
        </div>
      );
  }
}

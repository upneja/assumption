'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getSessionId } from '@/lib/session';
import { subscribeToRoom, unsubscribeFromRoom } from '@/lib/realtime';
import { canStartGame } from '@/lib/gameEngine';
import { LobbyView } from '@/components/LobbyView';
import { IntroView } from '@/components/IntroView';
import { WheelView } from '@/components/WheelView';
import { HotseatView } from '@/components/HotseatView';
import { VotingView } from '@/components/VotingView';
import { RevealView } from '@/components/RevealView';
import { ScoreboardView } from '@/components/ScoreboardView';
import { CompleteView } from '@/components/CompleteView';
import type { Room, Player, Assignment, Vote } from '@/types';

export default function RoomPage() {
  const params = useParams();
  const code = params.code as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [voteResults, setVoteResults] = useState<{
    votes: Vote[];
    correctVoterIds: string[];
    incorrectVoterIds: string[];
    actualTargetId: string;
  } | null>(null);
  const [activeWheelSpin, setActiveWheelSpin] = useState<{
    hotseatPlayerId: string;
    previousHistory: string[];
  } | null>(null);

  // Fetch room state
  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${code}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load room');
      }

      setRoom(data.room);
      setPlayers(data.players);
      setAssignments(data.assignments || []);

      // Find current player
      const sessionId = getSessionId();
      const player = data.players.find((p: Player) => p.session_id === sessionId);
      setCurrentPlayer(player || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load room');
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  // Seed state from locally cached room (fast entry for host/join)
  useEffect(() => {
    const seedRaw =
      typeof window !== 'undefined'
        ? localStorage.getItem(`pregame_room_seed_${code}`)
        : null;
    if (!seedRaw) return;
    try {
      const seed = JSON.parse(seedRaw) as {
        room?: Room;
        players?: Player[];
        assignments?: Assignment[];
        ts?: number;
      };
      if (!seed.room || !seed.players) return;
      setRoom(seed.room);
      setPlayers(seed.players);
      setAssignments(seed.assignments || []);
      const sessionId = getSessionId();
      const player = seed.players.find((p) => p.session_id === sessionId);
      setCurrentPlayer(player || null);
      setIsLoading(false);
    } catch (e) {
      console.warn('Failed to read room seed', e);
    }
  }, [code]);

  // Initial load and realtime subscription
  useEffect(() => {
    fetchRoom();

    const unsubscribe = subscribeToRoom(code, {
      onRoomUpdate: (updatedRoom) => {
        setRoom(updatedRoom);
        // Reset vote state when entering voting phase
        if (updatedRoom.state === 'VOTING') {
          setHasVoted(false);
        }
      },
      onPlayersUpdate: (updatedPlayers) => {
        setPlayers(updatedPlayers);
        // Update current player
        const sessionId = getSessionId();
        const player = updatedPlayers.find((p) => p.session_id === sessionId);
        setCurrentPlayer(player || null);
      },
      onAssignmentsUpdate: (updatedAssignments) => {
        setAssignments(updatedAssignments);
      },
      onWheelSpin: (spin) => {
        setActiveWheelSpin({
          hotseatPlayerId: spin.hotseatPlayerId,
          previousHistory: spin.previousHistory,
        });
      },
      onError: (err) => {
        console.error('Realtime error:', err);
      },
    });

    return () => {
      unsubscribe();
      unsubscribeFromRoom();
    };
  }, [code, fetchRoom]);

  // API action helper
  const performAction = async (
    endpoint: string,
    options?: {
      onSuccess?: (data: Record<string, unknown>) => void;
    }
  ) => {
    setActionLoading(true);
    try {
      const sessionId = getSessionId();
      const res = await fetch(`/api/rooms/${code}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Action failed');
      }

      // Update local state
      if (data.room) setRoom(data.room);
      if (data.players) setPlayers(data.players);
      if (data.assignments) setAssignments(data.assignments);
      if (data.voteResults) setVoteResults(data.voteResults);
      options?.onSuccess?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Action handlers
  const handleStart = () => performAction('start');
  const handleSpin = () => {
    const previousHistory = room?.hotseat_history || [];
    performAction('spin', {
      onSuccess: (data) => {
        if (
          data &&
          typeof data === 'object' &&
          'hotseatPlayer' in data &&
          (data as { hotseatPlayer?: { id?: string } }).hotseatPlayer?.id
        ) {
          const hotseatPlayerId = (data as { hotseatPlayer: { id: string } }).hotseatPlayer.id;
          setActiveWheelSpin({ hotseatPlayerId, previousHistory });
        }
      },
    });
  };
  const handleNext = () => performAction('next');

  // Vote handler
  const handleVote = async (guessedTargetId: string) => {
    setActionLoading(true);
    try {
      const sessionId = getSessionId();
      const res = await fetch(`/api/rooms/${code}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, guessedTargetId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit vote');
      }

      setHasVoted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to vote');
    } finally {
      setActionLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Error state
  if (error || !room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-purple-900 to-indigo-900">
        <div className="text-red-400 text-xl mb-4">{error || 'Room not found'}</div>
        <Link
          href="/"
          className="text-purple-300 hover:text-white"
        >
          &larr; Back to home
        </Link>
      </div>
    );
  }

  const isHost = currentPlayer?.is_host ?? false;
  const showWheel = room.state === 'WHEEL' || activeWheelSpin !== null;
  const wheelSpinPayload = activeWheelSpin
    ? {
        targetPlayerId: activeWheelSpin.hotseatPlayerId,
        eligiblePlayerIds: players
          .filter((p) => !(activeWheelSpin.previousHistory || []).includes(p.id))
          .map((p) => p.id),
      }
    : null;
  const { canStart, reason: startReason } = canStartGame(players);

  // Find current player's assignment
  const currentAssignment = assignments.find(
    (a) => a.giver_player_id === currentPlayer?.id
  ) || null;

  // Find hotseat player
  const hotseatPlayer = room.hotseat_player_id
    ? players.find((p) => p.id === room.hotseat_player_id) || null
    : null;

  // Find hotseat player's assignment (who they're answering about)
  const hotseatAssignment = room.hotseat_player_id
    ? assignments.find((a) => a.giver_player_id === room.hotseat_player_id) || null
    : null;

  if (showWheel) {
    return (
      <WheelView
        players={players}
        hotseatHistory={room.hotseat_history || []}
        isHost={isHost}
        onSpin={handleSpin}
        isLoading={actionLoading}
        activeSpin={wheelSpinPayload}
        onSpinComplete={() => setActiveWheelSpin(null)}
      />
    );
  }

  // Render based on game phase
  switch (room.state) {
    case 'LOBBY':
      return (
        <LobbyView
          roomCode={room.code}
          players={players}
          isHost={isHost}
          canStart={canStart}
          startReason={startReason}
          onStart={handleStart}
          isLoading={actionLoading}
        />
      );

    case 'ASSIGNMENT':
      // This is a transitional state, show loading
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-purple-900">
          <div className="text-white text-xl">Creating assignments...</div>
        </div>
      );

    case 'INTRO':
      return (
        <IntroView
          players={players}
          currentPlayer={currentPlayer}
          assignment={currentAssignment}
          isHost={isHost}
          onContinue={handleNext}
          isLoading={actionLoading}
        />
      );

    case 'HOTSEAT':
      return (
        <HotseatView
          hotseatPlayer={hotseatPlayer}
          hotseatAssignment={hotseatAssignment}
          players={players}
          currentPlayer={currentPlayer}
          isHost={isHost}
          onComplete={handleNext}
          isLoading={actionLoading}
        />
      );

    case 'VOTING':
      return (
        <VotingView
          hotseatPlayer={hotseatPlayer}
          players={players}
          currentPlayer={currentPlayer}
          isHost={isHost}
          onVote={handleVote}
          onContinue={handleNext}
          hasVoted={hasVoted}
          isLoading={actionLoading}
        />
      );

    case 'REVEAL':
      return (
        <RevealView
          hotseatPlayer={hotseatPlayer}
          hotseatAssignment={hotseatAssignment}
          players={players}
          currentPlayer={currentPlayer}
          voteResults={voteResults}
          isHost={isHost}
          onContinue={handleNext}
          isLoading={actionLoading}
        />
      );

    case 'SCOREBOARD':
      return (
        <ScoreboardView
          players={players}
          hotseatHistory={room.hotseat_history || []}
          lastHotseatPlayer={hotseatPlayer}
          isHost={isHost}
          onContinue={handleNext}
          isLoading={actionLoading}
        />
      );

    case 'COMPLETE':
      return <CompleteView players={players} />;

    default:
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900">
          <div className="text-white text-xl">Unknown game state: {room.state}</div>
        </div>
      );
  }
}

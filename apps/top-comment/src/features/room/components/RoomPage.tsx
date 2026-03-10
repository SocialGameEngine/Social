import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../../../hooks/useRoom';
import { useSession } from '../../session/hooks';
import { RoomPageProvider } from '../context/RoomPageContext';
import { useAuth } from '../../../shared/providers/AuthContext';
import { RoomPageContent } from './RoomPageContent';
import { RoomPageLoading } from './RoomPageLoading';

export function RoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, signInAnonymously } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const { room, memberships, isLoading: roomLoading, error: roomError } = useRoom({
    roomCode,
  });

  const { session } = useSession(sessionId || undefined);

  // Auto sign-in as guest if not authenticated (handles direct link / incognito)
  useEffect(() => {
    if (!authLoading && !user) {
      signInAnonymously().catch((err) =>
        console.error("Auto guest sign-in failed:", err)
      );
    }
  }, [authLoading, user, signInAnonymously]);

  // Get sessionId from room when it updates
  useEffect(() => {
    if (room?.currentSessionId && room.currentSessionId !== sessionId) {
      setSessionId(room.currentSessionId);
    }
  }, [room?.currentSessionId, sessionId]);

  // Check if user has a membership in this room
  const myMembership = user ? memberships.find(m => m.userId === user.id) : null;
  const isHost = room?.hostUid === user?.id;
  const hasMembership = !!myMembership || isHost;

  if (authLoading || roomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-pulse">Loading room...</div>
      </div>
    );
  }

  if (roomError || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Room Not Found</h1>
          <p className="text-slate-400">The room code "{roomCode}" doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Always render the provider - let the child components handle membership checks
  return (
    <RoomPageProvider
      room={room}
      memberships={memberships}
      session={session}
      sessionId={sessionId}
    >
      {hasMembership ? <RoomPageContent /> : <RoomPageLoading />}
    </RoomPageProvider>
  );
}

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRoom } from '../../../hooks/useRoom';
import { useSession } from '../../session/hooks';
import { RoomPageProvider } from '../context/RoomPageContext';
import { useAuth } from '../../../shared/providers/AuthContext';
import { RoomPageContent } from './index';

export function RoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { loading: authLoading } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const { room, memberships, isLoading: roomLoading, error: roomError } = useRoom({
    roomCode,
  });

  const { session } = useSession(sessionId || undefined);

  // Get sessionId from room when it updates
  useEffect(() => {
    console.log('🏠 Room updated:', { roomId: room?.id, roomSessionId: room?.currentSessionId, localSessionId: sessionId });
    if (room?.currentSessionId && room.currentSessionId !== sessionId) {
      console.log('🔄 Updating sessionId from', sessionId, 'to', room.currentSessionId);
      setSessionId(room.currentSessionId);
    }
  }, [room, sessionId]); // Fixed: include entire room object instead of just currentSessionId

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

  // Always render the provider - let RoomPageContent handle membership checks
  return (
    <RoomPageProvider
      room={room}
      memberships={memberships}
      session={session}
      sessionId={sessionId}
    >
      <RoomPageContent />
    </RoomPageProvider>
  );
}

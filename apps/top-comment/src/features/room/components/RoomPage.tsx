import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRoomV2 } from '../../../hooks/useRoomV2';
import { useSession } from '../../session/hooks-v2';
import { RoomPageProvider } from '../context/RoomPageContext';
import { useAuth } from '../../../shared/providers/AuthContext';
import { usePlayerAccountResolver } from '../../player/usePlayerAccountResolver';
import { RoomPageContent } from './index';
import { PlayerAuthModal } from '../../auth/PlayerAuthModal';
import { VenueAuthModal } from '../../auth/VenueAuthModal';
import { RoomSkeleton } from '../../../shared/components/skeletons/RoomSkeleton';
import { ErrorState } from '../../../shared/components/ErrorState';
import { AsyncErrorBoundary } from '../../../shared/components/AsyncErrorBoundary';

export function RoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { loading: authLoading } = useAuth();
  usePlayerAccountResolver(); // Ensure player account is resolved in background
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showPlayerAuthModal, setShowPlayerAuthModal] = useState(false);
  const [showVenueAuthModal, setShowVenueAuthModal] = useState(false);

  // V2 HOOKS: Use async state architecture
  const {
    status: roomStatus,
    data: roomData,
    error: roomError,
    retry: retryRoom,
  } = useRoomV2({ roomCode });

  const {
    status: _sessionStatus,
    data: session,
    connectionStatus: _sessionConnectionStatus,
  } = useSession(sessionId || undefined);

  // Extract room data from v2 hook
  const room = roomData?.room;
  const memberships = roomData?.memberships || [];

  // Get sessionId from room when it updates
  useEffect(() => {
    if (room?.currentSessionId && room.currentSessionId !== sessionId) {
      setSessionId(room.currentSessionId);
    }
  }, [room, sessionId]); // Fixed: include entire room object instead of just currentSessionId

  
  // V2 LOADING STATE: Show skeleton instead of generic loading
  if (authLoading || roomStatus === "booting" || roomStatus === "loading") {
    return <RoomSkeleton />;
  }

  // V2 ERROR STATE: Show error component with retry
  if (roomStatus === "error" || !room) {
    return (
      <ErrorState
        title="Room Not Found"
        message={roomError?.message || `The room code "${roomCode}" doesn't exist.`}
        onRetry={retryRoom}
        retryLabel="Try Again"
      />
    );
  }

  // V2 ASYNC ERROR BOUNDARY: Wrap content to catch async errors
  return (
    <AsyncErrorBoundary>
      <RoomPageProvider
        room={room}
        memberships={memberships}
        session={session}
        sessionId={sessionId}
      >
        <RoomPageContent />
      </RoomPageProvider>

      
      {/* Authentication Modals */}
      {showPlayerAuthModal && (
        <PlayerAuthModal
          open={showPlayerAuthModal}
          onClose={() => setShowPlayerAuthModal(false)}
        />
      )}
      {showVenueAuthModal && (
        <VenueAuthModal
          open={showVenueAuthModal}
          onClose={() => setShowVenueAuthModal(false)}
        />
      )}
    </AsyncErrorBoundary>
  );
}

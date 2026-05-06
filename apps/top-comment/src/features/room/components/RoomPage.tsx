import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRoomV2 } from '../../../hooks/useRoomV2';
import { useSession } from '../../session/hooks-v2';
import { RoomPageProvider } from '../context/RoomPageContext';
import { useAuth } from '../../../shared/providers/AuthContext';
import { usePlayerAccountResolver } from '../../player/usePlayerAccountResolver';
import { RoomPageContent } from './index';
import { RoomReconnectingBanner } from './RoomReconnectingBanner';
import { RoomSkeleton } from '../../../shared/components/skeletons/RoomSkeleton';
import { RoomLoadingState } from '../../../shared/components/RoomLoadingState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { AsyncErrorBoundary } from '../../../shared/components/AsyncErrorBoundary';
import { logger } from '../../../shared/utils/logger';

export function RoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { loading: authLoading } = useAuth();
  usePlayerAccountResolver(); // Ensure player account is resolved in background
  const [sessionId, setSessionId] = useState<string | null>(null);

  // V2 HOOKS: Use async state architecture
  const {
    status: roomStatus,
    data: roomData,
    error: roomError,
    retry: retryRoom,
    isRetrying,
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
  // Use currentSessionId directly as dependency to ensure we catch all changes
  const currentSessionId = room?.currentSessionId;
  useEffect(() => {
    if (currentSessionId && currentSessionId !== sessionId) {
      logger.debug('Session ID changed', { old: sessionId, new: currentSessionId });
      setSessionId(currentSessionId);
    } else if (!currentSessionId && sessionId) {
      // Session was cleared (e.g., session ended)
      logger.debug('Session cleared');
      setSessionId(null);
    }
  }, [currentSessionId, sessionId]);

  
  // V2 LOADING STATE: Show contextual loading based on state
  if (authLoading || roomStatus === "booting" || roomStatus === "loading") {
    return <RoomSkeleton />;
  }
  
  // Show better UX during retry attempts
  if (isRetrying) {
    return <RoomLoadingState roomCode={roomCode} isRetrying={true} />;
  }

  // V2 ERROR STATE: Show error component with retry
  // Only show error after retries have been exhausted
  if (roomStatus === "error" || !room) {
    return (
      <>
        <RoomReconnectingBanner />
        <ErrorState
          title="Room Not Found"
          message={roomError?.message || `The room code "${roomCode}" doesn't exist or may still be loading.`}
          onRetry={retryRoom}
          retryLabel="Try Again"
        />
      </>
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
    </AsyncErrorBoundary>
  );
}

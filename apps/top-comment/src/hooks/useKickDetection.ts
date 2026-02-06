import { useEffect, useState } from 'react';
import { useRoom } from './useRoom';

interface UseKickDetectionProps {
  roomId: string | null;
  onLeaveRoom?: () => void;
}

/**
 * Hook to detect if a player was kicked or banned from a room
 * Works across all phases, not just the lobby
 */
export function useKickDetection({ roomId }: UseKickDetectionProps) {
  const { myMembership } = useRoom({ roomId: roomId || undefined });
  const [hasEstablishedMembership, setHasEstablishedMembership] = useState(false);
  
  // Track if we've already established membership (fix race condition)
  useEffect(() => {
    if (myMembership && !hasEstablishedMembership) {
      setHasEstablishedMembership(true);
    }
  }, [myMembership, hasEstablishedMembership]);

  // Detect if player was kicked (membership deleted)
  useEffect(() => {
    // Only check for kick if we had membership before and now don't
    if (roomId && hasEstablishedMembership && !myMembership) {
      console.log('🚫 KICK DETECTED - membership not found, redirecting to join page...');
      // Player was removed from the room - use window.location for reliable redirect
      window.location.href = "/join";
    }
  }, [myMembership?.id, hasEstablishedMembership, roomId]);

  // Detect if player was banned (membership exists but is_banned=true)
  useEffect(() => {
    if (myMembership && myMembership.isBanned) {
      console.log('🚫 Player was banned - membership is_banned=true');
      // Player was banned from the room - use window.location for reliable redirect
      window.location.href = "/join";
    }
  }, [myMembership?.isBanned, myMembership?.id, roomId]);

  return {
    myMembership,
    hasEstablishedMembership
  };
}

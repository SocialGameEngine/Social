import { useEffect, useRef } from "react";

interface UseTeamKickedPlayerDetectionProps {
  session: any;
  teamSession: { sessionId: string; code: string; teamName: string } | null;
  sessionSnapshotReady: boolean;
  currentTeam: any;
  activeTeams: any[];
  showKickedModal: boolean;
  setShowKickedModal: (show: boolean) => void;
  addBannedSession: (sessionId: string, code: string) => void;
  removeBannedSession: (sessionId: string) => void;
  getBannedFromSessions: () => Map<string, import("../utils/teamConstants").BannedSession>;
  setSessionId: (id: string | null) => void;
  clearTeamSession: () => void;
  toast: (options: { title: string; description?: string; variant: "success" | "error" }) => void;
}

export function useTeamKickedPlayerDetection({
  session,
  teamSession,
  sessionSnapshotReady,
  currentTeam,
  activeTeams,
  showKickedModal,
  setShowKickedModal,
  addBannedSession,
  removeBannedSession,
  getBannedFromSessions,
  setSessionId,
  clearTeamSession,
  toast,
}: UseTeamKickedPlayerDetectionProps) {
  const kickDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredKickRef = useRef(false);

  // Detect when player is kicked (currentTeam becomes null while session exists and other teams are still present)
  useEffect(() => {
    // Clear any pending timeout if conditions change
    if (kickDetectionTimeoutRef.current) {
      clearTimeout(kickDetectionTimeoutRef.current);
      kickDetectionTimeoutRef.current = null;
    }

    // Reset trigger flag if player is back in the session
    if (currentTeam !== null) {
      hasTriggeredKickRef.current = false;
    }
    
    // Simplified detection: if we have teamSession but currentTeam is null and session exists
    // This means we were removed from the session
    // Check if user was kicked
    if (
      teamSession &&
      sessionSnapshotReady &&
      currentTeam === null &&
      !showKickedModal &&
      !hasTriggeredKickRef.current
    ) {
      // Wait 500ms to confirm this is a real kick, not just a temporary state during re-subscription
      kickDetectionTimeoutRef.current = setTimeout(() => {
        // Double-check conditions are still true after delay
        if (
          session &&
          teamSession &&
          sessionSnapshotReady &&
          currentTeam === null &&
          !showKickedModal &&
          !hasTriggeredKickRef.current
        ) {
          // Player was removed - they're not in the teams list anymore but other teams exist
          hasTriggeredKickRef.current = true;
          
          // Show the kicked modal
          setShowKickedModal(true);
          
          // Clear session and redirect to join page after showing modal
          setTimeout(() => {
            clearTeamSession();
            setSessionId(null);
            // Redirect to join page
            window.location.href = '/join';
          }, 1000); // 1 second delay to show the modal
        }
      }, 100); // 100ms debounce for immediate response
    }

    return () => {
      if (kickDetectionTimeoutRef.current) {
        clearTimeout(kickDetectionTimeoutRef.current);
      }
    };
  }, [
    session,
    teamSession,
    sessionSnapshotReady,
    currentTeam,
    activeTeams,
    showKickedModal,
    setShowKickedModal,
    addBannedSession,
    clearTeamSession,
    setSessionId,
  ]);

  // Safety check: If they somehow rejoin a session they were banned from, immediately clear it
  useEffect(() => {
    if (!session || !sessionSnapshotReady) return;
    const bannedFromSessions = getBannedFromSessions();
    if (bannedFromSessions.has(session.id) && currentTeam === null) {
      // They were banned and are not in teams - already handled by kicked modal
      return;
    }
    if (bannedFromSessions.has(session.id) && currentTeam) {
      // They somehow rejoined - clear immediately
      setSessionId(null);
      clearTeamSession();
      toast({
        title: "Cannot rejoin session",
        description: "You were banned from this session and cannot rejoin.",
        variant: "error",
      });
    }
  }, [session, sessionSnapshotReady, currentTeam, setSessionId, clearTeamSession, toast, getBannedFromSessions]);
}

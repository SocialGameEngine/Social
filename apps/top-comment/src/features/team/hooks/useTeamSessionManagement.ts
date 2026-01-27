import { useEffect } from "react";
import { HAS_MANUALLY_LEFT_KEY } from "../utils/teamConstants";

interface UseTeamSessionManagementProps {
  session: any;
  currentTeam: any;
  hasManuallyLeft: boolean;
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  setTeamSession: (session: any) => void;
  setHasManuallyLeft: (hasLeft: boolean) => void;
}

export function useTeamSessionManagement({
  session,
  currentTeam,
  hasManuallyLeft,
  sessionId,
  setSessionId,
  setTeamSession,
  setHasManuallyLeft,
}: UseTeamSessionManagementProps) {
  // Restore sessionId if user hasn't manually left
  useEffect(() => {
    if (hasManuallyLeft) return;
    if (!sessionId && session?.id && session.status !== "ended") {
      setSessionId(session.id);
    }
  }, [session?.id, session?.status, sessionId, hasManuallyLeft, setSessionId]);

  // Save session to localStorage if user hasn't manually left
  useEffect(() => {
    if (hasManuallyLeft) return;
    if (session && currentTeam) {
      setTeamSession({
        sessionId: session.id,
        teamId: currentTeam.id,
        teamName: currentTeam.teamName,
        code: session.code,
        uid: currentTeam.uid,
      });
    }
  }, [session, currentTeam, setTeamSession, hasManuallyLeft]);

  // Reset hasManuallyLeft flag when user successfully joins
  useEffect(() => {
    if (session && currentTeam) {
      setHasManuallyLeft(false);
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.removeItem(HAS_MANUALLY_LEFT_KEY);
        } catch {
          // Ignore sessionStorage errors
        }
      }
    }
  }, [session, currentTeam, setHasManuallyLeft]);
}

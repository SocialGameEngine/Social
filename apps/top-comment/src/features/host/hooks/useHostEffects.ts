import { useEffect } from "react";
import type { Session, SessionStatus } from "../../../shared/types";
import { fetchAnalytics } from "../../session/sessionService";

interface UseHostEffectsProps {
  session: Session | null;
  sessionId: string | null;
  sessionSnapshotReady: boolean;
  sessionRef: React.MutableRefObject<Session | null>;
  setSessionId: (id: string | null) => void;
  setHostSession: (data: { sessionId: string; code: string }) => void;
  clearHostSession: () => void;
  setShowCreateModal: (show: boolean) => void;
  setCurrentPhase: (phase: SessionStatus | null) => void;
  setAnalytics: (data: any) => void;
  setShowPromptLibraryModal: (show: boolean) => void;
  setHostGroupVotes: (votes: Record<string, string>) => void;
  toast: (options: { title: string; variant: "success" | "error" }) => void;
}

export function useHostEffects({
  session,
  sessionId,
  sessionSnapshotReady,
  sessionRef,
  setSessionId,
  setHostSession,
  clearHostSession,
  setShowCreateModal,
  setCurrentPhase,
  setAnalytics,
  setShowPromptLibraryModal,
  setHostGroupVotes,
  toast,
}: UseHostEffectsProps) {
  // Set sessionRef.current to latest session for auto advance actions
  useEffect(() => {
    sessionRef.current = session ?? null;
  }, [session, sessionRef]);

  // Validate session existence and setup on load/update
  useEffect(() => {
    if (!session && sessionId && sessionSnapshotReady) {
      toast({
        title: "Session not found. It may have expired. Create a new one to continue hosting.",
        variant: "error"
      });
      clearHostSession();
      setSessionId(null);
      setShowCreateModal(true);
      return;
    }

    if (!session) {
      return;
    }

    if (session.status === "ended") {
      clearHostSession();
      return;
    }

    if (!sessionId || session.id !== sessionId) {
      setSessionId(session.id);
    }

    if (session.code) {
      setHostSession({ sessionId: session.id, code: session.code });
    }
  }, [
    session,
    sessionId,
    sessionSnapshotReady,
    setHostSession,
    clearHostSession,
    toast,
    setSessionId,
    setShowCreateModal,
  ]);

  // Update current phase in context for HowToPlayModal
  useEffect(() => {
    setCurrentPhase(session?.status ?? null);
  }, [session?.status, setCurrentPhase]);

  // Fetch analytics after session ends
  useEffect(() => {
    if (session?.status === "ended" && session.id) {
      fetchAnalytics(session.id)
        .then((data) => setAnalytics(data))
        .catch(() => {});
    }
  }, [session?.status, session?.id, setAnalytics]);

  // Close prompt library modal when leaving lobby
  useEffect(() => {
    if (session?.status !== "lobby") {
      setShowPromptLibraryModal(false);
    }
  }, [session?.status, setShowPromptLibraryModal]);

  // Clear host votes when leaving vote phase
  useEffect(() => {
    if (session?.status !== "vote") {
      setHostGroupVotes({});
    }
  }, [session?.status, setHostGroupVotes]);
}

import { useEffect } from "react";

interface UseTeamTimersProps {
  setNow: (now: number) => void;
  session: any;
  answerText: string;
  myAnswer: any;
  handleSubmitAnswer: () => void;
  setAnswerText: (text: string) => void;
  showSessionEndedModal: boolean;
  setShowSessionEndedModal: (show: boolean) => void;
  setFinalSession: (session: any) => void;
  setFinalTeams: (teams: any[]) => void;
  teams: any[];
  finalSession: any;
  setAutoJoinAttempted: (attempted: boolean) => void;
  setSessionId: (id: string | null) => void;
}

export function useTeamTimers({
  setNow,
  session,
  answerText,
  myAnswer,
  handleSubmitAnswer,
  setAnswerText,
  showSessionEndedModal,
  setShowSessionEndedModal,
  setFinalSession,
  setFinalTeams,
  teams,
  finalSession,
  setAutoJoinAttempted,
  setSessionId,
}: UseTeamTimersProps) {
  // Timer for updating current time
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(interval);
  }, [setNow]);

  // Auto-submit answer when time is about to expire
  useEffect(() => {
    if (myAnswer && !answerText) return;
    if (!session || session.status !== "answer") return;
    if (!answerText.trim()) return;
    if (myAnswer) return;

    const endTime = session.endsAt ? new Date(session.endsAt).getTime() : null;
    if (!endTime) return;

    const timeout = window.setTimeout(
      () => {
        void handleSubmitAnswer();
      },
      Math.max(endTime - Date.now(), 0),
    );

    return () => window.clearTimeout(timeout);
  }, [session?.endsAt, session?.status, answerText, myAnswer, handleSubmitAnswer]);

  // Handle session ended state - only show modal if host explicitly ended it
  useEffect(() => {
    if (session?.status === "ended") {
      setAnswerText("");
      
      console.log("Session ended - checking endedByHost flag:", {
        endedByHost: session.endedByHost,
        status: session.status,
        showSessionEndedModal
      });
      
      // Only show modal if host clicked "End Session" button
      // Manual advancement through phases counts as natural progression
      const endedByHost = session.endedByHost === true;
      
      if (endedByHost && !showSessionEndedModal) {
        console.log("Session ended by host - showing modal");
        setShowSessionEndedModal(true);
      } else if (!endedByHost) {
        console.log("Session ended naturally - no modal");
      }
    }
  }, [session?.status, session?.endedByHost, showSessionEndedModal, setAnswerText, setShowSessionEndedModal]);

  // Handle final session state
  useEffect(() => {
    if (!session) return;
    if (session.status !== "ended") return;
    if (finalSession) return;
    
    setFinalSession(session);
    setFinalTeams(teams);
    setAutoJoinAttempted(true);
    setSessionId(null);
  }, [session, teams, finalSession, setFinalSession, setFinalTeams, setAutoJoinAttempted, setSessionId]);
}

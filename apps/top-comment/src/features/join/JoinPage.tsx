import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BackgroundAnimation } from "../../components/BackgroundAnimation";
import { useTeamState, useTeamHandlers } from "../team/hooks";
import { useTeamSession } from "../team/useTeamSession";
import { useTeamRoom } from "../team/useTeamRoom";
import { JoinForm } from "../team/Phases";
import { useToast } from "../../shared/hooks";

export function JoinPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { teamSession, setTeamSession, clearTeamSession } = useTeamSession();
  const { teamRoom } = useTeamRoom();

  const teamState = useTeamState(teamSession, teamRoom);
  const {
    joinForm,
    setJoinForm,
    joinErrors,
    setJoinErrors,
    isJoining,
    setIsJoining,
  } = teamState;

  // Extract event handlers into custom hook - simplified for join page
  const { handleJoin: handleJoinValues } = useTeamHandlers({
    sessionId: null,
    session: null,
    joinForm,
    setJoinForm,
    setJoinErrors,
    setIsJoining,
    setSessionId: () => {},
    setTeamSession,
    setTeamRoom: (room) => {
      // Set teamRoom and navigate to team page on successful join
      if (room) {
        console.log('🚀 Successful join, navigating to team page:', '/team');
        navigate('/team');
      }
    },
    clearTeamSession,
    setHasManuallyLeft: () => {},
    setAutoJoinAttempted: () => {},
    answerText: "",
    setAnswerText: () => {},
    myAnswer: null,
    myGroup: null,
    setIsSubmittingAnswer: () => {},
    setIsSubmittingVote: () => {},
    toast, // Update useTeamHandlers to use toast
  });

  // Wrapper for handleJoin to match FormEvent signature - EXACT same as TeamPage
  const handleJoin = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = {
      code: String(formData.get("code") ?? ""),
      playerName: String(formData.get("playerName") ?? ""),
    };
    console.log('🚀 JoinPage handleJoin called with:', values);
    void handleJoinValues(values);
  }, [handleJoinValues]);

  // Debug logging for teamRoom state
  console.log('🔍 JoinPage teamRoom state:', { teamRoom, teamRoomId: teamRoom?.roomId, roomCode: teamRoom?.roomCode });
  
  // Note: Navigation handled by handleJoinValues success callback

  // Simplified styling for join page
  const bottomPaddingClass = "pb-10";
  const mainClassName = `relative z-10 flex min-h-screen items-center justify-center px-3 py-10 sm:px-4 ${bottomPaddingClass}`;
  const contentWrapperClassName = "chaos-stack mx-auto flex w-[92vw] max-w-[440px] flex-col gap-4 sm:w-full sm:max-w-[520px] sm:gap-6";

  return (
    <>
      <BackgroundAnimation show={true} />
      <style>{`
        body {
          background: transparent !important;
        }
      `}</style>
      <main className={mainClassName}>
        <div className={contentWrapperClassName}>
          <div className="p-4"></div>
          <JoinForm
            joinForm={joinForm}
            joinErrors={joinErrors}
            isJoining={isJoining}
            handleJoin={handleJoin}
            setJoinForm={setJoinForm}
          />
        </div>
      </main>
    </>
  );
}

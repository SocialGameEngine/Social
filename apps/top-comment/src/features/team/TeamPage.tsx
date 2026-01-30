import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Modal, SessionTimer } from "@social/ui";
import { useToast } from "../../shared/hooks";
import { VIBoxButton } from "../../shared/components/vibox/VIBoxButton";
import { BackgroundAnimation } from "../../components/BackgroundAnimation";
import { HowToPlayModal } from "../howToPlay/HowToPlayModal";
import { VIBoxJukebox } from "../../shared/components/vibox/VIBoxJukebox";
import { transformRoundSummariesForUI, transformLeaderboardForUI } from "../../application";
import { useActiveGroupAnswers } from "../../shared/hooks";
import { useTeamState, useTeamEffects, useTeamPhaseRenderer, useTeamHandlers, useTeamComputations, useTeamTimers, useTeamSessionManagement, useTeamQueryParams, useTeamKickedPlayerDetection, useTeamAnswerInitialization } from "./hooks";
import { useTeamSession } from "./useTeamSession";
import { useSelfieCamera } from "./useSelfieCamera";
import { useAuth } from "../../shared/providers/AuthContext";
import { useCurrentPhase } from "../../shared/providers/CurrentPhaseContext";
import { useTheme } from "../../shared/providers/ThemeProvider";
import {
  getBannedFromSessions,
  isBannedFromCode,
  addToBannedSessions,
  getHasManuallyLeft,
  removeBannedSession,
  addBannedSession,
} from "./utils/teamConstants";
import { JoinForm, EndedPhase } from "./Phases";

export function TeamPage() {
  const { loading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { teamSession, setTeamSession, clearTeamSession } = useTeamSession();
  const { setCurrentPhase } = useCurrentPhase();
  const { isDark } = useTheme();

  const teamState = useTeamState(teamSession);
  const {
    sessionId,
    setSessionId,
    joinForm,
    setJoinForm,
    joinErrors,
    setJoinErrors,
    isJoining,
    setIsJoining,
    answerText,
    setAnswerText,
    isSubmittingAnswer,
    setIsSubmittingAnswer,
    isSubmittingVote,
    setIsSubmittingVote,
    isSubmittingCategorySelection,
    setIsSubmittingCategorySelection,
    autoJoinAttempted,
    setAutoJoinAttempted,
    showHowToPlay,
    setShowHowToPlay,
    howToPlayInitialPhase,
    setHowToPlayInitialPhase,
    hasManuallyLeft,
    setHasManuallyLeft,
    finalSession,
    setFinalSession,
    finalTeams,
    setFinalTeams,
    showKickedModal,
    setShowKickedModal,
    showSessionEndedModal,
    setShowSessionEndedModal,
    showVIBoxModal,
    setShowVIBoxModal,
    now,
    setNow,
    scoreboardRef,
    lastInitializedRoundRef,
  } = teamState;

  // Extract complex useEffect logic into custom hook
  const { gameState: effectsGameState, handleLeave: effectsHandleLeave } = useTeamEffects({
    sessionId,
    teamSession,
    setSessionId,
    setTeamSession,
    clearTeamSession,
    joinForm,
    setJoinErrors,
    setIsJoining,
    setJoinForm,
    autoJoinAttempted,
    setAutoJoinAttempted,
    hasManuallyLeft,
    showKickedModal,
    setShowKickedModal,
    showSessionEndedModal,
    setShowSessionEndedModal,
    setFinalSession,
    setFinalTeams,
    setCurrentPhase,
    toast,
    addToBannedSessions,
    isBannedFromCode,
    getHasManuallyLeft,
    setHasManuallyLeft,
  });

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(interval);
  }, []);

  // Use the new application hooks - this replaces 4 separate hooks!
  const gameState = effectsGameState;
  
  // Extract data from gameState for compatibility with existing code
  const session = gameState.session;
  const teams = gameState.teams;
  const answers = gameState.answers;
  const votes = gameState.votes;
  const sessionSnapshotReady = !gameState.isLoading;

  // Extract query parameter logic into custom hook
  useTeamQueryParams({
    setJoinForm,
    setAutoJoinAttempted,
    hasManuallyLeft,
  });

  const activeTeams = session ? teams : finalTeams;

  // Use gameState.userTeam when available, otherwise use teamSession.teamId like LobbyPhase
  const currentTeam = useMemo(() => {
    if (gameState.userTeam) {
      return activeTeams.find(team => team.id === gameState.userTeam?.id) ?? null;
    }

    if (teamSession?.teamId) {
      return activeTeams.find(team => team.id === teamSession.teamId) ?? null;
    }

    if (user?.id) {
      return activeTeams.find(team => team.uid === user.id) ?? null;
    }

    return null;
  }, [gameState.userTeam, activeTeams, teamSession?.teamId, user?.id]);

  // Extract session management logic into custom hook
  useTeamSessionManagement({
    session,
    currentTeam,
    hasManuallyLeft,
    sessionId,
    setSessionId,
    setTeamSession,
    setHasManuallyLeft,
  });

  // Extract kicked player detection logic into custom hook
  useTeamKickedPlayerDetection({
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
  });

  // Use gameState values instead of calculations
  const roundGroups = gameState.currentGroups;
  const totalGroups = roundGroups.length;
  const activeGroup = gameState.activeVoteGroup;
  const activeGroupIndex = session?.voteGroupIndex ?? 0;

  // Use gameState userTeam info for myAnswer
  const myAnswer = useMemo(
    () =>
      currentTeam
        ? (answers.find((answer) => answer.teamId === currentTeam.id) ?? null)
        : null,
    [answers, currentTeam],
  );

  // Use gameState voteCounts instead of calculation
  const voteCounts = gameState.voteCounts;

  // Transform leaderboard entries to UI format - use activeTeams for final scoreboard
  // When session ends, gameState.leaderboard will be empty, so calculate from finalTeams
  const finalLeaderboard = useMemo(() => {
    if (!session && finalTeams.length > 0) {
      // Session has ended, calculate leaderboard from finalTeams
      const sortedTeams = [...finalTeams].sort((a, b) => b.score - a.score);
      let currentRank = 1;
      let previousScore = sortedTeams[0]?.score ?? 0;
      
      return sortedTeams.map((team, index) => {
        if (index > 0 && team.score < previousScore) {
          currentRank = index + 1;
        }
        previousScore = team.score;
        
        return {
          ...team,
          rank: currentRank
        };
      });
    }
    // Session is active, use gameState leaderboard
    return transformLeaderboardForUI(gameState.leaderboard, activeTeams);
  }, [session, finalTeams, gameState.leaderboard, activeTeams]);

  // Camera selfie feature - declare endedSession before use
  const endedSession = session?.status === "ended" ? session : finalSession;

  // Extract all computations into single custom hook
  const {
    showBackground,
    myGroup,
    myActiveVote,
    isVotingOnOwnGroup,
    activeGroupWinnerIds,
    votesForMe,
    myRoundPoints,
    roundSummaries,
  } = useTeamComputations({
    // Basic derived state props
    sessionId,
    session,
    endedSession,
    authLoading,
    autoJoinAttempted,
    hasManuallyLeft,
    teamSession,
    isJoining,
    sessionSnapshotReady,
    
    // Derived calculations props
    currentTeam,
    roundGroups,
    activeGroup,
    activeGroupAnswers: [], // Will be updated below
    voteCounts,
    votes,
    myAnswer,
    roundSummaries: transformRoundSummariesForUI(
      gameState.roundSummaries,
      roundGroups,
      teams
    ),
    teams,
  });

  const activeGroupAnswers = useActiveGroupAnswers(answers, session, activeGroup, myGroup);

  const voteSummaryActive = useMemo(() => {
    // Game state should depend on session status and pause flag, not timer
    if (session?.status !== "vote") return false;
    if (session?.paused) return false; // Don't show vote summary when paused
    
    // For vote phase, show summary after voting period ends OR if timer is complete
    if (!session?.endsAt) return true; // If no timer, show summary immediately
    const endsAtTime = new Date(session.endsAt).getTime();
    return now >= endsAtTime;
  }, [session?.status, session?.paused, session?.endsAt, now]);

  // Camera selfie feature
  const {
    isTakingSelfie,
    showSelfieModal,
    selfieImage,
    setSelfieImage,
    videoRef,
    canvasRef,
    startSelfie,
    captureSelfie,
    cancelSelfie,
    downloadSelfie,
    shareSelfie,
  } = useSelfieCamera({
    currentTeam,
    finalLeaderboard,
    venueName: endedSession?.venueName,
  });

  const scrollToMyRank = useCallback(() => {
    if (!currentTeam) return;
    const container = scoreboardRef.current;
    if (!container) return;
    container.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentTeam]);

  const totalSeconds = useMemo(() => {
    if (!session) return 30;
    if (session.status === "vote") {
      return session.settings.voteSecs ?? 90;
    }
    if (session.status === "results") {
      return 12;
    }
    return session.settings.answerSecs ?? 90;
  }, [session?.status]);

  
  // Extract answer initialization logic into custom hook
  useTeamAnswerInitialization({
    session,
    myAnswer,
    answerText,
    setAnswerText,
    lastInitializedRoundRef,
  });

  // Extract event handlers into custom hook
  const { handleJoin: handleJoinValues, handleSubmitAnswer, handleVote, handleSelectCategory } = useTeamHandlers({
    sessionId,
    session,
    joinForm,
    setJoinForm,
    setJoinErrors,
    setIsJoining,
    setSessionId,
    setTeamSession,
    clearTeamSession,
    setHasManuallyLeft,
    setAutoJoinAttempted,
    answerText,
    setAnswerText,
    myAnswer,
    myGroup,
    setIsSubmittingAnswer,
    setIsSubmittingVote,
    setIsSubmittingCategorySelection,
    toast,
  });

  // Wrapper for handleJoin to match FormEvent signature
  const handleJoin = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = {
      code: String(formData.get("code") ?? ""),
      teamName: String(formData.get("teamName") ?? ""),
    };
    void handleJoinValues(values);
  }, [handleJoinValues]);

  const handleOpenHowToPlay = useCallback(() => {
    // Capture the phase at the moment the button is clicked
    setHowToPlayInitialPhase(session?.status ?? null);
    setShowHowToPlay(true);
  }, [session?.status]);

  // Extract timer and remaining useEffect logic into custom hook
  useTeamTimers({
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
  });

  

  

  

  useEffect(() => {
    if (!session && sessionId && sessionSnapshotReady) {
      effectsHandleLeave();
    }
  }, [session, sessionId, sessionSnapshotReady, effectsHandleLeave]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.endsAt, session?.status, answerText, myAnswer]);

  // Extract phase rendering logic into custom hook
  const renderGameContent = useTeamPhaseRenderer({
    session,
    teams,
    currentTeam,
    myGroup,
    roundGroups,
    myAnswer,
    answerText,
    setAnswerText,
    handleSubmitAnswer,
    isSubmittingAnswer,
    handleSelectCategory,
    isSubmittingCategorySelection,
    totalSeconds,
    activeGroup,
    activeGroupIndex,
    totalGroups,
    activeGroupAnswers,
    voteCounts,
    myActiveVote,
    activeGroupWinnerIds,
    handleVote,
    isSubmittingVote,
    voteSummaryActive,
    isVotingOnOwnGroup,
    finalLeaderboard,
    votesForMe,
    myRoundPoints,
    scrollToMyRank,
    selfieImage,
    startSelfie,
    shareSelfie,
    downloadSelfie,
    setSelfieImage,
    isTakingSelfie,
    handleLeave: effectsHandleLeave,
    scoreboardRef,
    roundSummaries,
    votes,
    answers,
  });

  let mainContent;
  if (endedSession && !session) {
    mainContent = (
      <EndedPhase
        currentTeam={currentTeam}
        finalLeaderboard={finalLeaderboard}
        scrollToMyRank={scrollToMyRank}
        selfieImage={selfieImage}
        startSelfie={startSelfie}
        shareSelfie={shareSelfie}
        downloadSelfie={downloadSelfie}
        setSelfieImage={setSelfieImage}
        isTakingSelfie={isTakingSelfie}
        handleLeave={effectsHandleLeave}
        scoreboardRef={scoreboardRef}
      />
    );
  } else if (!sessionId) {
    mainContent = (
      <JoinForm
        joinForm={joinForm}
        joinErrors={joinErrors}
        isJoining={isJoining}
        handleJoin={handleJoin}
        setJoinForm={setJoinForm}
      />
    );
  } else if (!sessionSnapshotReady) {
    mainContent = (
      <Card className="space-y-3 text-center" isDark={isDark}>
        <h2 className={`text-xl font-semibold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>Connecting...</h2>
        <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>Pulling the latest game state.</p>
      </Card>
    );
  } else if (session) {
    mainContent = renderGameContent;
  } else {
    mainContent = endedSession ? (
      <EndedPhase
        currentTeam={currentTeam}
        finalLeaderboard={finalLeaderboard}
        scrollToMyRank={scrollToMyRank}
        selfieImage={selfieImage}
        startSelfie={startSelfie}
        shareSelfie={shareSelfie}
        downloadSelfie={downloadSelfie}
        setSelfieImage={setSelfieImage}
        isTakingSelfie={isTakingSelfie}
        handleLeave={effectsHandleLeave}
        scoreboardRef={scoreboardRef}
      />
    ) : (
      <JoinForm
        joinForm={joinForm}
        joinErrors={joinErrors}
        isJoining={isJoining}
        handleJoin={handleJoin}
        setJoinForm={setJoinForm}
      />
    );
  }

  
  const bottomPaddingClass = session ? "pb-28 sm:pb-10" : "pb-10";
  const mainClassName = showBackground
    ? `relative z-10 flex min-h-screen items-center justify-center px-3 py-10 sm:px-4 ${bottomPaddingClass}`
    : `relative min-h-screen px-4 py-8 ${bottomPaddingClass} ${!isDark ? 'bg-amber-50' : 'bg-slate-950'}`;

  const contentWrapperClassName = showBackground
    ? "chaos-stack mx-auto flex w-[92vw] max-w-[440px] flex-col gap-4 sm:w-full sm:max-w-[520px] sm:gap-6"
    : "mx-auto flex w-full max-w-lg flex-col gap-6";

  return (
    <>
      {session ? (
        <div className="fixed left-4 top-5 z-50 max-w-[4.75rem] sm:max-w-none">
          <button
            type="button"
            onClick={effectsHandleLeave}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 transition-colors hover:text-red-400 whitespace-nowrap"
          >
            ✕ BAIL
          </button>
        </div>
      ) : null}
      {showBackground ? (
        <div className="chaos-orbs" aria-hidden="true">
          <div className="chaos-orb" style={{ left: '10%' }} />
          <div className="chaos-orb" style={{ left: '70%', animationDuration: '18s' }} />
          <div className="chaos-orb" style={{ left: '40%', animationDuration: '22s' }} />
        </div>
      ) : (
        <BackgroundAnimation show={showBackground} />
      )}
      <div className="pointer-events-auto fixed right-4 top-20 z-50 hidden flex-col gap-2 sm:flex sm:right-auto sm:top-auto sm:left-4 sm:bottom-4 sm:flex-col-reverse">
        <button
          type="button"
          onClick={handleOpenHowToPlay}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${!isDark ? 'border-slate-300 bg-white text-slate-700 hover:border-brand-primary hover:bg-brand-light hover:text-brand-primary focus-visible:outline-brand-primary' : 'border-cyan-400/50 bg-slate-800 text-cyan-300 hover:border-cyan-300 hover:bg-slate-700 focus-visible:outline-cyan-400'}`}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
            />
          </svg>
          <span>How to play</span>
        </button>
        <VIBoxButton
          onClick={() => setShowVIBoxModal(true)}
          variant="team"
          size="md"
        />
      </div>
      <main className={mainClassName}>
        <div className={contentWrapperClassName}>
          {!session ? <div className="p-4"></div> : null}
          {mainContent}

          {null}

        </div>

        {session ? (
          <nav className="chaos-bottom-nav sm:hidden">
            <div className="chaos-nav-item">
              <SessionTimer
                endTime={session.endsAt}
                totalSeconds={totalSeconds}
                paused={session.paused}
                size="sm"
                position="inline"
                isDark={isDark}
              />
              <span className="chaos-nav-label">Time</span>
            </div>
            <div className="flex-none -mt-10 px-2">
              <VIBoxButton
                onClick={() => setShowVIBoxModal(true)}
                variant="team"
                size="lg"
              />
            </div>
            <button
              type="button"
              className="chaos-nav-item"
              onClick={handleOpenHowToPlay}
            >
              <div className="text-xl">❓</div>
              <span className="chaos-nav-label">Help</span>
            </button>
          </nav>
        ) : null}

        {/* Selfie Modal */}
        {showSelfieModal && (
          <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
            <div className="relative w-full h-full max-w-md mx-auto flex flex-col items-center justify-center">
              {/* Camera Feed - Constrained to 9:16 aspect ratio for Instagram/TikTok */}
              <div className="relative w-full max-w-[375px] aspect-[9/16] overflow-hidden">
                {isTakingSelfie ? (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                      <p className="text-lg">Starting camera...</p>
                      <p className="text-sm text-slate-300 mt-2">
                        Please allow camera access
                      </p>
                    </div>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Face Guide Circle with Crown */}
                {!isTakingSelfie && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className="absolute flex flex-col items-center"
                      style={{ transform: "translateY(-20%)" }}
                    >
                      {/* Crown above the circle - angled to look worn */}
                      <div
                        className="text-[180px] mb-0 drop-shadow-2xl animate-pulse leading-none inline-block"
                        style={{
                          transform:
                            "translateY(20%) rotate(8deg) scale(1.5, 1)",
                          transformOrigin: "center",
                        }}
                      >
                        👑
                      </div>
                      {/* Face guide circle - bigger */}
                      <div className="w-80 h-80 rounded-full border-4 border-white/70 border-dashed flex items-center justify-center">
                        <span className="text-white/60 text-xs text-center px-2">
                          Position your face here
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Overlay on camera feed */}
                {!isTakingSelfie && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-6">
                    <div className="text-center text-white">
                      <p className="text-2xl font-bold mb-2">
                        Nice work, {currentTeam?.teamName}!
                      </p>
                      <p className="text-lg mb-1">
                        You placed #
                        {finalLeaderboard.find((t) => t.id === currentTeam?.id)
                          ?.rank || "?"}{" "}
                        with {currentTeam?.score} points!
                      </p>
                      {endedSession?.venueName && (
                        <p className="text-sm mb-1">
                          At {endedSession.venueName}
                        </p>
                      )}
                      <p className="text-sm font-bold text-blue-300">
                        Powered by Söcial
                      </p>
                    </div>
                  </div>
                )}

                {/* Top controls */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                  <Button
                    onClick={cancelSelfie}
                    variant="ghost"
                    className="bg-black/50 text-white hover:bg-black/70"
                  >
                    ✕ Cancel
                  </Button>
                  {!isTakingSelfie && (
                    <div className="text-white text-sm">
                      Position yourself in frame
                    </div>
                  )}
                </div>

                {/* Bottom capture button */}
                {!isTakingSelfie && (
                  <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
                    <Button
                      onClick={captureSelfie}
                      className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 text-black shadow-lg"
                    >
                      📸
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hidden canvas for selfie processing */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <Modal
          open={showKickedModal}
          isDark={isDark}
          onClose={() => {
            // Redirect when modal is closed (X button or ESC)
            setShowKickedModal(false);
            clearTeamSession();
            setSessionId(null);
            navigate("/join");
          }}
          title="You've been removed"
          footer={
            <Button
              onClick={() => {
                setShowKickedModal(false);
                clearTeamSession();
                setSessionId(null);
                navigate("/join");
              }}
              fullWidth
            >
              OK
            </Button>
          }
        >
          <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
            The host has removed you from this session. You can join a different session using the join page.
          </p>
        </Modal>
        <Modal
          open={showSessionEndedModal}
          isDark={isDark}
          onClose={() => {
            // Just dismiss the modal, let user stay to view results
            setShowSessionEndedModal(false);
          }}
          title="Session Ended Early"
          footer={
            <Button
              onClick={() => {
                setShowSessionEndedModal(false);
              }}
              fullWidth
            >
              View Results
            </Button>
          }
        >
          <p className={`text-sm ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
            The host has ended the session early. Check out the leaderboard and take a selfie with your score!
          </p>
        </Modal>
      </main>

      <HowToPlayModal
        open={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        initialPhase={howToPlayInitialPhase}
      />
      
      <VIBoxJukebox
        isOpen={showVIBoxModal}
        onClose={() => setShowVIBoxModal(false)}
        toast={toast}
        mode="team"
        allowUploads={false} // Teams can't upload, only view and control playback
      />
    </>
  );
}

export default TeamPage;

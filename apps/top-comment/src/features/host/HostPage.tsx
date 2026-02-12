import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button, Card, Modal, QRCodeBlock } from "@social/ui";

import { useGameState, useSessionOrchestrator, transformRoundSummariesForUI } from "../../application";
import { useRoom } from "../../hooks/useRoom";
import { VIBoxButton } from "../../shared/components/vibox/VIBoxButton";
import { VIBoxJukebox } from "../../shared/components/vibox/VIBoxJukebox";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { useActiveGroupAnswers, usePlayerLookup, useToast } from "../../shared/hooks";
import { useAuth } from "../../shared/providers/AuthContext";
import { useTheme } from "../../shared/providers/ThemeProvider";
import { actionLabel, getDefaultPromptLibraryId, phaseCopy } from "../../shared/constants";
import { getErrorMessage } from "../../shared/utils/errors";
import { supabase } from "../../supabase/client";
import {
  LobbyPhase,
  AnswerPhase,
  VotePhase,
  ResultsPhase,
  EndedPhase,
  CreateSessionModal,
  JoinSessionModal,
} from "./Phases";
import { CreateRoomModal } from "./components/CreateRoomModal";
import { PromptLibrarySelector } from "./components/PromptLibrarySelector";
import { BannedPlayersManager } from "./components/BannedPlayersManager";
import { HostInteractionManager } from "./components/HostInteractionManager";
import { handleCopyLink, handleCreateSession, handleUpdateSession, handleEndSession, handleHostVote, handlePrimaryAction } from "./Handlers";
import { handleRoomKickPlayer, handleRoomBanPlayer } from "./Handlers/roomKickBanHandlers";
import { setPromptLibrary, pauseSession } from "../session/sessionService";
import { useHostRoom } from "./useHostRoom";
import { useHostSession } from "./useHostSession";
import { useHostComputations, useHostState } from "./hooks";
import { useResponsiveLayout } from "../room/hooks/useResponsiveLayout";
import type { PromptLibraryId } from "../../shared/promptLibraries";
import type { Room } from "../../shared/types";

export function HostPage() {
  const { user, loading: authLoading, isVenueAccount, venueAccountLoading, refreshVenueAccount } = useAuth();
  const { toast } = useToast();
  const { isDark } = useTheme(); 
  const navigate = useNavigate();
  
  // Add room creation state
  const [showRoomCreateModal, setShowRoomCreateModal] = useState(false);
  const {
    sessionId: storedSessionId,
    code: storedCode,
    setHostSession,
    clearHostSession,
  } = useHostSession();
  const {
    roomId: storedRoomId,
    roomCode: storedRoomCode,
    setHostRoom,
  } = useHostRoom();
  const [showBannedPlayersModal, setShowBannedPlayersModal] = useState(false);
  const [showVIBoxModal, setShowVIBoxModal] = useState(false);
  const [showVenueAuthPrompt, setShowVenueAuthPrompt] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isJoiningSession, setIsJoiningSession] = useState(false);
  
  const hostState = useHostState(storedSessionId);
  const {
    sessionId,
    setSessionId,
    showCreateModal,
    setShowCreateModal,
    isCreating,
    setIsCreating,
    showEditModal,
    setShowEditModal,
    isUpdatingSession,
    setIsUpdatingSession,
    createErrors,
    setCreateErrors,
    createForm,
    setCreateForm,
    showPromptLibraryModal,
    setShowPromptLibraryModal,
    isUpdatingPromptLibrary,
    setIsUpdatingPromptLibrary,
    hostGroupVotes,
    setHostGroupVotes,
    isSubmittingVote,
    setIsSubmittingVote,
    analytics,
    setAnalytics,
    isPerformingAction,
    setIsPerformingAction,
    isEndingSession,
    setIsEndingSession,
    isPausingSession,
    setIsPausingSession,
    showEndSessionModal,
    setShowEndSessionModal,
    kickingPlayerId,
    setKickingPlayerId,
    banningPlayerId,
    setBanningPlayerId,
    sessionRef,
    isPerformingActionRef,
  } = hostState;

  const canCreateSession = !authLoading && !venueAccountLoading && isVenueAccount;

  // Use the new application hooks - this replaces 4 separate hooks and multiple useMemo calls!
  const gameState = useGameState({ 
    sessionId: sessionId ?? undefined, 
    userId: user?.id 
  });

  // Use host recovery - DISABLED for room-based architecture
  // useHostRecovery({
  //   user,
  //   authLoading,
  //   isVenueAccount,
  //   venueAccountLoading,
  //   sessionId,
  //   setSessionId,
  //   setHostSession,
  //   setShowCreateModal,
  // });

  // Add session orchestrator for automatic phase advancement
  const orchestrator = useSessionOrchestrator({
    sessionId: sessionId || '',
    autoAdvance: true,
    enablePauseResume: true
  });

  // Extract data from gameState for compatibility with existing code
  const session = gameState.session;
  const players = useMemo(() => gameState.memberships, [gameState.memberships]);
  const answers = gameState.answers;
  const roomJoinCode = storedRoomCode ?? session?.code ?? storedCode ?? "";
  const inviteLink = useMemo(() => {
    const code = roomJoinCode;
    if (!code) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    if (!origin) return "";
    return `${origin}/join?code=${code}`;
  }, [roomJoinCode]);

  const { room, memberships: roomMemberships, refreshMembers } = useRoom({
    roomId: storedRoomId ?? undefined,
  });

  // Sync sessionId from room if it exists but we don't have it locally
  useEffect(() => {
    if (room?.currentSessionId && !sessionId) {
      setSessionId(room.currentSessionId);
      // Use room code for consistency
      setHostSession({ sessionId: room.currentSessionId, code: room.code });
    }
  }, [room, sessionId, setSessionId, setHostSession]);

  const roomLobbyMembers = useMemo(() => {
    if (!storedRoomId) return [];
    return roomMemberships.filter((member) =>
      !member.isHost && 
      !member.isBanned && 
      (member.status === "active" || member.status === "approved")
    );
  }, [storedRoomId, roomMemberships]);

  const lobbyTeams = useMemo(() => {
    if (!storedRoomId) {
      return players;
    }
    return roomLobbyMembers;
  }, [storedRoomId, roomLobbyMembers, players]);

  const lobbyPlayerCount = storedRoomId
    ? roomLobbyMembers.length
    : players.length;

  // Handle room creation success
  const handleRoomCreateSuccess = (newRoom: Room) => {
    setShowRoomCreateModal(false);
    setHostRoom({ roomId: newRoom.id, roomCode: newRoom.code });
  };

  // Automatically load venue account when HostPage mounts
  useEffect(() => {
    if (user && !user.is_anonymous && !venueAccountLoading && !isVenueAccount) {
      refreshVenueAccount().catch((error) => {
        console.error("Failed to load venue account on HostPage mount:", error);
      });
    }
  }, [user, venueAccountLoading, isVenueAccount, refreshVenueAccount]);

  // Show room creation modal when there's no session and user has venue account
  useEffect(() => {
    if (!storedRoomId && !venueAccountLoading && isVenueAccount) {
      setShowRoomCreateModal(true);
    } else if (!storedRoomId && !venueAccountLoading && !isVenueAccount) {
      setShowRoomCreateModal(false);
    }
  }, [storedRoomId, venueAccountLoading, isVenueAccount]);

  // Set sessionRef.current to latest session for auto advance actions.
  useEffect(() => {
    sessionRef.current = session ?? null;
    // Update orchestrator with current session
    if (session && 'updateSession' in orchestrator) {
      (orchestrator as any).updateSession(session);
    }
  }, [session, orchestrator]);

  // Helper to keep isPerformingAction state and ref synchronized
  const triggerPerformingAction = (value: boolean) => {
    isPerformingActionRef.current = value;
    setIsPerformingAction(value);
  };

  // Use gameState values instead of calculations
  const roundGroups = gameState.currentGroups;
  const totalGroups = roundGroups.length;

  // Vote Phase group info - use gameState values
  const activeGroup = gameState.activeVoteGroup;
  const activeGroupIndex = session?.voteGroupIndex ?? 0;

  // Use gameState voteCounts instead of calculation
  const voteCounts = gameState.voteCounts;

  // Answers for active voting group or all answers if not voting
  const activeGroupAnswers = useActiveGroupAnswers(answers, session, activeGroup);

  // Extract computations into custom hook
  const {
    leaderboard,
    selectedPromptLibraryId,
    currentPromptLibrary,
    activeGroupVote,
  } = useHostComputations({
    gameState,
    session,
    hostGroupVotes,
    activeGroup,
  });

// Extract effects into custom hook - DISABLED for room-based architecture
  // useHostEffects({
  //   session,
  //   sessionId,
  //   sessionSnapshotReady,
  //   sessionRef,
  //   setSessionId,
  //   setHostSession,
  //   clearHostSession,
  //   setShowCreateModal,
  //   setCurrentPhase,
  //   setAnalytics,
  //   setShowPromptLibraryModal,
  //   setHostGroupVotes,
  //   toast,
  // });

  // Map player IDs to display names for lookup
  const playerLookup = usePlayerLookup(players);

  // Use gameState roundSummaries with shared transformation
  const roundSummaries = transformRoundSummariesForUI(
    gameState.roundSummaries,
    roundGroups,
    players
  );

  // Instantiate handlers with current dependencies
  const createSessionHandler = handleCreateSession({
    user,
    authLoading,
    isVenueAccount,
    toast,
    setCreateErrors,
    isCreating, // Added this prop
    setIsCreating,
    setSessionId,
    setHostSession,
    setShowCreateModal,
    onSessionCreated: () => {
      // Only show prompt library modal for Classic mode
      if (createForm.gameMode === "classic") {
        setShowPromptLibraryModal(true);
      }
    },
    roomId: storedRoomId,
    gameMode: createForm.gameMode,
    selectedLibraries: createForm.selectedLibraries,
    totalRounds: createForm.totalRounds,
  });

  const updateSessionHandler = handleUpdateSession({
    user,
    authLoading,
    isVenueAccount,
    toast,
    setCreateErrors,
    isUpdating: isUpdatingSession,
    setIsUpdating: setIsUpdatingSession,
    sessionId: session?.id ?? "",
    onUpdated: ({ sessionId, code }) => {
      setSessionId(sessionId);
      setHostSession({ sessionId, code });
    },
    setShowEditModal,
    gameMode: createForm.gameMode,
    selectedLibraries: createForm.selectedLibraries,
    totalRounds: createForm.totalRounds,
  });

  const primaryActionHandler = handlePrimaryAction({
    session,
    players,
    isPerformingAction,
    triggerPerformingAction,
    toast,
    setShowCreateModal,
  });

  const confirmEndSessionHandler = handleEndSession({
    session,
    isEndingSession,
    setIsEndingSession,
    toast,
    setAnalytics,
    setHostGroupVotes,
  });

  const showEndSessionModalHandler = () => {
    setShowEndSessionModal(true);
  };

  // Room-based kick/ban handlers for lobby phase
  const roomKickPlayerHandler = handleRoomKickPlayer({
    toast,
    setKickingPlayerId,
    refresh: () => {
      // Use the proper refresh function from useRoom hook
      refreshMembers();
    },
  });

  const roomBanPlayerHandler = handleRoomBanPlayer({
    toast,
    setBanningPlayerId,
    refresh: () => {
      // Use the proper refresh function from useRoom hook
      refreshMembers();
    },
  });

  const copyLinkHandler = handleCopyLink({ toast: toast });

  const handlePauseToggle = useCallback(async () => {
    if (!session || isPausingSession) return;

    setIsPausingSession(true);
    try {
      await pauseSession({
        sessionId: session.id,
        pause: !session.paused
      });
      toast({
        title: session.paused ? "Session resumed" : "Session paused",
        variant: "success"
      });
    } catch (error: unknown) {
      toast({
        title: getErrorMessage(error, "Failed to pause/resume session"),
        variant: "error"
      });
    } finally {
      setIsPausingSession(false);
    }
  }, [session, isPausingSession, toast]);

  const handleLeaveSession = useCallback(() => {
    clearHostSession();
    setSessionId(null);
    setAnalytics(null);
    setHostGroupVotes({});
    setShowCreateModal(false);
    setShowPromptLibraryModal(false);
    setShowEndSessionModal(false);
  }, [clearHostSession, setSessionId, setAnalytics, setHostGroupVotes, setShowCreateModal, setShowPromptLibraryModal, setShowEndSessionModal]);

  const handlePromptLibrarySelect = useCallback(
    async (libraryId: PromptLibraryId) => {
      if (!session || session.status !== "lobby") return;
      if (isUpdatingPromptLibrary) return;
      const defaultId = await getDefaultPromptLibraryId();
      if (libraryId === (session.promptLibraryId ?? defaultId)) {
        return;
      }
      setIsUpdatingPromptLibrary(true);
      setPromptLibrary({ sessionId: session.id, promptLibraryId: libraryId })
        .then(() => {
          toast({
            title: "Prompt library updated! New prompts will be used next round.",
            variant: "success"
          });
        })
        .catch((error: unknown) => {
          toast({
            title: getErrorMessage(error, "Could not update prompts. Please try again."),
            variant: "error"
          });
        })
        .finally(() => {
          setIsUpdatingPromptLibrary(false);
        });
    },
    [session, isUpdatingPromptLibrary, toast],
  );

  const hostVoteHandler = handleHostVote({
    session,
    activeGroup,
    activeGroupVote,
    toast,
    setIsSubmittingVote,
    setHostGroupVotes,
    isSubmittingVote,
  });

  const requireVenueAccount = useCallback(() => {
    if (canCreateSession) {
      return true;
    }

    if (authLoading || venueAccountLoading) {
      toast({ title: "Checking your venue access...", variant: "info" });
    } else {
      setShowVenueAuthPrompt(true);
    }
    return false;
  }, [toast, authLoading, venueAccountLoading, canCreateSession]);

  const handleOpenCreateModal = useCallback(() => {
    if (!requireVenueAccount()) {
      return;
    }
    if (!storedRoomId) {
      setShowRoomCreateModal(true);
      return;
    }
    setShowCreateModal(true);
  }, [requireVenueAccount, setShowCreateModal, setShowRoomCreateModal, storedRoomId]);

  const handlePrimaryClick = useCallback(() => {
    if (!session) {
      if (!storedRoomId) {
        if (!requireVenueAccount()) {
          return;
        }
        setShowRoomCreateModal(true);
        return;
      }
      handleOpenCreateModal();
      return;
    }
    primaryActionHandler();
  }, [session, storedRoomId, requireVenueAccount, setShowRoomCreateModal, handleOpenCreateModal, primaryActionHandler]);

  const handleOpenEditModal = useCallback(() => {
    if (!requireVenueAccount()) {
      return;
    }
    if (!session) {
      return;
    }

    // Prefill the create form from the current session so hosts can "upsert" settings.
    const sessionSettings = session.settings ?? {};
    setCreateForm({
      venueName: session.venueName ?? "",
      gameMode: sessionSettings.gameMode === "mashup" ? "mashup" : "classic",
      selectedLibraries: Array.isArray(session.selectedLibraries) ? session.selectedLibraries : [],
      totalRounds: typeof sessionSettings.totalRounds === "number" ? sessionSettings.totalRounds : 5,
    });
    setCreateErrors({});
    setShowEditModal(true);
  }, [requireVenueAccount, session, setCreateErrors, setCreateForm, setShowEditModal]);

  const handleCreateModalClose = useCallback(() => {
    setShowCreateModal(false);
    if (!session && !storedRoomId) {
      navigate("/");
    }
  }, [setShowCreateModal, session, storedRoomId, navigate]);

  const handleJoinSession = useCallback(async (joinSessionId: string) => {
    setIsJoiningSession(true);
    try {
      // Verify the session exists
      const { data: sessionData, error } = await supabase
        .from('top_comment_sessions')
        .select('id, code')
        .eq('id', joinSessionId)
        .single();

      if (error || !sessionData) {
        toast({ title: 'Session not found', description: 'Please check the session ID and try again', variant: 'error' });
        setIsJoiningSession(false);
        return;
      }

      // Set the session in local storage
      setSessionId(joinSessionId);
      setHostSession({ sessionId: joinSessionId, code: sessionData.code });
      setShowJoinModal(false);
      toast({ title: 'Joined session successfully', variant: 'success' });
    } catch (error) {
      toast({ title: getErrorMessage(error, 'Failed to join session'), variant: 'error' });
    } finally {
      setIsJoiningSession(false);
    }
  }, [toast, setSessionId, setHostSession]);

  const promptLibraryCard =
    session && session.status === "lobby" ? (
      <Card className="flex flex-col gap-4" isDark={isDark}>
        <div className="flex items-start justify-between gap-2">
          <div className={`flex flex-col gap-1 ${!isDark ? 'text-slate-700' : 'text-cyan-100'}`}>
            <span className={`text-xs font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>
              Prompt library
            </span>
            {session.settings?.gameMode === "mashup" ? (
              <>
                <p className={`text-lg font-bold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
                  Mashup Mode
                </p>
                <p className={`text-sm ${!isDark ? 'text-slate-500' : 'text-cyan-300'}`}>
                  Rotating through {session.selectedLibraries?.length ?? 0} libraries
                </p>
              </>
            ) : currentPromptLibrary ? (
              <>
                <p className={`text-lg font-bold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
                  {currentPromptLibrary.emoji} {currentPromptLibrary.name}
                </p>
                <p className={`text-sm ${!isDark ? 'text-slate-500' : 'text-cyan-300'}`}>
                  {currentPromptLibrary.description}
                </p>
              </>
            ) : (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-400"></div>
                <p className={`ml-2 text-sm ${!isDark ? 'text-slate-500' : 'text-cyan-300'}`}>
                  Loading...
                </p>
              </div>
            )}
          </div>
          {session.settings?.gameMode === "classic" && (
            <Button
              variant="secondary"
              onClick={() => setShowPromptLibraryModal(true)}
              disabled={isUpdatingPromptLibrary}
            >
              {session.promptLibraryId ? "Change" : "Choose"} prompts
            </Button>
          )}
          {session.settings?.gameMode === "mashup" && (
            <Button
              variant="secondary"
              onClick={handleOpenEditModal}
            >
              Edit Libraries
            </Button>
          )}
        </div>
        {session.settings?.gameMode === "classic" && currentPromptLibrary && currentPromptLibrary.prompts.length > 0 && (
          <div className="space-y-2">
            <p className={`text-xs font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>
              Sample prompts
            </p>
            <div className="space-y-2">
              {currentPromptLibrary.prompts.slice(0, 3).map((prompt, index) => (
                <div
                  key={index}
                  className={`rounded-lg border px-3 py-2 text-sm ${!isDark ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-slate-600 bg-slate-700 text-cyan-100'}`}
                >
                  {prompt}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    ) : null;

  // Render phase-specific content
  const renderPhaseContent = () => {
    if (sessionId && !session) {
      return (
        <Card className="min-h-[360px] flex flex-col items-center justify-center gap-4" isDark={isDark}>
          <div className="animate-spin h-10 w-10 border-4 border-cyan-400 border-t-transparent rounded-full" />
          <p className="text-lg text-cyan-300 animate-pulse">
            Loading session state...
          </p>
        </Card>
      );
    }

    if (!session) {
      if (storedRoomId) {
        return (
          <div className="space-y-6">
            <LobbyPhase
              inviteLink={inviteLink}
              storedCode={roomJoinCode}
              sessionId={null}
              handleCopyLink={copyLinkHandler}
              sessionCode={roomJoinCode}
            />
            {room && (
              <HostInteractionManager
                room={{ id: room.id, code: room.code }}
                memberships={roomMemberships}
              />
            )}
          </div>
        );
      }
      return (
        <Card className="min-h-[360px] flex items-center justify-center" isDark={isDark}>
          <p className="text-lg text-cyan-300">
            Create a room to get started.
          </p>
        </Card>
      );
    }

    switch (session.status) {
      case "lobby":
        return (
          <div className="space-y-6">
            <LobbyPhase
              inviteLink={inviteLink}
              storedCode={roomJoinCode}
              sessionId={sessionId}
              handleCopyLink={copyLinkHandler}
              sessionCode={roomJoinCode}
            />
            {room && (
              <HostInteractionManager
                room={{ id: room.id, code: room.code }}
                memberships={roomMemberships}
              />
            )}
          </div>
        );

      case "answer":
        return (
          <AnswerPhase
            sessionRoundIndex={session.roundIndex}
            totalGroups={totalGroups}
            roundGroups={roundGroups}
            teamLookup={playerLookup}
            sessionEndsAt={session.endsAt}
            answerSecs={session.settings.answerSecs ?? 90}
            sessionPaused={session.paused}
            promptLibraryId={session.promptLibraryId}
          />
        );

      case "vote":
        return (
          <VotePhase
            totalGroups={totalGroups}
            activeGroupIndex={activeGroupIndex}
            activeGroup={activeGroup}
            roundGroups={roundGroups}
            activeGroupAnswers={activeGroupAnswers}
            voteCounts={voteCounts}
            activeGroupVote={activeGroupVote}
            handleHostVote={hostVoteHandler}
            isSubmittingVote={isSubmittingVote}
            roundSummaries={roundSummaries}
            sessionEndsAt={session.endsAt}
            voteSecs={session.settings.voteSecs ?? 90}
            sessionPaused={session.paused}
            votes={gameState.votes}
            teams={players}
            currentRoundIndex={session.roundIndex}
          />
        );

      case "results":
        return (
          <ResultsPhase
            sessionRoundIndex={session.roundIndex}
            roundSummaries={roundSummaries}
            voteCounts={voteCounts}
            sessionEndsAt={session.endsAt}
            resultsSecs={session.settings.resultsSecs ?? 12}
            sessionPaused={session.paused}
          />
        );

      case "ended":
        return <EndedPhase leaderboard={leaderboard} analytics={analytics} />;

      default:
        return null;
    }
  };

  // Presenter view button if session exists
  const presenterButton = session ? (
    <Button
      variant="ghost"
      onClick={() =>
        window.open(`/presenter/${session.id}`, "_blank", "noopener")
      }
    >
      Presenter View
    </Button>
  ) : null;

  // Responsive layout hook for mobile detection
  const { isMobile } = useResponsiveLayout();

  // Bottom navigation content for mobile
  const mobileBottomNav = (
    <>
      <button
        type="button"
        className="chaos-nav-item"
        onClick={() => navigate('/')}
      >
        <div className="text-2xl">🏠</div>
        <span className="chaos-nav-label">Home</span>
      </button>
      <button
        type="button"
        className="chaos-nav-item"
        onClick={() => setShowVIBoxModal(true)}
      >
        <div className="text-2xl">🎵</div>
        <span className="chaos-nav-label">VIBox</span>
      </button>
      <button
        type="button"
        className="chaos-nav-item"
        onClick={() => window.open('/help', '_blank')}
      >
        <div className="text-xl">❓</div>
        <span className="chaos-nav-label">Help</span>
      </button>
      <button
        type="button"
        className="chaos-nav-item"
        onClick={() => navigate('/profile')}
      >
        <div className="text-2xl">
          {user ? (
            <span className="text-sm font-semibold">
              {(user.user_metadata?.display_name?.[0] || user.email?.[0] || "U").toUpperCase()}
            </span>
          ) : (
            '👤'
          )}
        </div>
        <span className="chaos-nav-label">Profile</span>
      </button>
    </>
  );

  // Main content (shared between mobile and desktop)
  const mainContent = (
    <>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between" isDark={isDark}>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Link to="/" className="text-sm font-semibold text-cyan-400 hover:text-cyan-300">
                ← Back
              </Link>
              {presenterButton}
              <VIBoxButton 
                onClick={() => setShowVIBoxModal(true)}
                variant="host"
                size="lg"
              />
            </div>
            <div>
              <h1 className="text-3xl font-black text-pink-400">
                {room?.name || "Host Console"}
              </h1>
              {session ? (
                <p className="text-sm text-cyan-300">
                  {phaseCopy[session.status]}
                </p>
              ) : storedRoomId ? (
                <p className="text-sm text-cyan-300">
                  Room active. Waiting for players to join.
                </p>
              ) : (
                <p className="text-sm text-cyan-300">
                  Create a game room when you're ready to host.
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-2xl px-6 py-4 border bg-cyan-900/30 border-cyan-400/50">
            <span className="text-xs uppercase tracking-wider text-cyan-300">
              Room code
            </span>
            <span className="text-3xl font-black tracking-widest text-pink-400">
              {roomJoinCode || "---"}
            </span>
            {storedRoomId || session ? (
              <>
                <span className="text-xs text-cyan-400">
                  {lobbyPlayerCount} player{lobbyPlayerCount === 1 ? "" : "s"} online
                </span>
                {session && (
                  <div className="mt-1 flex flex-col items-center gap-1 border-t border-cyan-400/20 pt-2 w-full">
                    <span className="text-[10px] uppercase tracking-tighter text-cyan-500/70 font-bold">
                      Active Session
                    </span>
                    <span className="text-[10px] text-pink-400/80 font-mono">
                      {session.id.slice(0, 13)}
                    </span>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </Card>

        {!session && !venueAccountLoading && !canCreateSession && (
          <Card className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between" isDark={isDark}>
            <div>
              <p className={`text-sm font-semibold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
                Venue login required
              </p>
              <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                Sign in with your venue credentials before creating a new game.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowVenueAuthPrompt(true)}
            >
              Open venue login
            </Button>
          </Card>
        )}

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,_2fr)_minmax(0,_1fr)]">
          <div className="flex flex-col gap-6">
            {promptLibraryCard}
            {renderPhaseContent()}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handlePrimaryClick}
                disabled={
                  session
                    ? isPerformingAction ||
                    isUpdatingPromptLibrary ||
                  session.status === "ended" ||
                  (session.status === "lobby" && lobbyPlayerCount === 0)
                  : false
                }
                isLoading={session ? isPerformingAction : false}
              >
                {session ? actionLabel[session.status] : storedRoomId ? "Create session" : "Create room"}
              </Button>
              {session && session.status !== "lobby" && session.status !== "ended" && (
                <Button
                  variant="secondary"
                  onClick={handlePauseToggle}
                  disabled={isPausingSession}
                  isLoading={isPausingSession}
                >
                  {isPausingSession ? (
                    // Loading spinner
                    <svg
                      className="animate-spin w-4 h-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : session.paused ? (
                    // Play icon for resume
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                      />
                    </svg>
                  ) : (
                    // Pause icon for pause
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                      />
                    </svg>
                  )}
                  <span className="ml-2">
                    {isPausingSession ? "Loading..." : session.paused ? "Resume" : "Pause"}
                  </span>
                </Button>
              )}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={handleOpenCreateModal}
                  disabled={!!(session && session.status !== "ended")}
                  title={session && session.status !== "ended" ? "End the current session before starting a new one." : undefined}
                >
                  New session
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleOpenEditModal}
                  disabled={!session || session.status !== "lobby" || isUpdatingSession}
                  title={
                    !session
                      ? "Create or join a session first"
                      : session.status !== "lobby"
                        ? "Room settings can only be changed before the session starts."
                        : undefined
                  }
                >
                  Room settings
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowJoinModal(true)}
                >
                  Join session
                </Button>
                {session ? (
                  session.status === "ended" ? (
                    <Button variant="ghost" onClick={handleLeaveSession}>
                      Leave session
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={showEndSessionModalHandler}
                      disabled={isEndingSession}
                    >
                      End session
                    </Button>
                  )
                ) : null}
              </div>
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            {inviteLink ? (
              <QRCodeBlock value={inviteLink} caption="Scan to join!" isDark={isDark} />
            ) : (
              <div className="rounded-3xl p-6 text-center text-sm shadow-lg bg-slate-800 text-cyan-300 shadow-fuchsia-500/20">
                Create a room to generate a QR code for your guests.
              </div>
            )}
            {storedRoomId || session ? (
              <div className={`space-y-4 rounded-3xl p-5 shadow-lg border-[3px] ${!isDark ? 'bg-white shadow-slate-300/40 border-slate-200' : 'bg-slate-800 shadow-fuchsia-500/20 border-slate-600'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-pink-400">
                    Lobby ({lobbyPlayerCount})
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setShowBannedPlayersModal(true)}
                      className="text-xs text-purple-600"
                    >
                      View Banned
                    </Button>
                    <span className={`text-xs ${!isDark ? 'text-slate-500' : 'text-cyan-300'}`}>
                      Max {session?.settings.maxTeams ?? 24}
                    </span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {lobbyTeams.map((player) => (
                    <li
                      key={player.id}
                      className="flex items-center justify-between rounded-2xl px-4 py-3 bg-slate-700"
                    >
                      <span className="font-medium text-cyan-100">
                        {player.playerName}
                        {player.isHost ? " (Host)" : ""}
                      </span>
                      {!player.isHost ? (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => storedRoomId && roomKickPlayerHandler(player.id, player.userId || "", storedRoomId)}
                            className="text-sm text-orange-600"
                            disabled={kickingPlayerId !== null || banningPlayerId !== null}
                            isLoading={kickingPlayerId === player.id}
                          >
                            {kickingPlayerId === player.id ? "Kicking..." : "Kick"}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => storedRoomId && roomBanPlayerHandler(player.id, player.userId || "", storedRoomId)}
                            className="text-sm text-rose-600"
                            disabled={kickingPlayerId !== null || banningPlayerId !== null}
                            isLoading={banningPlayerId === player.id}
                          >
                            {banningPlayerId === player.id ? "Banning..." : "Ban"}
                          </Button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                  {!lobbyTeams.length ? (
                    <li className="rounded-2xl px-4 py-3 text-sm bg-slate-700 text-cyan-300">
                      Players will appear here as they join.
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </aside>
        </section>
      </div>

      <CreateRoomModal
        isOpen={showRoomCreateModal}
        onClose={() => setShowRoomCreateModal(false)}
        onSuccess={handleRoomCreateSuccess}
      />

      <CreateSessionModal
        open={showCreateModal}
        onClose={handleCreateModalClose}
        createForm={createForm}
        setCreateForm={setCreateForm}
        createErrors={createErrors}
        isCreating={isCreating}
        canCreateSession={canCreateSession}
        onSubmit={createSessionHandler}
      />
      <CreateSessionModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Room settings"
        submitLabel={isUpdatingSession ? "Saving..." : "Save settings"}
        createForm={createForm}
        setCreateForm={setCreateForm}
        createErrors={createErrors}
        isCreating={isUpdatingSession}
        canCreateSession={canCreateSession}
        onSubmit={updateSessionHandler}
      />
      <JoinSessionModal
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoin={handleJoinSession}
        isJoining={isJoiningSession}
      />

      <Modal
        open={showPromptLibraryModal && Boolean(session)}
        onClose={() => setShowPromptLibraryModal(false)}
        title="Choose a prompt library"
        isDark={isDark}
        footer={
          <Button variant="ghost" onClick={() => setShowPromptLibraryModal(false)}>
            Done
          </Button>
        }
      >
        {session ? (
          <div className="space-y-3">
            <PromptLibrarySelector
              selectedId={selectedPromptLibraryId}
              onSelect={handlePromptLibrarySelect}
              disabled={isUpdatingPromptLibrary || session.status !== "lobby"}
            />
            <p className="text-xs text-slate-400">
              You can switch decks any time before the first round begins.
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-300">
            Start a session to choose your prompt library.
          </p>
        )}
      </Modal>

      <Modal
        open={showEndSessionModal}
        onClose={() => setShowEndSessionModal(false)}
        title="End Session"
        isDark={isDark}
        footer={
          <div className="flex w-full items-center justify-between">
            <Button variant="ghost" onClick={() => setShowEndSessionModal(false)}>
              Back
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setShowEndSessionModal(false);
                confirmEndSessionHandler();
              }}
              disabled={isEndingSession}
              isLoading={isEndingSession}
            >
              Confirm
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-300">
          Are you sure you want to end this session? This action cannot be undone
          and all players will be disconnected.
        </p>
      </Modal>
      
      <BannedPlayersManager
        roomId={storedRoomId}
        isOpen={showBannedPlayersModal}
        onClose={() => setShowBannedPlayersModal(false)}
        toast={toast}
      />
      
      <VIBoxJukebox
        isOpen={showVIBoxModal}
        onClose={() => setShowVIBoxModal(false)}
        toast={toast}
        mode="host"
        allowUploads={true}
      />

      <Modal
        open={showVenueAuthPrompt}
        onClose={() => setShowVenueAuthPrompt(false)}
        title="Venue account required"
        isDark={isDark}
        footer={
          <div className="flex w-full items-center justify-between">
            <Button variant="ghost" onClick={() => setShowVenueAuthPrompt(false)}>
              Maybe later
            </Button>
            <Button
              onClick={() => {
                setShowVenueAuthPrompt(false);
                navigate("/venue-auth");
              }}
            >
              Go to venue login
            </Button>
          </div>
        }
      >
        <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-slate-300'}`}>
          Only approved venue accounts can start Söcial sessions. Use your venue
          credentials to sign in before creating a game.
        </p>
      </Modal>
      {/* Bottom Navigation Bar - Mobile only */}
      <nav className="bottom-nav sm:hidden">
        <button
          type="button"
          className="chaos-nav-item"
          onClick={() => navigate('/')}
        >
          <div className="text-2xl">🏠</div>
          <span className="chaos-nav-label">Home</span>
        </button>
        <button
          type="button"
          className="chaos-nav-item"
          onClick={() => setShowVIBoxModal(true)}
        >
          <div className="text-2xl">🎵</div>
          <span className="chaos-nav-label">VIBox</span>
        </button>
        <button
          type="button"
          className="chaos-nav-item"
          onClick={() => window.open('/help', '_blank')}
        >
          <div className="text-xl">❓</div>
          <span className="chaos-nav-label">Help</span>
        </button>
        <button
          type="button"
          className="chaos-nav-item"
          onClick={() => navigate('/profile')}
        >
          <div className="text-2xl">
            {user ? (
              <span className="text-sm font-semibold">
                {(user.user_metadata?.display_name?.[0] || user.email?.[0] || "U").toUpperCase()}
              </span>
            ) : (
              '👤'
            )}
          </div>
          <span className="chaos-nav-label">Profile</span>
        </button>
      </nav>

      {/* End of mainContent fragment */}
    </>
  );

  // Mobile layout with grid shell
  if (isMobile) {
    return (
      <MobileLayout 
        bottomNav={mobileBottomNav}
        className="bg-slate-950"
      >
        <div className="px-4 py-4 overflow-y-auto">
          {mainContent}
        </div>
      </MobileLayout>
    );
  }

  // Desktop layout (unchanged)
  return (
    <main className="min-h-screen px-4 py-8 bg-slate-950">
      {mainContent}
    </main>
  );
}

export default HostPage;

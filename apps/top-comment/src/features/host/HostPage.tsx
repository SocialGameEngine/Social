import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button, Card, Modal, QRCodeBlock } from "@social/ui";
import { PlayerAuthModal } from "../auth/PlayerAuthModal";
import { VenueAuthModal } from "../auth/VenueAuthModal";
import { VenueRoomChecker } from "../auth/VenueRoomChecker";

// Active Phase Layout Component
interface ActivePhaseLayoutProps {
  phaseTitle: string;
  phaseContent: React.ReactNode;
  sessionControls: React.ReactNode;
  sessionPlayers: React.ReactNode;
  room: any;
  roomMemberships: any[];
  pendingSubmissions: React.ReactNode;
}

function ActivePhaseLayout({
  phaseTitle,
  phaseContent,
  sessionControls,
  sessionPlayers,
  room,
  roomMemberships,
  pendingSubmissions,
  copyLinkHandler,
  roomJoinCode,
  inviteLink,
}: ActivePhaseLayoutProps & {
  copyLinkHandler: (link: string) => void;
  roomJoinCode: string;
  inviteLink: string;
}) {
  const { isDark } = useTheme();

  return (
    <div className="space-y-6">
      <Card className="space-y-5" isDark={isDark}>
        <div className="flex items-center justify-between">
          <h3 className={`text-xl font-semibold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
            {phaseTitle}
          </h3>
          <div className="flex gap-2">
            {sessionControls}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-1">
          <button
            type="button"
            onClick={() => copyLinkHandler(inviteLink)}
            className={`flex flex-col rounded-2xl border p-4 text-left shadow-sm transition hover:shadow-md ${!isDark ? 'border-slate-200 bg-white hover:border-brand-primary text-slate-900' : 'border-cyan-400/50 bg-slate-800 hover:border-cyan-400 text-white'}`}
          >
            <span className={`text-xs font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-500' : 'text-cyan-300'}`}>
              Shareable link
            </span>
            <span className={`mt-1 break-all font-medium ${!isDark ? 'text-brand-primary' : 'text-cyan-400'}`}>
              {inviteLink || roomJoinCode}
            </span>
          </button>
        </div>
        {phaseContent}
        {/* Session Players */}
        <div className={`border-t pt-5 ${!isDark ? 'border-slate-200' : 'border-cyan-400/20'}`}>
          {sessionPlayers}
        </div>
      </Card>
      
      {/* Interactions Panel: Room member management */}
      {room && (
        <Card className="space-y-5" isDark={isDark}>
          <div className={`border-t pt-5 ${!isDark ? 'border-slate-200' : 'border-cyan-400/20'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`text-sm font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>Interactions Panel</h4>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  Settings
                </Button>
              </div>
            </div>
            <HostInteractionManager
              room={{ id: room.id, code: room.code }}
              memberships={roomMemberships}
            />
          </div>
        </Card>
      )}
      {pendingSubmissions}
    </div>
  );
}

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
import { useSessionPlayers } from "./hooks/useSessionPlayers";
import { useHostKeyboardShortcuts } from "../../hooks/useHostKeyboardShortcuts";
import { useResponsiveLayout } from "../room/hooks/useResponsiveLayout";
import { useAudienceSubmissions } from "../../hooks/useAudienceSubmissions";
import { SubmissionReviewPanel } from "../room/components/submissions/SubmissionReviewPanel";
import type { PromptLibraryId } from "../../shared/promptLibraries";
import type { Room } from "../../shared/types";

export function HostPage() {
  const { user, loading: authLoading, isVenueAccount, venueAccountLoading, refreshVenueAccount, isGuest, signOut } = useAuth();
  const { toast } = useToast();
  const { isDark } = useTheme(); 
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Account button state
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showPlayerAuthModal, setShowPlayerAuthModal] = useState(false);
  const [showVenueAuthModal, setShowVenueAuthModal] = useState(false);
  const [venueRoomCreated, setVenueRoomCreated] = useState<string | null>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  
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
    loading: roomLoading,
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

  const { room, memberships: roomMemberships, refreshMembers } = useRoom({
    roomId: storedRoomId ?? undefined,  // This now comes from useHostRoom (venue room)
  });

  // Fetch session players from top_comment_players table
  const { players: sessionPlayers } = useSessionPlayers(sessionId);

  const roomJoinCode = storedRoomCode ?? room?.code ?? storedCode ?? "";
  const inviteLink = useMemo(() => {
    const code = roomJoinCode;
    if (!code) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    if (!origin) return "";
    return `${origin}/room/${code}`;
  }, [roomJoinCode]);

  // Sync sessionId from room if it exists but we don't have it locally
  useEffect(() => {
    if (room?.currentSessionId && !sessionId) {
      setSessionId(room.currentSessionId);
      // Use room code for consistency
      setHostSession({ sessionId: room.currentSessionId, code: room.code });
    }
  }, [room, sessionId, setSessionId, setHostSession]);

  // Sync stored session code with room code to prevent code mismatch on refresh
  useEffect(() => {
    if (room?.code && sessionId && storedCode && storedCode !== room.code) {
      // Update stored session to use room code instead of session code
      setHostSession({ sessionId, code: room.code });
    }
  }, [room?.code, sessionId, storedCode, setHostSession]);

  // Account button handlers
  const handlePlayerSignIn = () => {
    setShowAccountMenu(false);
    setShowPlayerAuthModal(true);
  };

  const handleVenueSignIn = () => {
    setShowAccountMenu(false);
    setShowVenueAuthModal(true);
  };

  const handleSignOut = async () => {
    if (!signOut) return;
    try {
      await signOut();
      setShowAccountMenu(false);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    if (showAccountMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAccountMenu]);

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

  // Host membership for audience submissions
  const hostMembership = useMemo(() => {
    return roomMemberships.find((m) => m.userId === user?.id && m.isHost);
  }, [roomMemberships, user?.id]);

  // Audience submissions (host review)
  const {
    submissions: allSubmissions,
    pendingCount: pendingSubmissionCount,
    approveSubmission,
    rejectSubmission,
  } = useAudienceSubmissions({ roomId: storedRoomId ?? undefined, membershipId: hostMembership?.id, isHost: true });

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
    if (!storedRoomId && !venueAccountLoading && !roomLoading && isVenueAccount) {
      setShowRoomCreateModal(true);
    } else if (!storedRoomId && !venueAccountLoading && !roomLoading && !isVenueAccount) {
      setShowRoomCreateModal(false);
    }
  }, [storedRoomId, venueAccountLoading, roomLoading, isVenueAccount]);

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
    isCreating,
    setIsCreating,
    setSessionId,
    setHostSession,
    setShowCreateModal,
    onSessionCreated: () => {
      // Refresh room data to get currentSessionId
      if (storedRoomId) {
        refreshMembers();
      }
    },
    roomId: storedRoomId,
    roomCode: storedRoomCode,
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
    onUpdated: ({ sessionId }) => {
      setSessionId(sessionId);
      // Always use room code to prevent room code from changing
      if (storedRoomCode) {
        setHostSession({ sessionId, code: storedRoomCode });
      } else {
        console.warn("Room code not available during session update");
      }
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

  // Keyboard shortcuts for host
  useHostKeyboardShortcuts({
    onPrimaryAction: handlePrimaryClick,
    onPauseToggle: handlePauseToggle,
  }, true);

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

  // Handle URL parameters for room updates
  useEffect(() => {
    const roomCode = searchParams.get('roomCode');
    console.log('🔍 URL Parameter Handler:', { 
      roomCode, 
      storedRoomCode, 
      shouldUpdate: roomCode && roomCode !== storedRoomCode 
    });
    
    if (roomCode && roomCode !== storedRoomCode) {
      console.log('🔍 Updating stored room to:', roomCode);
      setHostRoom({ roomId: roomCode, roomCode: roomCode });
    }
  }, [searchParams, storedRoomCode, setHostRoom]);

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
      // Always use room code to prevent room code from changing
      if (storedRoomCode) {
        setHostSession({ sessionId: joinSessionId, code: storedRoomCode });
      } else {
        console.warn("Room code not available when joining session");
      }
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

  // Session control buttons for lobby and ended states
  const sessionControlButtons = session && (session.status === "lobby" || session.status === "ended") ? (
    <div className="flex flex-wrap gap-2">
      {session.status === "lobby" ? (
        <>
          <Button
            variant="secondary"
            onClick={handleOpenCreateModal}
            disabled={true}
            title="End the current session before starting a new one."
          >
            New Session
          </Button>
          <Button
            variant="ghost"
            onClick={handleOpenEditModal}
            disabled={isUpdatingSession}
          >
            Session Settings
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowJoinModal(true)}
          >
            Load Session
          </Button>
          <Button
            variant="ghost"
            onClick={showEndSessionModalHandler}
            disabled={isEndingSession}
          >
            End Session
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="secondary"
            onClick={handleOpenCreateModal}
          >
            New Session
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowJoinModal(true)}
          >
            Load Session
          </Button>
          <Button
            variant="ghost"
            onClick={handleLeaveSession}
          >
            Leave Session
          </Button>
        </>
      )}
    </div>
  ) : null;

  // Session Panel: Session-specific controls (answer, vote, results phases)
  const activePhaseSessionControls = session && (session.status === "answer" || session.status === "vote" || session.status === "results") ? (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="ghost"
        onClick={handlePauseToggle}
        disabled={isPausingSession}
      >
        {session.paused ? "Resume" : "Pause"}
      </Button>
      <Button
        variant="ghost"
        onClick={showEndSessionModalHandler}
        disabled={isEndingSession}
      >
        End Session
      </Button>
      <Button
        variant="ghost"
        onClick={() => setShowJoinModal(true)}
      >
        Load Session
      </Button>
    </div>
  ) : null;

  
  // Lobby controls for when there's no active session
  const lobbyControls = !session && storedRoomId ? (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        onClick={handleOpenCreateModal}
      >
        Create Session
      </Button>
      <Button
        variant="ghost"
        onClick={() => setShowJoinModal(true)}
      >
        Load Session
      </Button>
    </div>
  ) : null;

  
  // Session players list using top_comment_players table for real-time updates
  const sessionPlayersList = session ? (
    <div className={`space-y-4 rounded-3xl p-5 shadow-lg border-[3px] ${!isDark ? 'bg-white shadow-slate-300/40 border-slate-200' : 'bg-slate-800 shadow-fuchsia-500/20 border-slate-600'}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-pink-400">
          Session Players ({sessionPlayers.length})
        </h3>
      </div>
      <ul className="space-y-2">
        {sessionPlayers.map((player) => (
          <li
            key={player.id}
            className="flex items-center justify-between rounded-2xl px-4 py-3 bg-slate-700"
          >
            <span className="font-medium text-cyan-100">
              {player.displayName || 'Anonymous'}
            </span>
            <span className="text-sm text-cyan-400">
              {player.score} pts
            </span>
          </li>
        ))}
        {!sessionPlayers.length ? (
          <li className="rounded-2xl px-4 py-3 text-sm bg-slate-700 text-cyan-300">
            Players will appear here when they join the session.
          </li>
        ) : null}
      </ul>
    </div>
  ) : null;

  // Action buttons content for lobby
  const lobbyActionButtons = session && session.status === "lobby" ? (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={handlePrimaryClick}
        disabled={
          isPerformingAction ||
          isUpdatingPromptLibrary ||
          lobbyPlayerCount === 0
        }
        isLoading={isPerformingAction}
      >
        {actionLabel[session.status]}
      </Button>
    </div>
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
              promptLibraryContent={null}
              sessionControls={lobbyControls}
              sessionPlayers={null}
              actionButtons={null}
            />
                        {/* Interactions Panel: Room member management */}
            {room && (
              <Card className="space-y-5" isDark={isDark}>
                <div className={`border-t pt-5 ${!isDark ? 'border-slate-200' : 'border-cyan-400/20'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`text-sm font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>Interactions Panel</h4>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        Settings
                      </Button>
                    </div>
                  </div>
                  <HostInteractionManager
                    room={{ id: room.id, code: room.code }}
                    memberships={roomMemberships}
                  />
                </div>
              </Card>
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
              promptLibraryContent={promptLibraryCard}
              sessionControls={sessionControlButtons}
              sessionPlayers={sessionPlayersList}
              actionButtons={lobbyActionButtons}
            />
                        {/* Interactions Panel: Room member management */}
            {room && (
              <Card className="space-y-5" isDark={isDark}>
                <div className={`border-t pt-5 ${!isDark ? 'border-slate-200' : 'border-cyan-400/20'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`text-sm font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>Interactions Panel</h4>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        Settings
                      </Button>
                    </div>
                  </div>
                  <HostInteractionManager
                    room={{ id: room.id, code: room.code }}
                    memberships={roomMemberships}
                  />
                </div>
              </Card>
            )}
          </div>
        );

      case "answer":
        return (
          <ActivePhaseLayout
            phaseTitle={`Answer Phase - Round ${session.roundIndex + 1}`}
            phaseContent={
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
            }
            sessionControls={activePhaseSessionControls}
            sessionPlayers={sessionPlayersList}
            room={room}
            roomMemberships={roomMemberships}
            pendingSubmissions={pendingSubmissionCount > 0 ? (
              <SubmissionReviewPanel
                submissions={allSubmissions}
                pendingCount={pendingSubmissionCount}
                isLoading={false}
                onApprove={approveSubmission}
                onReject={rejectSubmission}
              />
            ) : null}
            copyLinkHandler={copyLinkHandler}
            roomJoinCode={roomJoinCode}
            inviteLink={inviteLink}
          />
        );

      case "vote":
        return (
          <ActivePhaseLayout
            phaseTitle={`Vote Phase - Round ${session.roundIndex + 1}`}
            phaseContent={
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
            }
            sessionControls={activePhaseSessionControls}
            sessionPlayers={sessionPlayersList}
            room={room}
            roomMemberships={roomMemberships}
            pendingSubmissions={pendingSubmissionCount > 0 ? (
              <SubmissionReviewPanel
                submissions={allSubmissions}
                pendingCount={pendingSubmissionCount}
                isLoading={false}
                onApprove={approveSubmission}
                onReject={rejectSubmission}
              />
            ) : null}
            copyLinkHandler={copyLinkHandler}
            roomJoinCode={roomJoinCode}
            inviteLink={inviteLink}
          />
        );

      case "results":
        return (
          <ActivePhaseLayout
            phaseTitle={`Results - Round ${session.roundIndex + 1}`}
            phaseContent={
              <ResultsPhase
                sessionRoundIndex={session.roundIndex}
                roundSummaries={roundSummaries}
                voteCounts={voteCounts}
                sessionEndsAt={session.endsAt}
                resultsSecs={session.settings.resultsSecs ?? 12}
                sessionPaused={session.paused}
              />
            }
            sessionControls={activePhaseSessionControls}
            sessionPlayers={sessionPlayersList}
            room={room}
            roomMemberships={roomMemberships}
            pendingSubmissions={pendingSubmissionCount > 0 ? (
              <SubmissionReviewPanel
                submissions={allSubmissions}
                pendingCount={pendingSubmissionCount}
                isLoading={false}
                onApprove={approveSubmission}
                onReject={rejectSubmission}
              />
            ) : null}
            copyLinkHandler={copyLinkHandler}
            roomJoinCode={roomJoinCode}
            inviteLink={inviteLink}
          />
        );

      case "ended":
        return (
          <div className="space-y-6">
            <LobbyPhase
              inviteLink={inviteLink}
              storedCode={roomJoinCode}
              sessionId={sessionId}
              handleCopyLink={copyLinkHandler}
              promptLibraryContent={<EndedPhase leaderboard={leaderboard} analytics={analytics} />}
              sessionControls={sessionControlButtons}
              sessionPlayers={sessionPlayersList}
              actionButtons={null}
            />
                        {/* Interactions Panel: Room member management */}
            {room && (
              <Card className="space-y-5" isDark={isDark}>
                <div className={`border-t pt-5 ${!isDark ? 'border-slate-200' : 'border-cyan-400/20'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`text-sm font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>Interactions Panel</h4>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        Settings
                      </Button>
                    </div>
                  </div>
                  <HostInteractionManager
                    room={{ id: room.id, code: room.code }}
                    memberships={roomMemberships}
                  />
                </div>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Presenter view button - always show when room exists, but only enable when session exists
  const presenterButton = storedRoomId ? (
    <Button
      variant="ghost"
      onClick={() =>
        session && window.open(`/presenter/${session.id}`, "_blank", "noopener")
      }
      disabled={!session}
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
      {/* Account Button - Fixed top right */}
      <div className="fixed top-4 right-4 z-50">
        <div className="relative" ref={accountMenuRef}>
          <button
            onClick={() => user ? setShowAccountMenu(!showAccountMenu) : handleVenueSignIn()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-600/80 hover:bg-slate-500/80 hover:scale-110 hover:shadow-lg hover:shadow-pink-400/50 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            aria-label={user ? "Account menu" : "Sign in"}
            aria-expanded={showAccountMenu}
          >
            {user && !isGuest ? (
              <span className="text-slate-200 text-sm font-semibold">
                {(user.user_metadata?.display_name?.[0] || user.email?.[0] || "U").toUpperCase()}
              </span>
            ) : user && isGuest ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 text-pink-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 text-slate-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            )}
          </button>

          {/* Account Menu Dropdown */}
          {showAccountMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 rounded-xl bg-slate-800 border border-pink-400/50 shadow-lg shadow-pink-500/20 z-50 overflow-hidden">
              <div className="p-4 space-y-3">
                {user ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-pink-400">
                        {isVenueAccount ? "Venue Account" : "Player Account"}
                      </p>
                      {user.user_metadata?.display_name ? (
                        <p className="text-sm font-semibold text-pink-400">
                          {user.user_metadata.display_name}
                        </p>
                      ) : null}
                      {user.email ? (
                        <p className="text-sm text-cyan-300 break-all">
                          {user.email}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-400 italic">
                          No email
                        </p>
                      )}
                    </div>
                    {isGuest && (
                      <div className="pt-2 border-t border-slate-700">
                        <p className="text-xs text-slate-400">
                          Guest mode
                        </p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-700">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
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
                            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                          />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-pink-400">
                        Not signed in
                      </p>
                      <p className="text-sm text-slate-400">
                        Choose your account type to get started
                      </p>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={handlePlayerSignIn}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
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
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        Player Sign In
                      </button>
                      <button
                        onClick={handleVenueSignIn}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-pink-400 hover:text-pink-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
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
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Venue Sign In
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between" isDark={isDark}>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Link to="/" className="text-sm font-semibold text-cyan-400 hover:text-cyan-300">
                ← Back
              </Link>
              {presenterButton}
              {storedRoomCode && (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/analytics/${storedRoomCode}`)}
                  >
                    Analytics
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowEditModal(false);
                      setShowRoomCreateModal(true);
                    }}
                  >
                    Room Settings
                  </Button>
                </>
              )}
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
            {renderPhaseContent()}
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
            {/* Audience Question Submissions Review */}
            {(storedRoomId || session) && (
              <div className={`rounded-3xl shadow-lg border-[3px] overflow-hidden ${!isDark ? 'bg-white shadow-slate-300/40 border-slate-200' : 'bg-slate-800 shadow-fuchsia-500/20 border-slate-600'}`}>
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                  <h3 className="text-lg font-semibold text-pink-400">
                    Audience Questions
                  </h3>
                  {pendingSubmissionCount > 0 && (
                    <span className="text-xs font-bold bg-emerald-500 text-white rounded-full px-2 py-0.5">
                      {pendingSubmissionCount} pending
                    </span>
                  )}
                </div>
                <div className="max-h-[400px]">
                  <SubmissionReviewPanel
                    submissions={allSubmissions}
                    pendingCount={pendingSubmissionCount}
                    isLoading={false}
                    onApprove={approveSubmission}
                    onReject={rejectSubmission}
                  />
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>

      <CreateRoomModal
        isOpen={showRoomCreateModal}
        onClose={() => setShowRoomCreateModal(false)}
        onSuccess={handleRoomCreateSuccess}
        existingRoom={room}
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
        title="Session settings"
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
      
      {/* Venue Room Checker - Automatically shows CreateRoomModal if venue needs room */}
      <VenueRoomChecker 
        onRoomCreated={(roomCodeOrId) => {
          // Show success notification and stay on host page
          toast({
            title: "Venue Room Created!",
            description: `Room code: ${roomCodeOrId}`,
            variant: "success",
          });
          setVenueRoomCreated(roomCodeOrId);
          
          // Update stored room to the new venue room
          setHostRoom({ roomId: roomCodeOrId, roomCode: roomCodeOrId });
        }}
      />

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

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { Button, Card, Modal, QRCodeBlock } from "@social/ui";
import { PlayerAuthModal } from "../auth/PlayerAuthModal";
import { VenueAuthModal } from "../auth/VenueAuthModal";
import { VenueRoomChecker } from "../auth/VenueRoomChecker";


import { useGameState, useSessionOrchestrator, transformRoundSummariesForUI } from "../../application";
import { useRoomV2 } from "../../hooks/useRoomV2";
import { VIBoxJukebox } from "../../shared/components/vibox/VIBoxJukebox";
import { useActiveGroupAnswers, usePlayerLookup, useToast } from "../../shared/hooks";
import { useAuth } from "../../shared/providers/AuthContext";
import { useTheme } from "../../shared/providers/ThemeProvider";
import { actionLabel, getDefaultPromptLibraryId, phaseCopy } from "../../shared/constants";
import { getErrorMessage } from "../../shared/utils/errors";
import { logger } from "../../shared/utils/logger";
import { supabase } from "../../supabase/client";
import {
  AnswerPhase,
  VotePhase,
  ResultsPhase,
  EndedPhase,
  CreateSessionModal,
  JoinSessionModal,
  JoinSocialeModal,
} from "./Phases";
import { CreateRoomModal } from "./components/CreateRoomModal";
import { PromptLibrarySelector } from "./components/PromptLibrarySelector";
import { BannedPlayersManager } from "./components/BannedPlayersManager";
import { HostInteractionsPanel } from "./components/HostInteractionsPanel";
import { SessionsPanel } from "./components/SessionsPanel";
import { SocialesPanel } from "./components/SocialesPanel";
import { SocialeCreateModal } from "./components/SocialeCreateModal";
import { handleCopyLink, handleCreateSession, handleUpdateSession, handleEndSession, handleHostVote, handlePrimaryAction, handleSocialePrimaryAction } from "./Handlers";
import { handleRoomKickPlayer, handleRoomBanPlayer } from "./Handlers/roomKickBanHandlers";
import { setPromptLibrary, pauseSession } from "../session/sessionService";
import { pauseSociale } from "../sociale/socialeService";
import { useSocialites } from "../sociale/hooks/useSocialites";
import { roomService } from "../../services/roomService";
import { useHostRoomV2 } from "./useHostRoomV2";
import { useHostSessionV2 } from "./useHostSessionV2";
import { useHostComputations, useHostState, useHostModalState } from "./hooks";
import { useSessionPlayers } from "./hooks/useSessionPlayers";
import { useHostRoomRecovery } from "./hooks/useHostRoomRecovery";
import { useHostKeyboardShortcuts } from "../../hooks/useHostKeyboardShortcuts";
import { useAudienceSubmissions } from "../../hooks/useAudienceSubmissions";
import { SubmissionReviewPanel } from "../room/components/submissions/SubmissionReviewPanel";
import { HostPanelV2 } from "./components/HostPanelV2";
import { HostAccountMenu } from "./components/HostAccountMenu";
import { HostPromptLibraryCard } from "./components/HostPromptLibraryCard";
import { HostControlButtons } from "./components/HostControlButtons";
import { HostSidePanel } from "./components/HostSidePanel";
import { useSessionTimer } from "./hooks";
import { useSessionMachine } from "./state";
import { useCommandPalette, CommandPalette } from "./components/shell";
import type { PromptLibraryId } from "../../shared/promptLibraries";
import type { Room } from "../../shared/types";
import { useVenueAccountResolver } from './useVenueAccountResolver';
import { useCreateSociale, useSociale, useSocialesByRoom, useUpdateSociale } from "../sociale";

export function HostPage() {
  const { user, loading: authLoading, isAnonymous, signOut } = useAuth();
  const { venueAccount, loading: venueAccountLoading, refresh: refreshVenueAccount } = useVenueAccountResolver();
  const isVenueAccount = Boolean(venueAccount?.isActive);
  const { toast } = useToast();
  const { isDark } = useTheme(); 
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  // Modal state - consolidated into single hook
  const modalState = useHostModalState();
  const {
    showAccountMenu,
    setShowAccountMenu,
    showPlayerAuthModal,
    setShowPlayerAuthModal,
    showVenueAuthModal,
    setShowVenueAuthModal,
    setVenueRoomCreated,
    accountMenuRef,
    roomModalMode,
    setRoomModalMode,
    showRoomCreateModal,
    setShowRoomCreateModal,
    activeSocialeId,
    setActiveSocialeId,
    showSocialeModal,
    setShowSocialeModal,
    showBannedPlayersModal,
    setShowBannedPlayersModal,
    showVIBoxModal,
    setShowVIBoxModal,
    showVenueAuthPrompt,
    setShowVenueAuthPrompt,
    showJoinModal,
    setShowJoinModal,
    isJoiningSession,
    setIsJoiningSession,
    showJoinSocialeModal,
    setShowJoinSocialeModal,
    isJoiningSociale,
    setIsJoiningSociale,
    isRoomMembersOpen,
    setIsRoomMembersOpen,
  } = modalState;
  
  // Always call hooks (React rules), but conditionally use data
  const hostSessionData = useHostSessionV2();
  const hostRoomData = useHostRoomV2();
  
  // Always destructure from hooks (React rules), apply conditions on values
  const {
    sessionId: _rawSessionId,
    code: _rawSessionCode,
    isValidated: _sessionValidated,
    recoveryState: _sessionRecoveryState,
    setHostSession,
    clearHostSession,
  } = hostSessionData;
  
  const {
    roomId: _rawRoomId,
    code: _rawRoomCode,
    isValidated: _roomValidated,
    recoveryState: _roomRecoveryState,
    setHostRoom,
  } = hostRoomData;
  
  // Only use hook data when user is authenticated
  const shouldUseHostHooks = !authLoading && user && !user.is_anonymous;
  const storedSessionId = shouldUseHostHooks ? _rawSessionId : null;
  const storedCode = shouldUseHostHooks ? _rawSessionCode : null;
  const storedRoomId = shouldUseHostHooks ? _rawRoomId : null;
  const storedRoomCode = shouldUseHostHooks ? _rawRoomCode : null;
  
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

  // Use host room recovery for room-based architecture
  const roomRecovery = useHostRoomRecovery({
    user,
    authLoading,
    isVenueAccount,
    venueAccountLoading,
    roomId: storedRoomId,
    setRoomId: () => {}, // Not used - recovery calls setHostRoom directly
    setHostRoom,
    setShowRoomCreateModal,
  });

  // Derive complete bootstrap state - must wait for room existence to be resolved
  const isBootstrapComplete = !authLoading && !venueAccountLoading && 
    (roomRecovery.roomExistenceState === 'room_found' || 
     roomRecovery.roomExistenceState === 'no_room_confirmed' || 
     roomRecovery.roomExistenceState === 'error');

  const canCreateSession = isBootstrapComplete && isVenueAccount;

  // Add session orchestrator for automatic phase advancement
  const orchestrator = useSessionOrchestrator({
    sessionId: sessionId || '',
    autoAdvance: true,
    enablePauseResume: true,
  });

  // Use the new application hooks - this replaces 4 separate hooks and multiple useMemo calls!
  const gameState = useGameState({
    sessionId: sessionId ?? undefined,
    userId: user?.id,
  });

  // Extract data from gameState for compatibility with existing code
  const session = gameState.session;
  const players = useMemo(() => gameState.memberships, [gameState.memberships]);
  const answers = gameState.answers;

  // V2 HOOK: Use async room hook
  const {
    status: _roomStatus,
    data: roomData,
    error: _roomError,
    connectionStatus: _roomConnectionStatus,
    retry: _retryRoom,
    refreshMembers,
  } = useRoomV2({
    roomId: storedRoomId ?? undefined,  // This now comes from useHostRoomV2 (venue room)
  });

  // Extract room data from v2 hook
  const room = roomData?.room;
  const roomMemberships = roomData?.memberships || [];

  const primarySocialeId = room?.currentSocialeId ?? activeSocialeId;
  const activeSocialeQuery = useSociale(primarySocialeId ?? undefined);
  const socialsByRoomQuery = useSocialesByRoom(storedRoomId ?? undefined);
  const createSociale = useCreateSociale();
  const updateSociale = useUpdateSociale();

  // Fetch session players from top_comment_players table
  const { players: sessionPlayers } = useSessionPlayers(sessionId);

  const roomJoinCode = (user && !user.is_anonymous) ? (storedRoomCode ?? room?.code ?? storedCode ?? "") : "";
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

  // Sync activeSocialeId from room.currentSocialeId so host UI follows the canonical pointer.
  useEffect(() => {
    if (room?.currentSocialeId && !activeSocialeId) {
      setActiveSocialeId(room.currentSocialeId);
    }
    // When the room pointer is cleared, keep local state in sync for safety.
    if (!room?.currentSocialeId && activeSocialeId) {
      setActiveSocialeId(null);
    }
  }, [room?.currentSocialeId, activeSocialeId]);

  // Account button handlers (passed to HostAccountMenu)
  const handlePlayerSignIn = () => {
    setShowPlayerAuthModal(true);
  };

  const handleVenueSignIn = () => {
    setShowVenueAuthModal(true);
  };

  const roomLobbyMembers = useMemo(() => {
    if (!storedRoomId || !room) return [];
    // Check if member is NOT a moderator (host)
    return roomMemberships.filter((member) =>
      !room.moderatorIds.includes(member.userId) && 
      !member.isBanned && 
      (member.status === "active" || member.status === "approved")
    );
  }, [storedRoomId, roomMemberships, room]);

  // Fetch socialites for active Sociale
  const activeSociale = activeSocialeQuery.data;
  const { data: socialites = [] } = useSocialites(activeSociale?.id);

  // Session players for active session display, room members for lobby
  const lobbyTeams = useMemo(() => {
    // When Sociale is active, show socialites (players who joined the Sociale)
    if (activeSociale && socialites.length > 0) {
      return socialites.filter(s => s.isActive && !s.isBanned);
    }
    // When session is active, show session players
    if (session && sessionPlayers.length > 0) {
      return sessionPlayers;
    }
    // Otherwise show room members
    if (storedRoomId) {
      return roomLobbyMembers;
    }
    return players;
  }, [activeSociale, socialites, session, sessionPlayers, storedRoomId, roomLobbyMembers, players]);

  // Player count should match lobbyTeams
  const lobbyPlayerCount = lobbyTeams.length;

  // Host membership for audience submissions
  const hostMembership = useMemo(() => {
    if (!user || !room) return undefined;
    // Check if user is a moderator (host)
    const isModerator = room.moderatorIds.includes(user.id);
    return roomMemberships.find((m) => m.userId === user.id && isModerator);
  }, [roomMemberships, user, room]);

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
    setHostRoom({ roomId: newRoom.id, code: newRoom.code });
  };

  // Handler functions for modals
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

  const handleOpenSocialeSettings = useCallback(() => {
    if (!requireVenueAccount()) {
      return;
    }
    if (!storedRoomId) {
      setShowRoomCreateModal(true);
      return;
    }
    setShowSocialeModal(true);
  }, [requireVenueAccount, storedRoomId, setShowRoomCreateModal]);

  const handleCreateNewSession = useCallback(() => {
    if (!requireVenueAccount()) {
      return;
    }
    if (!storedRoomId) {
      // If no room, we need to create one first
      setShowRoomCreateModal(true);
      return;
    }
    // If room exists, create a new session
    setShowCreateModal(true);
  }, [requireVenueAccount, setShowCreateModal, setShowRoomCreateModal, storedRoomId]);

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

  const handleOpenSocialeModal = useCallback(() => {
    if (!requireVenueAccount()) {
      return;
    }
    if (!storedRoomId) {
      setShowRoomCreateModal(true);
      return;
    }
    setShowSocialeModal(true);
  }, [requireVenueAccount, setShowSocialeModal, setShowRoomCreateModal, storedRoomId]);

  // Clear stored data when user signs out
  useEffect(() => {
    if (!user || user.is_anonymous) {
      // Clear any stored session/room data when user is not authenticated
      clearHostSession();
      setHostRoom({ roomId: '', code: '' });
    }
  }, [user, clearHostSession, setHostRoom]);

  // Automatically load venue account when HostPage mounts
  useEffect(() => {
    if (user && !user.is_anonymous && !venueAccountLoading && !isVenueAccount) {
      refreshVenueAccount().catch((error) => {
        logger.error('Failed to load venue account on HostPage mount', { error });
      });
    }
  }, [user, venueAccountLoading, isVenueAccount, refreshVenueAccount]);

  // Auto-open create modal ONLY when room existence is conclusively "no_room_confirmed"
  // This effect handles AUTOMATIC modal opening, NOT manual settings button
  useEffect(() => {
    // Never auto-open for unauthenticated users
    if (!user || user.is_anonymous) {
      if (roomModalMode === 'create') {
        setRoomModalMode(null);
      }
      return;
    }
    
    // CRITICAL: Only make decisions when bootstrap is COMPLETE
    if (!isBootstrapComplete) {
      // Force modal closed during bootstrap to prevent flicker
      if (roomModalMode === 'create') {
        setRoomModalMode(null);
      }
      return;
    }
    
    // At this point, bootstrap is complete - make final decision based on room existence state
    // ONLY auto-open when room existence is conclusively "no_room_confirmed"
    const shouldAutoOpenCreate = isVenueAccount && 
      roomRecovery.roomExistenceState === 'no_room_confirmed';
    
    // Only auto-open in "create" mode, never close "settings" mode
    if (shouldAutoOpenCreate && roomModalMode === null) {
      setRoomModalMode('create');
    } else if (!shouldAutoOpenCreate && roomModalMode === 'create') {
      setRoomModalMode(null);
    }
    // IMPORTANT: Never auto-close "settings" mode - user must close manually
  }, [user, isBootstrapComplete, roomRecovery.roomExistenceState, isVenueAccount, roomModalMode, authLoading, venueAccountLoading]);

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
        logger.warn('Room code not available during session update');
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

  const socialePrimaryActionHandler = handleSocialePrimaryAction({
    sociale: activeSocialeQuery.data ?? null,
    roomId: storedRoomId ?? '',
    isPerformingAction,
    triggerPerformingAction,
    toast,
    setShowCreateModal: setShowSocialeModal,
    queryClient,
  });

  const confirmEndSessionHandler = handleEndSession({
    session,
    isEndingSession,
    setIsEndingSession,
    toast,
    setAnalytics,
    setHostGroupVotes,
  });

  const handleEndSocialeClick = useCallback(async () => {
    const activeSociale = activeSocialeQuery.data;
    if (!activeSociale || !storedRoomId) return;

    setIsEndingSession(true);
    try {
      await roomService.endSocialeInRoom({
        roomId: storedRoomId,
        socialeId: activeSociale.id,
        mode: 'end',
      });
      toast({
        title: "Sociale ended",
        variant: "success"
      });
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['room', storedRoomId] });
      queryClient.invalidateQueries({ queryKey: ['sociale', activeSociale.id] });
    } catch (error: unknown) {
      toast({
        title: getErrorMessage(error, "Failed to end Sociale"),
        variant: "error"
      });
    } finally {
      setIsEndingSession(false);
    }
  }, [activeSocialeQuery.data, storedRoomId, toast, queryClient]);

  const showEndSessionModalHandler = useCallback(() => {
    // If Sociale is active, end it directly without modal
    const activeSociale = activeSocialeQuery.data;
    if (activeSociale) {
      handleEndSocialeClick();
      return;
    }
    // Otherwise show Session end modal
    setShowEndSessionModal(true);
  }, [activeSocialeQuery.data, handleEndSocialeClick]);

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
    // Handle Sociale pause/resume
    const activeSociale = activeSocialeQuery.data;
    if (activeSociale && !isPausingSession) {
      setIsPausingSession(true);
      try {
        const result = await pauseSociale(activeSociale.id, activeSociale.status !== 'paused');
        toast({
          title: result.status === 'paused' ? "Sociale paused" : "Sociale resumed",
          variant: "success"
        });
      } catch (error: unknown) {
        toast({
          title: getErrorMessage(error, "Failed to pause/resume Sociale"),
          variant: "error"
        });
      } finally {
        setIsPausingSession(false);
      }
      return;
    }

    // Handle Session pause/resume (original logic)
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
  }, [session, activeSocialeQuery.data, isPausingSession, toast]);

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

  const handlePrimaryClick = useCallback(() => {
    // Determine which game type is active
    const activeSociale = activeSocialeQuery.data;
    
    // If no session and no Sociale
    if (!session && !activeSociale) {
      if (!storedRoomId) {
        if (!requireVenueAccount()) {
          return;
        }
        setShowRoomCreateModal(true);
        return;
      }
      // Room exists but no game - open Sociale modal (Sociales are the new default)
      handleOpenSocialeModal();
      return;
    }
    
    // If Sociale is active, use Sociale handler
    if (activeSociale) {
      socialePrimaryActionHandler();
      return;
    }
    
    // Otherwise use Session handler
    primaryActionHandler();
  }, [session, activeSocialeQuery.data, storedRoomId, requireVenueAccount, setShowRoomCreateModal, handleOpenSocialeModal, primaryActionHandler, socialePrimaryActionHandler]);

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
    
    if (roomCode && roomCode !== storedRoomCode) {
      setHostRoom({ roomId: roomCode, code: roomCode });
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
        logger.warn('Room code not available when joining session');
      }
      setShowJoinModal(false);
      toast({ title: 'Joined session successfully', variant: 'success' });
    } catch (error) {
      toast({ title: getErrorMessage(error, 'Failed to join session'), variant: 'error' });
    } finally {
      setIsJoiningSession(false);
    }
  }, [toast, setSessionId, setHostSession]);

  const handleJoinSociale = async (socialeId: string) => {
    setIsJoiningSociale(true);
    try {
      // Set the room's current_sociale_id to the selected Sociale
      if (storedRoomId) {
        const { error } = await supabase
          .from('rooms')
          .update({ current_sociale_id: socialeId } as any)
          .eq('id', storedRoomId);

        if (error) {
          throw new Error(`Failed to set room pointer: ${error.message}`);
        }

        // Update local state
        setActiveSocialeId(socialeId);
        setShowJoinSocialeModal(false);
        toast({ title: 'Sociale loaded successfully', variant: 'success' });
      } else {
        throw new Error('No room found');
      }
    } catch (error) {
      toast({ title: getErrorMessage(error, 'Failed to load Sociale'), variant: 'error' });
    } finally {
      setIsJoiningSociale(false);
    }
  };

  const promptLibraryCard = session && session.status === "lobby" ? (
    <HostPromptLibraryCard
      session={session}
      currentPromptLibrary={currentPromptLibrary}
      isUpdatingPromptLibrary={isUpdatingPromptLibrary}
      isDark={isDark}
      onChangePrompts={() => setShowPromptLibraryModal(true)}
      onEditLibraries={handleOpenEditModal}
    />
  ) : null;

  // Control buttons - consolidated into single component
  const controlButtons = (
    <HostControlButtons
      session={session}
      activeSociale={activeSocialeQuery.data ?? null}
      storedRoomId={storedRoomId}
      isPerformingAction={isPerformingAction}
      isPausingSession={isPausingSession}
      isEndingSession={isEndingSession}
      isUpdatingSession={isUpdatingSession}
      onPrimaryClick={handlePrimaryClick}
      onPauseToggle={handlePauseToggle}
      onEndSession={showEndSessionModalHandler}
      onCreateNewSession={handleCreateNewSession}
      onOpenEditModal={handleOpenEditModal}
      onJoinModal={() => setShowJoinModal(true)}
      onLeaveSession={handleLeaveSession}
      onOpenSocialeModal={handleOpenSocialeModal}
      onJoinSocialeModal={() => setShowJoinSocialeModal(true)}
    />
  );

  // Keep these for backward compatibility with existing code
  const sessionControlButtons = controlButtons;
  const activePhaseSessionControls = controlButtons;
  const lobbyControls = controlButtons;

  
  
  const renderSocialesPanel = () => {
    if (!storedRoomId) return null;
    return (
      <SocialesPanel
        isDark={isDark}
        roomId={storedRoomId ?? ''}
        userId={user?.id}
        primarySocialeId={primarySocialeId}
        onSocialeChange={setActiveSocialeId}
        onOpenSocialeSettings={handleOpenSocialeSettings}
        onOpenLoadSociale={() => setShowJoinSocialeModal(true)}
      />
    );
  };

  const renderHostInteractionsPanel = () => (
    <HostInteractionsPanel
      isDark={isDark}
      room={room ? { id: room.id, code: room.code } : null}
      roomMemberships={roomMemberships}
      onOpenSettings={handleOpenSocialeSettings}
    />
  );

  const renderHostMainStack = (sessionsPanel: JSX.Element | null) => (
    <div className="space-y-6">
      {renderSocialesPanel()}
      {sessionsPanel}
      {renderHostInteractionsPanel()}
    </div>
  );

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
        // If there's an active Sociale, show the panel with the Sociale content underneath
        if (primarySocialeId) {
          return renderHostMainStack(null);
        }
        
        return renderHostMainStack(
          <SessionsPanel
            isDark={isDark}
            session={null}
            sessionId={null}
            sessionControls={lobbyControls}
            copyLinkHandler={copyLinkHandler}
            roomJoinCode={roomJoinCode}
            inviteLink={inviteLink}
          />
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
        return renderHostMainStack(
          <SessionsPanel
            isDark={isDark}
            session={session}
            sessionId={sessionId}
            sessionControls={sessionControlButtons}
            promptLibraryContent={promptLibraryCard}
            copyLinkHandler={copyLinkHandler}
            roomJoinCode={roomJoinCode}
            inviteLink={inviteLink}
          />
        );

      case "answer":
        return renderHostMainStack(
          <SessionsPanel
            isDark={isDark}
            session={session}
            sessionId={sessionId}
            sessionControls={activePhaseSessionControls}
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
        return renderHostMainStack(
          <SessionsPanel
            isDark={isDark}
            session={session}
            sessionId={sessionId}
            sessionControls={activePhaseSessionControls}
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
        return renderHostMainStack(
          <SessionsPanel
            isDark={isDark}
            session={session}
            sessionId={sessionId}
            sessionControls={activePhaseSessionControls}
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
        return renderHostMainStack(
          <SessionsPanel
            isDark={isDark}
            session={session}
            sessionId={sessionId}
            sessionControls={sessionControlButtons}
            promptLibraryContent={<EndedPhase leaderboard={leaderboard} analytics={analytics} />}
            copyLinkHandler={copyLinkHandler}
            roomJoinCode={roomJoinCode}
            inviteLink={inviteLink}
          />
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

  // Session state machine integration
  const sessionMachine = useSessionMachine(session, roomMemberships.length);

  // Command palette for desktop shortcuts
  const commandPalette = useCommandPalette();
  const settingsSociale =
    activeSocialeQuery.data ??
    socialsByRoomQuery.data?.find((s) => s.id === primarySocialeId) ??
    null;

  // Session timer - real-time countdown based on phase
  const sessionTimer = useSessionTimer({ session });
  const timer = sessionTimer.remainingSeconds;

  // Room members dropdown state (now in modalState)

  // Command definitions for command palette
  const commands = useMemo(() => [
    {
      id: 'advance-phase',
      label: 'Advance Phase',
      description: 'Move to next session phase',
      shortcut: 'Space',
      category: 'session' as const,
      action: handlePrimaryClick,
      disabled: !sessionMachine.canAdvance || isPerformingAction,
    },
    {
      id: 'pause-resume',
      label: session?.paused ? 'Resume Session' : 'Pause Session',
      description: session?.paused ? 'Resume the current session' : 'Pause the current session',
      shortcut: 'P',
      category: 'session' as const,
      action: handlePauseToggle,
      disabled: !sessionMachine.canPause || isPausingSession,
    },
    {
      id: 'end-session',
      label: 'End Session',
      description: 'End the current session for all players',
      shortcut: 'E',
      category: 'session' as const,
      action: showEndSessionModalHandler,
      disabled: !sessionMachine.canEndSession || isEndingSession,
    },
    {
      id: 'create-sociale',
      label: 'Create Sociale',
      description: 'Start a new Sociale',
      shortcut: 'N',
      category: 'session' as const,
      action: handleOpenSocialeModal,
      disabled: !canCreateSession || isCreating,
    },
    {
      id: 'toggle-participants',
      label: 'Show Participants',
      description: 'Open participants panel',
      shortcut: 'Tab',
      category: 'participants' as const,
      action: () => {
        // TODO: Implement participants sheet toggle
        toast({
          title: 'Participants panel',
          description: 'Coming soon in Phase 2',
          variant: 'info',
        });
      },
    },
  ], [
    sessionMachine.canAdvance,
    sessionMachine.canPause, 
    sessionMachine.canEndSession,
    session?.paused,
    isPerformingAction,
    isPausingSession,
    isEndingSession,
    canCreateSession,
    isCreating,
    handlePrimaryClick,
    handlePauseToggle,
    showEndSessionModalHandler,
    handleOpenCreateModal,
    toast,
  ]);

  // Record command usage
  const handleCommandExecuted = useCallback((commandId: string) => {
    commandPalette.recordCommand(commandId);
  }, [commandPalette]);

   
  // Main content (shared between mobile and desktop)
  const mainContent = (
    <>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between" isDark={isDark}>
          <div className="space-y-3">
            {/* Host Console header - moved to top */}
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
            
            {/* Navigation buttons - wrap on mobile to prevent overflow */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {presenterButton}
              {storedRoomCode && user && !user.is_anonymous && (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/analytics/${storedRoomCode}`)}
                    className="text-xs sm:text-sm"
                  >
                    Analytics
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowEditModal(false);
                      setRoomModalMode('settings');
                    }}
                    className="text-xs sm:text-sm"
                  >
                    Room Settings
                  </Button>
                </>
              )}
              <button
                onClick={() => setShowVIBoxModal(true)}
                className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 whitespace-nowrap"
              >
                Vibox
              </button>
            </div>
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

          <HostSidePanel
            inviteLink={inviteLink}
            roomJoinCode={roomJoinCode}
            isDark={isDark}
            storedRoomId={storedRoomId}
            session={session}
            room={room}
            roomLobbyMembers={roomLobbyMembers}
            isRoomMembersOpen={isRoomMembersOpen}
            setIsRoomMembersOpen={setIsRoomMembersOpen}
            kickingPlayerId={kickingPlayerId}
            banningPlayerId={banningPlayerId}
            onKickPlayer={roomKickPlayerHandler}
            onBanPlayer={roomBanPlayerHandler}
            onShowBannedPlayers={() => setShowBannedPlayersModal(true)}
            onCopyLink={copyLinkHandler}
            allSubmissions={allSubmissions}
            pendingSubmissionCount={pendingSubmissionCount}
            onApproveSubmission={approveSubmission}
            onRejectSubmission={rejectSubmission}
          />
        </section>
      </div>

      <CreateRoomModal
        isOpen={showRoomCreateModal}
        onClose={() => setRoomModalMode(null)}
        onSuccess={handleRoomCreateSuccess}
        existingRoom={room}
      />

      <SocialeCreateModal
        isOpen={showSocialeModal}
        onClose={() => setShowSocialeModal(false)}
        roomId={storedRoomId || ''}
        existingSociale={
          settingsSociale
            ? {
                id: settingsSociale.id,
                title: settingsSociale.title,
                description: settingsSociale.description,
                mode: settingsSociale.mode,
                totalRounds: settingsSociale.totalRounds,
              }
            : null
        }
        onCreateSociale={async (request) => {
          await createSociale.mutateAsync(request);
        }}
        onUpdateSociale={async (updates) => {
          const current = settingsSociale;
          if (!current) {
            throw new Error('No Sociale found to update');
          }
          await updateSociale.mutateAsync({
            socialeId: current.id,
            title: updates.title,
            description: updates.description,
            mode: updates.mode,
            totalRounds: updates.totalRounds,
          });
        }}
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
      <JoinSocialeModal
        open={showJoinSocialeModal}
        onClose={() => setShowJoinSocialeModal(false)}
        onJoin={handleJoinSociale}
        isJoining={isJoiningSociale}
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
        room={room}
        memberships={roomMemberships || []}
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
          setHostRoom({ roomId: roomCodeOrId, code: roomCodeOrId });
        }}
      />

      
      {/* End of mainContent fragment */}
    </>
  );

  // Return HostPanelV2 for both mobile and desktop with responsive layout
  return (
    <>
      <HostPanelV2
        session={session}
        sociale={activeSocialeQuery.data ?? null}
        room={room || null}
        memberships={roomMemberships}
        roomCode={roomJoinCode || (room?.code || '')}
        timer={timer}
        playerCount={lobbyPlayerCount}
        sessionPlayers={sessionPlayers}
        socialites={socialites}
        onPrimaryAction={handlePrimaryClick}
        onPauseToggle={handlePauseToggle}
        onEndSession={showEndSessionModalHandler}
        onOpenSettings={handleOpenSocialeSettings}
        onCreateSession={handleOpenSocialeModal}
        isPerformingAction={isPerformingAction}
        isPausingSession={isPausingSession}
        isEndingSession={isEndingSession}
      >
        <HostAccountMenu
          user={user}
          isAnonymous={isAnonymous}
          isVenueAccount={isVenueAccount}
          showAccountMenu={showAccountMenu}
          setShowAccountMenu={setShowAccountMenu}
          accountMenuRef={accountMenuRef}
          onPlayerSignIn={handlePlayerSignIn}
          onVenueSignIn={handleVenueSignIn}
          onSignOut={signOut}
        />
        {mainContent}
      </HostPanelV2>

      {/* Command Palette for desktop shortcuts */}
      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
        commands={commands}
        sessionPhase={session?.status}
        recentCommandIds={commandPalette.recentCommands}
        onCommandExecuted={handleCommandExecuted}
      />
    </>
  );
}

export default HostPage;

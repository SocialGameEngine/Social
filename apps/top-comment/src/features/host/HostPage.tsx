import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@social/ui";

import { useGameState, useSessionOrchestrator, transformRoundSummariesForUI } from "../../application";
import { useRoomV2 } from "../../hooks/useRoomV2";
import { useActiveGroupAnswers, usePlayerLookup, useToast } from "../../shared/hooks";
import { useAuth } from "../../shared/providers/AuthContext";
import { useTheme } from "../../shared/providers/ThemeProvider";
import { useHostRoom } from "./useHostRoom";
import { useHostSession } from "./useHostSession";
import { useHostComputations, useHostState, useHostModalState, useHostHandlers, useHostBootstrap, useHostCallbacks, useSessionTimer } from "./hooks";
import { useSessionPlayers } from "./hooks/useSessionPlayers";
import { useHostRoomRecovery } from "./hooks/useHostRoomRecovery";
import { useHostKeyboardShortcuts } from "../../hooks/useHostKeyboardShortcuts";
import { useAudienceSubmissions } from "../../hooks/useAudienceSubmissions";
import { HostSkeleton } from "../../shared/components/skeletons/HostSkeleton";
import { SignedOutPrompt } from "../../shared/components/SignedOutPrompt";
import { HostPanel } from "./components/HostPanel";
import { HostAccountMenu } from "./components/HostAccountMenu";
import { HostControlButtons } from "./components/HostControlButtons";
import { HostMainContent } from "./components/HostMainContent";
import { HostCommandPaletteSection } from "./components/HostCommandPaletteSection";
import { useCommandPalette } from "./components/shell";
import { useSessionMachine } from "./state";
import { useVenueAccountResolver } from './useVenueAccountResolver';
import { useSocialites } from "../sociale/hooks/useSocialites";
import { useCreateSociale, useSociale, useSocialesByRoom, useUpdateSociale } from "../sociale";
import { HostGameProvider } from './context/HostGameContext';

export function HostPage() {
  const { user, loading: authLoading, isAnonymous, signOut, sessionExpired } = useAuth();
  const { venueAccount, loading: venueAccountLoading, refresh: refreshVenueAccount } = useVenueAccountResolver();
  const isVenueAccount = Boolean(venueAccount?.isActive);
  const { toast } = useToast();
  const { isDark } = useTheme(); 
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const modalState = useHostModalState();
  const {
    showAccountMenu, setShowAccountMenu,
    showPlayerAuthModal, setShowPlayerAuthModal,
    showVenueAuthModal, setShowVenueAuthModal,
    setVenueRoomCreated, accountMenuRef,
    roomModalMode, setRoomModalMode,
    showRoomCreateModal, setShowRoomCreateModal,
    activeSocialeId, setActiveSocialeId,
    showSocialeModal, setShowSocialeModal,
    showBannedPlayersModal, setShowBannedPlayersModal,
    showVIBoxModal, setShowVIBoxModal,
    showVenueAuthPrompt, setShowVenueAuthPrompt,
    showJoinModal, setShowJoinModal,
    isJoiningSession, setIsJoiningSession,
    showJoinSocialeModal, setShowJoinSocialeModal,
    isJoiningSociale, setIsJoiningSociale,
    isRoomMembersOpen, setIsRoomMembersOpen,
  } = modalState;
  
  const hostSessionData = useHostSession();
  const hostRoomData = useHostRoom();
  
  const {
    sessionId: _rawSessionId, code: _rawSessionCode,
    isValidated: _sessionValidated, recoveryState: _sessionRecoveryState,
    setHostSession, clearHostSession,
  } = hostSessionData;
  
  const {
    roomId: _rawRoomId, code: _rawRoomCode,
    isValidated: _roomValidated, recoveryState: _roomRecoveryState,
    setHostRoom,
  } = hostRoomData;
  
  const shouldUseHostHooks = !authLoading && user && !user.is_anonymous;
  const storedSessionId = shouldUseHostHooks ? _rawSessionId : null;
  const storedCode = shouldUseHostHooks ? _rawSessionCode : null;
  const storedRoomId = shouldUseHostHooks ? _rawRoomId : null;
  const storedRoomCode = shouldUseHostHooks ? _rawRoomCode : null;
  
  const hostState = useHostState(storedSessionId);
  const {
    sessionId, setSessionId,
    showCreateModal, setShowCreateModal,
    isCreating, setIsCreating,
    showEditModal, setShowEditModal,
    isUpdatingSession, setIsUpdatingSession,
    createErrors, setCreateErrors,
    createForm, setCreateForm,
    showPromptLibraryModal, setShowPromptLibraryModal,
    isUpdatingPromptLibrary, setIsUpdatingPromptLibrary,
    hostGroupVotes, setHostGroupVotes,
    isSubmittingVote, setIsSubmittingVote,
    analytics, setAnalytics,
    isPerformingAction, setIsPerformingAction,
    isEndingSession, setIsEndingSession,
    isPausingSession, setIsPausingSession,
    showEndSessionModal, setShowEndSessionModal,
    kickingPlayerId, setKickingPlayerId,
    banningPlayerId, setBanningPlayerId,
    sessionRef, isPerformingActionRef,
  } = hostState;

  const roomRecovery = useHostRoomRecovery({
    user, authLoading, isVenueAccount, venueAccountLoading,
    roomId: storedRoomId,
    setRoomId: () => {},
    setHostRoom, setShowRoomCreateModal,
  });

  const isBootstrapComplete = !authLoading && !venueAccountLoading && 
    (roomRecovery.roomExistenceState === 'room_found' || 
     roomRecovery.roomExistenceState === 'no_room_confirmed' || 
     roomRecovery.roomExistenceState === 'error');

  const canCreateSession = isBootstrapComplete && isVenueAccount;

  const orchestrator = useSessionOrchestrator({
    sessionId: sessionId || '', autoAdvance: true, enablePauseResume: true,
  });

  const gameState = useGameState({
    sessionId: sessionId ?? undefined, userId: user?.id,
  });

  const session = gameState.session;
  const players = useMemo(() => gameState.memberships, [gameState.memberships]);
  const answers = gameState.answers;

  const {
    data: roomData, refreshMembers,
  } = useRoomV2({ roomId: storedRoomId ?? undefined });

  const room = roomData?.room;
  const roomMemberships = roomData?.memberships || [];

  const primarySocialeId = room?.currentSocialeId ?? activeSocialeId;
  const activeSocialeQuery = useSociale(primarySocialeId ?? undefined);
  const socialsByRoomQuery = useSocialesByRoom(storedRoomId ?? undefined);
  const createSociale = useCreateSociale();
  const updateSociale = useUpdateSociale();

  const { players: sessionPlayers } = useSessionPlayers(sessionId);

  const roomJoinCode = (user && !user.is_anonymous) ? (storedRoomCode ?? room?.code ?? storedCode ?? "") : "";
  const inviteLink = useMemo(() => {
    const code = roomJoinCode;
    if (!code) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    if (!origin) return "";
    return `${origin}/room/${code}`;
  }, [roomJoinCode]);

  useEffect(() => {
    if (room?.currentSessionId && !sessionId) {
      setSessionId(room.currentSessionId);
      setHostSession({ sessionId: room.currentSessionId, code: room.code });
    }
  }, [room, sessionId, setSessionId, setHostSession]);

  useEffect(() => {
    if (room?.code && sessionId && storedCode && storedCode !== room.code) {
      setHostSession({ sessionId, code: room.code });
    }
  }, [room?.code, sessionId, storedCode, setHostSession]);

  useEffect(() => {
    if (room?.currentSocialeId && !activeSocialeId) {
      setActiveSocialeId(room.currentSocialeId);
    }
    if (!room?.currentSocialeId && activeSocialeId) {
      setActiveSocialeId(null);
    }
  }, [room?.currentSocialeId, activeSocialeId]);

  const handlePlayerSignIn = () => setShowPlayerAuthModal(true);
  const handleVenueSignIn = () => setShowVenueAuthModal(true);

  const roomLobbyMembers = useMemo(() => {
    if (!storedRoomId || !room) return [];
    return roomMemberships.filter((member) =>
      !room.moderatorIds.includes(member.userId) && 
      !member.isBanned && 
      (member.status === "active" || member.status === "approved")
    );
  }, [storedRoomId, roomMemberships, room]);

  const activeSociale = activeSocialeQuery.data;
  const { data: socialites = [] } = useSocialites(activeSociale?.id);

  const lobbyTeams = useMemo(() => {
    if (activeSociale && socialites.length > 0) {
      return socialites.filter(s => s.isActive && !s.isBanned);
    }
    if (session && sessionPlayers.length > 0) return sessionPlayers;
    if (storedRoomId) return roomLobbyMembers;
    return players;
  }, [activeSociale, socialites, session, sessionPlayers, storedRoomId, roomLobbyMembers, players]);

  const lobbyPlayerCount = lobbyTeams.length;

  const hostMembership = useMemo(() => {
    if (!user || !room) return undefined;
    const isModerator = room.moderatorIds.includes(user.id);
    return roomMemberships.find((m) => m.userId === user.id && isModerator);
  }, [roomMemberships, user, room]);

  const {
    submissions: allSubmissions, pendingCount: pendingSubmissionCount,
    approveSubmission, rejectSubmission,
  } = useAudienceSubmissions({ roomId: storedRoomId ?? undefined, membershipId: hostMembership?.id, isHost: true });

  const requireVenueAccount = useCallback(() => {
    if (canCreateSession) return true;
    if (authLoading || venueAccountLoading) {
      toast({ title: "Checking your venue access...", variant: "info" });
    } else {
      setShowVenueAuthPrompt(true);
    }
    return false;
  }, [toast, authLoading, venueAccountLoading, canCreateSession]);

  useHostBootstrap({
    user, authLoading, venueAccountLoading, isVenueAccount,
    refreshVenueAccount, isBootstrapComplete,
    roomExistenceState: roomRecovery.roomExistenceState,
    session, sessionRef, orchestrator, roomModalMode,
    setRoomModalMode, clearHostSession, setHostRoom,
  });

  const triggerPerformingAction = (value: boolean) => {
    isPerformingActionRef.current = value;
    setIsPerformingAction(value);
  };

  const roundGroups = gameState.currentGroups;
  const totalGroups = roundGroups.length;
  const activeGroup = gameState.activeVoteGroup;
  const activeGroupIndex = session?.voteGroupIndex ?? 0;
  const voteCounts = gameState.voteCounts;
  const activeGroupAnswers = useActiveGroupAnswers(answers, session, activeGroup);

  const {
    leaderboard, selectedPromptLibraryId, currentPromptLibrary, activeGroupVote,
  } = useHostComputations({ gameState, session, hostGroupVotes, activeGroup });

  const playerLookup = usePlayerLookup(players);
  const roundSummaries = transformRoundSummariesForUI(gameState.roundSummaries, roundGroups, players);

  const handlers = useHostHandlers({
    user, authLoading, isVenueAccount, session, sessionId,
    setSessionId, setHostSession, clearHostSession,
    storedRoomId, storedRoomCode, refreshMembers,
    activeSociale: activeSocialeQuery.data ?? null,
    players, activeGroup, activeGroupVote, createForm,
    setCreateErrors, isCreating, setIsCreating,
    isUpdatingSession, setIsUpdatingSession,
    isEndingSession, setIsEndingSession,
    isPausingSession, setIsPausingSession,
    isPerformingAction,
    triggerPerformingAction,
    isSubmittingVote, setIsSubmittingVote,
    setKickingPlayerId, setBanningPlayerId,
    setShowCreateModal, setShowEditModal,
    setShowEndSessionModal, setShowPromptLibraryModal,
    setShowSocialeModal, setAnalytics, setHostGroupVotes,
    toast, queryClient,
  });

  const createSessionHandler = handlers.createSession;
  const updateSessionHandler = handlers.updateSession;
  const confirmEndSessionHandler = handlers.confirmEndSession;
  const handleLeaveSession = handlers.leaveSession;
  const primaryActionHandler = handlers.primaryAction;
  const socialePrimaryActionHandler = handlers.socialePrimaryAction;
  const handlePauseToggle = handlers.pauseToggle;
  const showEndSessionModalHandler = handlers.showEndSessionModal;
  const roomKickPlayerHandler = handlers.kickPlayer;
  const roomBanPlayerHandler = handlers.banPlayer;
  const hostVoteHandler = handlers.vote;
  const copyLinkHandler = handlers.copyLink;

  const callbacks = useHostCallbacks({
    user, session, sessionId, storedRoomId, storedRoomCode,
    canCreateSession, authLoading, venueAccountLoading,
    isUpdatingPromptLibrary, setIsUpdatingPromptLibrary,
    setShowCreateModal, setShowEditModal, setShowRoomCreateModal,
    setShowSocialeModal, setShowVenueAuthPrompt,
    setShowJoinModal, setShowJoinSocialeModal,
    setIsJoiningSession, setIsJoiningSociale,
    setActiveSocialeId, setCreateForm, setCreateErrors,
    setSessionId, setHostSession, setHostRoom, toast, navigate,
    requireVenueAccount, primaryActionHandler, socialePrimaryActionHandler,
    activeSocialeData: activeSocialeQuery.data ?? null,
  });

  useHostKeyboardShortcuts({
    onPrimaryAction: callbacks.handlePrimaryClick,
    onPauseToggle: handlePauseToggle,
  }, true);

  const controlButtons = (
    <HostControlButtons
      session={session}
      activeSociale={activeSocialeQuery.data ?? null}
      storedRoomId={storedRoomId}
      isPerformingAction={isPerformingAction}
      isPausingSession={isPausingSession}
      isEndingSession={isEndingSession}
      isUpdatingSession={isUpdatingSession}
      onPrimaryClick={callbacks.handlePrimaryClick}
      onPauseToggle={handlePauseToggle}
      onEndSession={showEndSessionModalHandler}
      onCreateNewSession={callbacks.handleCreateNewSession}
      onOpenEditModal={callbacks.handleOpenEditModal}
      onJoinModal={() => setShowJoinModal(true)}
      onLeaveSession={handleLeaveSession}
      onOpenSocialeModal={callbacks.handleOpenSocialeModal}
      onJoinSocialeModal={() => setShowJoinSocialeModal(true)}
    />
  );

  const presenterButton = storedRoomId ? (
    <Button
      variant="ghost"
      onClick={() => session && window.open(`/presenter/${session.id}`, "_blank", "noopener")}
      disabled={!session}
    >
      Presenter View
    </Button>
  ) : null;

  const sessionMachine = useSessionMachine(session, roomMemberships.length);
  const settingsSociale =
    activeSocialeQuery.data ??
    socialsByRoomQuery.data?.find((s) => s.id === primarySocialeId) ??
    null;

  const sessionTimer = useSessionTimer({ session });
  const timer = sessionTimer.remainingSeconds;

  const commandPalette = useCommandPalette();

  const hostGameContextValue = useMemo(() => ({
    session, sessionId,
    room: room || null, roomMemberships,
    roomCode: roomJoinCode || (room?.code || ''),
    activeSociale: activeSocialeQuery.data ?? null,
    sessionPlayers, socialites,
    playerCount: lobbyPlayerCount,
    isLoading: gameState.isLoading,
  }), [session, sessionId, room, roomMemberships, roomJoinCode, activeSocialeQuery.data, sessionPlayers, socialites, lobbyPlayerCount, gameState.isLoading]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    window.location.reload();
  }, [signOut]);

  if (!isBootstrapComplete) {
    return <HostSkeleton />;
  }

  if (sessionExpired) {
    return (
      <SignedOutPrompt
        description="Your host session has expired. Sign back into your venue account to keep control, or continue as a guest."
        onResolved={() => {
          refreshVenueAccount();
        }}
      />
    );
  }

  return (
    <>
      <HostGameProvider value={hostGameContextValue}>
        <HostPanel
          timer={timer}
          onPrimaryAction={callbacks.handlePrimaryClick}
          onPauseToggle={handlePauseToggle}
          onEndSession={showEndSessionModalHandler}
          onOpenSettings={callbacks.handleOpenSocialeSettings}
          onCreateSession={callbacks.handleOpenSocialeModal}
          isPerformingAction={isPerformingAction}
          isPausingSession={isPausingSession}
          isEndingSession={isEndingSession}
          onOpenCommandPalette={commandPalette.open}
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
          onSignOut={handleSignOut}
        />
        <HostMainContent
          user={user}
          isDark={isDark}
          session={session}
          sessionId={sessionId}
          room={room}
          roomMemberships={roomMemberships}
          storedRoomId={storedRoomId}
          storedRoomCode={storedRoomCode}
          canCreateSession={canCreateSession}
          venueAccountLoading={venueAccountLoading}
          presenterButton={presenterButton}
          onNavigateAnalytics={() => navigate(`/analytics/${storedRoomCode}`)}
          onOpenRoomSettings={() => {
            setShowEditModal(false);
            setRoomModalMode('settings');
          }}
          onOpenVIBox={() => setShowVIBoxModal(true)}
          onOpenVenueLogin={() => setShowVenueAuthModal(true)}
          phaseContentProps={{
            isDark, sessionId, session, storedRoomId, room, roomMemberships,
            primarySocialeId, userId: user?.id,
            lobbyControls: controlButtons,
            sessionControlButtons: controlButtons,
            activePhaseSessionControls: controlButtons,
            copyLinkHandler, roomJoinCode, inviteLink,
            currentPromptLibrary, isUpdatingPromptLibrary,
            onChangePrompts: () => setShowPromptLibraryModal(true),
            onEditLibraries: callbacks.handleOpenEditModal,
            onOpenSocialeSettings: callbacks.handleOpenSocialeSettings,
            onOpenLoadSociale: () => setShowJoinSocialeModal(true),
            onSocialeChange: setActiveSocialeId,
            roundGroups, totalGroups, playerLookup,
            activeGroupIndex, activeGroup, activeGroupAnswers,
            voteCounts, activeGroupVote, hostVoteHandler,
            isSubmittingVote, roundSummaries, players,
            gameStateVotes: gameState.votes,
            leaderboard, analytics,
            allSubmissions, pendingSubmissionCount,
            approveSubmission, rejectSubmission,
          }}
          sidePanelProps={{
            inviteLink, roomJoinCode, isDark, storedRoomId,
            session, room, roomLobbyMembers,
            isRoomMembersOpen, setIsRoomMembersOpen,
            kickingPlayerId, banningPlayerId,
            onKickPlayer: roomKickPlayerHandler,
            onBanPlayer: roomBanPlayerHandler,
            onShowBannedPlayers: () => setShowBannedPlayersModal(true),
            onCopyLink: copyLinkHandler,
            allSubmissions, pendingSubmissionCount,
            onApproveSubmission: approveSubmission,
            onRejectSubmission: rejectSubmission,
          }}
          modalsProps={{
            showRoomCreateModal,
            onCloseRoomModal: () => setRoomModalMode(null),
            onRoomCreateSuccess: callbacks.handleRoomCreateSuccess,
            room,
            showSocialeModal, setShowSocialeModal,
            storedRoomId, settingsSociale,
            onCreateSociale: async (request) => { await createSociale.mutateAsync(request); },
            onUpdateSociale: async (updates) => {
              const current = settingsSociale;
              if (!current) throw new Error('No Sociale found to update');
              await updateSociale.mutateAsync({
                socialeId: current.id,
                title: updates.title, description: updates.description,
                mode: updates.mode, totalRounds: updates.totalRounds,
                settings: { 
                  ...(current.settings || {}), 
                  voiceProfile: updates.voiceProfile 
                },
              });
            },
            showCreateModal,
            handleCreateModalClose: callbacks.handleCreateModalClose,
            showEditModal, setShowEditModal,
            createForm, setCreateForm, createErrors,
            isCreating, isUpdatingSession, canCreateSession,
            onCreateSession: createSessionHandler,
            onUpdateSession: updateSessionHandler,
            showJoinModal, setShowJoinModal,
            showJoinSocialeModal, setShowJoinSocialeModal,
            onJoinSession: callbacks.handleJoinSession,
            onJoinSociale: callbacks.handleJoinSociale,
            isJoiningSession, isJoiningSociale,
            showPromptLibraryModal, setShowPromptLibraryModal,
            session, selectedPromptLibraryId,
            onPromptLibrarySelect: callbacks.handlePromptLibrarySelect,
            isUpdatingPromptLibrary, isDark,
            showEndSessionModal, setShowEndSessionModal,
            onConfirmEndSession: confirmEndSessionHandler,
            isEndingSession,
            showBannedPlayersModal, setShowBannedPlayersModal,
            toast,
            showVIBoxModal, setShowVIBoxModal,
            roomMemberships,
            showVenueAuthPrompt, setShowVenueAuthPrompt,
            onNavigateVenueAuth: () => navigate("/venue-auth"),
            showPlayerAuthModal, setShowPlayerAuthModal,
            showVenueAuthModal, setShowVenueAuthModal,
            onOpenVenueLogin: () => setShowVenueAuthModal(true),
            onVenueRoomCreated: (roomCodeOrId: string) => {
              toast({ title: "Venue Room Created!", description: `Room code: ${roomCodeOrId}`, variant: "success" });
              setVenueRoomCreated(roomCodeOrId);
              setHostRoom({ roomId: roomCodeOrId, code: roomCodeOrId });
            },
          }}
        />
        </HostPanel>
      </HostGameProvider>

      <HostCommandPaletteSection
        session={session}
        sessionMachine={sessionMachine}
        isPerformingAction={isPerformingAction}
        isPausingSession={isPausingSession}
        isEndingSession={isEndingSession}
        canCreateSession={canCreateSession}
        isCreating={isCreating}
        handlePrimaryClick={callbacks.handlePrimaryClick}
        handlePauseToggle={handlePauseToggle}
        showEndSessionModalHandler={showEndSessionModalHandler}
        handleOpenSocialeModal={callbacks.handleOpenSocialeModal}
        toast={toast}
        commandPalette={commandPalette}
      />
    </>
  );
}

export default HostPage;

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRoomPage } from '../hooks/useRoomPage';
import { useAuth } from '../../../shared/providers/AuthContext';
import { useInteractions } from '../../../hooks/useInteractions';
import { VIBoxJukebox } from '../../../shared/components/vibox';
import { BackgroundAnimation } from '../../../components/BackgroundAnimation';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { RoomMainEventPanel } from './layout/RoomMainEventPanel';
import { RoomSidebar } from './layout/RoomSidebar';
import { RoomHeader } from './layout/RoomHeader';
import { InteractionsGrid } from './layout/InteractionsGrid';
import { SocialSection } from './layout/SocialSection';
import { MiscSection } from './layout/MiscSection';
import { MobileLayout } from '../../../shared/components/MobileLayout';
import { RoomModals } from './RoomModals';
import { WelcomeBackCard } from './WelcomeBackCard';
import { AuthModal } from '../../../shared/components/AuthModal';
import { JoinRoomModal } from '../../../shared/components/JoinRoomModal';
import { SignedOutPrompt } from '../../../shared/components/SignedOutPrompt';
import { ReactionOverlay } from './ReactionOverlay';
import { RoomReconnectingBanner } from './RoomReconnectingBanner';
import { LookUpOverlay } from './LookUpOverlay';
import { AllEyesUpOverlay } from './AllEyesUpOverlay';
import { HypeTapButton } from './HypeTapButton';
import { useHostSignals } from '../hooks/useHostSignals';
import { usePendingAnswerFlush } from '../hooks/usePendingAnswerFlush';
import { CommunityModal } from './CommunityModal';
import { useReactions } from '../../../hooks/useReactions';
import { useBlocks } from '../../../hooks/useBlocks';
import { useReports } from '../../../hooks/useReports';
import { useChallenges } from '../../../hooks/useChallenges';
import { useAudienceSubmissions } from '../../../hooks/useAudienceSubmissions';
import { ChallengeNotification } from './challenges/ChallengeNotification';
import { ChallengeModal } from './challenges/ChallengeModal';
import { SubmitQuestionButton } from './submissions/SubmitQuestionButton';
import { SubmitQuestionModal } from './submissions/SubmitQuestionModal';
import { AudienceQuestionsSheet } from './submissions/AudienceQuestionsSheet';
import { logger } from '../../../shared/utils/logger';
import { isCurrentUserModerator } from '../../../shared/utils/moderatorUtils';
import { SessionSkeleton } from '../../../shared/components/skeletons/SessionSkeleton';
import { roomMembershipService } from '../../../services/roomMembershipService';
import { interactionService } from '../../../services/interactionService';
import {
  clearMembership,
  getStoredMembershipId,
  storeMembership,
} from '../../../utils/membershipStorage';
import { PlayerRecoveryModal } from '../../auth/PlayerRecoveryModal';
import { getIsMainEventMode, getIsMainEventModeFromSociale } from '../utils/sessionPhase';
import { useSocialesByRoom, useSociale } from '../../../features/sociale';
import { useActiveSocialeRoundState } from '../hooks/useActiveSocialeRoundState';
import { supabase } from '../../../supabase/client';
import type { SocialeModalContext } from './RoomModals';

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

import { PollsBottomSheet } from './bottomsheets/PollsBottomSheet';
import { TopicsBottomSheet } from './bottomsheets/TopicsBottomSheet';
import { PromptsBottomSheet } from './bottomsheets/PromptsBottomSheet';
import { FibbageBottomSheet } from './bottomsheets/FibbageBottomSheet';
import { TriviaBottomSheet } from './bottomsheets/TriviaBottomSheet';
import { ChatLobbyBottomSheet } from './bottomsheets/ChatLobbyBottomSheet';
import { LeaderboardBottomSheet } from './bottomsheets/LeaderboardBottomSheet';
import { HelpBottomSheet } from './bottomsheets/HelpBottomSheet';

export function RoomPageContent() {
  const { room, memberships, session, sessionId, state, openModal, closeModal, markSubmitted, openEndedModal, closeEndedModal, handleLeaveRoom } = useRoomPage();
  const { user, loading: authLoading, signInAnonymously, sessionExpired, clearSessionExpired } = useAuth();
  const { isMobile, isRailCollapsed, setIsRailCollapsed } = useResponsiveLayout();
  const queryClient = useQueryClient();
  // P1-3: flushes queued offline answers on reconnect.
  usePendingAnswerFlush();
  // Wave 4: subscribe to host broadcast signals (P1-6, P1-17).
  const { signals: hostSignals } = useHostSignals(room?.id ?? null);
  
  // Get interactions
  const { interactions } = useInteractions({ roomId: room?.id });

  const { data: roomSociales = [] } = useSocialesByRoom(room?.id);
  
  // Get the active Sociale with real-time subscriptions
  const { data: activeRoomSociale } = useSociale(room?.currentSocialeId ?? undefined);
  
  // Invalidate Sociale query when room's currentSocialeId changes
  useEffect(() => {
    if (room?.currentSocialeId) {
      queryClient.invalidateQueries({ queryKey: ['sociale', room.currentSocialeId] });
    }
  }, [room?.currentSocialeId, queryClient]);
  const isPlayableSocialeStatus = useCallback(
    (status?: string | null) => status !== 'completed' && status !== 'cancelled',
    []
  );

  const primaryRoomSociale = useMemo(() => {
    // First try the directly fetched active Sociale (most reliable)
    if (activeRoomSociale && isPlayableSocialeStatus(activeRoomSociale.status)) {
      return activeRoomSociale;
    }

    // Fallback to list-based logic
    if (!roomSociales.length) return undefined;

    if (room?.currentSocialeId) {
      const pointed = roomSociales.find((s) => s.id === room.currentSocialeId);
      if (pointed && isPlayableSocialeStatus(pointed.status)) {
        return pointed;
      }
      return undefined;
    }

    return roomSociales.find((s) => isPlayableSocialeStatus(s.status)) ?? undefined;
  }, [activeRoomSociale, roomSociales, room?.currentSocialeId, isPlayableSocialeStatus]);

  const { data: activeSocialeRoundState } = useActiveSocialeRoundState(
    primaryRoomSociale?.id,
    primaryRoomSociale?.status
  );
  const socialeRoundIdForModals =
    activeSocialeRoundState?.round_id ?? primaryRoomSociale?.currentRoundId ?? null;

  const { data: socialeModalRoundRow } = useQuery({
    queryKey: ['sociale-round-modal', socialeRoundIdForModals],
    enabled: !!socialeRoundIdForModals && !!primaryRoomSociale,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sociale_rounds')
        .select('id, content, title, order_index, type')
        .eq('id', socialeRoundIdForModals as string)
        .single();
      if (error) throw error;
      return data as {
        id: string;
        content: string | null;
        title: string | null;
        order_index: number;
        type: string;
      };
    },
  });

  const socialeModalContext: SocialeModalContext | null = useMemo(() => {
    if (!primaryRoomSociale || !socialeRoundIdForModals) return null;
    if (!isPlayableSocialeStatus(primaryRoomSociale.status)) return null;
    const prompt =
      (socialeModalRoundRow?.content as string) ||
      (socialeModalRoundRow?.title as string) ||
      '';
    return {
      socialeId: primaryRoomSociale.id,
      roundId: socialeRoundIdForModals,
      prompt,
      roundIndex: socialeModalRoundRow?.order_index ?? primaryRoomSociale.currentRoundIndex ?? 0,
      roundType: socialeModalRoundRow?.type,
      phaseEndsAt: primaryRoomSociale.phaseEndsAt,
      phaseStartedAt: primaryRoomSociale.phaseStartedAt,
      voteSeconds: primaryRoomSociale.settings?.votingSeconds,
      paused: primaryRoomSociale.status === 'paused',
    };
  }, [
    primaryRoomSociale,
    socialeRoundIdForModals,
    socialeModalRoundRow?.content,
    socialeModalRoundRow?.title,
    socialeModalRoundRow?.order_index,
    socialeModalRoundRow?.type,
    isPlayableSocialeStatus,
  ]);

  // Check if user has a membership in this room
  const myMembership = user ? memberships?.find(m => m.userId === user.id) : null;
  const hasMembership = !!myMembership;
  
  // Check if user is a moderator
  const isModerator = room ? isCurrentUserModerator(room, user) : false;

  // Calculate main event mode for visual hierarchy (session or Sociale)
  const isMainEventMode =
    getIsMainEventMode(session) || getIsMainEventModeFromSociale(primaryRoomSociale);

  // Mock data generator for participant counts (slowed down by 90%)
  const [mockData, setMockData] = useState({
    pollsParticipants: 0,
    topicsParticipants: 0, 
    promptsParticipants: 0,
    fibbageParticipants: 0,
    triviaParticipants: 0,
    pollsHasActivity: false,
    topicsHasActivity: false,
    promptsHasActivity: false,
    fibbageHasActivity: false,
    triviaHasActivity: false,
  });

  // Bottom sheet states
  const [showPollsSheet, setShowPollsSheet] = useState(false);
  const [showTopicsSheet, setShowTopicsSheet] = useState(false);
  const [showPromptsSheet, setShowPromptsSheet] = useState(false);
  const [showFibbageSheet, setShowFibbageSheet] = useState(false);
  const [showTriviaSheet, setShowTriviaSheet] = useState(false);

  // Existing states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showVIBox, setShowVIBox] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showLeaderboardDrawer, setShowLeaderboardDrawer] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [challengeTarget, setChallengeTarget] = useState<{ id: string; name: string } | null>(null);
  const [showSubmitQuestion, setShowSubmitQuestion] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [resumableMembership, setResumableMembership] = useState<{
    id: string;
    playerName: string;
    roomCode: string;
  } | null>(null);

  // Filter interactions by type
  const polls = useMemo(() => interactions.filter(i => i.type === 'poll'), [interactions]);
  const topics = useMemo(() => interactions.filter(i => i.type === 'topic'), [interactions]);
  const prompts = useMemo(() => interactions.filter(i => i.type === 'prompt'), [interactions]);
  const fibbageGames = useMemo(() => interactions.filter(i => i.type === 'headline_fibbage'), [interactions]);
  const trivia = useMemo(() => interactions.filter(i => i.type === 'trivia'), [interactions]);

  // Callback hooks
  const handleAuthSuccess = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  const handleJoinRoom = useCallback(async (displayName: string) => {
    if (!room?.code) return;
    
    try {
      const response = await roomMembershipService.joinRoom({
        code: room.code,
        playerName: displayName,
      });

      // Persist for same-device auto-resume on the next visit.
      if (response?.membership?.id) {
        storeMembership(room.code, response.membership.id);
      }

      // Invalidate queries to refresh UI state after joining room
      queryClient.invalidateQueries({ queryKey: ['room', room.id] });
      queryClient.invalidateQueries({ queryKey: ['memberships', room.id] });
      queryClient.invalidateQueries({ queryKey: ['room-memberships'] });
      
      // Close the join modal after successful join
      setShowJoinModal(false);
      setResumableMembership(null);
      
    } catch (error: any) {
      throw error;
    }
  }, [room?.code, room?.id, queryClient, setShowJoinModal]);

  // Same-device resume: if no membership yet and we have a stored mapping for
  // this room, verify the row still exists and offer to resume.
  useEffect(() => {
    let cancelled = false;

    if (authLoading) return;
    if (hasMembership) {
      if (resumableMembership) setResumableMembership(null);
      return;
    }
    if (!room?.id || !room?.code) return;

    const storedId = getStoredMembershipId(room.code);
    if (!storedId) {
      if (resumableMembership) setResumableMembership(null);
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase
          .from('room_memberships')
          .select('id, player_name, is_banned, room_id')
          .eq('id', storedId)
          .eq('room_id', room.id)
          .maybeSingle();

        if (cancelled) return;

        if (error || !data || data.is_banned) {
          clearMembership(room.code);
          setResumableMembership(null);
          return;
        }

        setResumableMembership({
          id: data.id,
          playerName: data.player_name ?? '',
          roomCode: room.code,
        });
      } catch {
        if (!cancelled) setResumableMembership(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, hasMembership, room?.id, room?.code, resumableMembership]);

  const handleResumeMembership = useCallback(async () => {
    if (!resumableMembership) return;
    try {
      await handleJoinRoom(
        resumableMembership.playerName || 'Player'
      );
    } catch (error) {
      logger.error('Failed to resume membership', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [resumableMembership, handleJoinRoom]);

  const handleClearResume = useCallback(async () => {
    if (!resumableMembership) return;
    clearMembership(resumableMembership.roomCode);
    try {
      await supabase
        .from('room_memberships')
        .update({ client_key: null })
        .eq('id', resumableMembership.id);
    } catch {
      /* best-effort */
    }
    setResumableMembership(null);
  }, [resumableMembership]);

  // Debounced version to prevent rapid calls
  const debouncedHandleJoinRoom = useMemo(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isPending = false;
    
    return async (displayName: string) => {
      if (isPending) return; // Prevent multiple simultaneous calls
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(async () => {
        isPending = true;
        try {
          await handleJoinRoom(displayName);
        } finally {
          isPending = false;
          timeoutId = null;
        }
      }, 100); // 100ms debounce
    };
  }, [handleJoinRoom]);

  
  // Custom hooks
  const { reactions, bursts } = useReactions({
    roomId: room?.id,
    membershipId: myMembership?.id,
  });


  const { blockedIds, blockPlayer } = useBlocks({ membershipId: myMembership?.id, roomId: room?.id });
  const { pendingCount: pendingReportCount } = useReports({ roomId: room?.id });

  const {
    pendingChallenges,
    sendChallenge,
    acceptChallenge,
    declineChallenge,
  } = useChallenges({ roomId: room?.id, membershipId: myMembership?.id });

  const [showQuestionsSheet, setShowQuestionsSheet] = useState(false);

  const {
    submitQuestion,
    approvedSubmissions,
  } = useAudienceSubmissions({ roomId: room?.id, membershipId: myMembership?.id, isHost: false, loadApproved: true });

  const myDisplayName = myMembership?.playerName || user?.user_metadata?.display_name || 'Anonymous';

  const getMemberName = (membershipId: string | null | undefined) => {
    if (!membershipId || !memberships) return 'Unknown';
    const m = memberships.find((mem) => mem.id === membershipId);
    return m?.playerName || 'Anonymous';
  };

  // Handle interaction submission with optimistic UI
  const handleSubmitResponse = useCallback(async (interactionId: string, text: string) => {
    if (!myMembership) return;
    
    // Optimistic UI - could add local state update here
    await interactionService.submitResponse(interactionId, myMembership.id, text);
  }, [myMembership]);

  // Clear ended modals only when transitioning away from a completed/cancelled state
  // (e.g. a new Sociale started after the previous one ended).
  // We must NOT close ended modals on every render — that was causing the leaderboard
  // to flash open and immediately close mid-game when the Sociale is still 'active'.
  const prevSocialeStatusRef = useRef<string | undefined>(undefined);
  const endedModalsRef = useRef(state.endedModals);
  endedModalsRef.current = state.endedModals;

  useEffect(() => {
    const prevStatus = prevSocialeStatusRef.current;
    const currStatus = activeRoomSociale?.status;
    prevSocialeStatusRef.current = currStatus;

    const wasEnded = prevStatus === 'completed' || prevStatus === 'cancelled';
    const isNowNotEnded = currStatus !== 'completed' && currStatus !== 'cancelled';

    if (wasEnded && isNowNotEnded) {
      endedModalsRef.current.forEach(modal => closeEndedModal(modal));
    }
  }, [activeRoomSociale?.status, closeEndedModal]);

  // Auto-trigger anonymous auth for room visitors
  useEffect(() => {
    if (!user && !authLoading) {
      signInAnonymously().catch(() => {
        logger.error('Auto anonymous sign-in failed');
      });
    }
  }, [user, authLoading, signInAnonymously]);

  // Show loading skeleton while data is loading
  const isDataLoading = !session && !primaryRoomSociale;
  if (isDataLoading && (room?.currentSessionId || room?.currentSocialeId)) {
    return <SessionSkeleton />;
  }

  // Show session expiry modal
  if (sessionExpired) {
    return (
      <SignedOutPrompt
        showMagicLink
        roomCode={room?.code}
        roomId={room?.id}
        onResolved={() => {
          if (room?.id) {
            queryClient.invalidateQueries({ queryKey: ['room', room.id] });
            queryClient.invalidateQueries({ queryKey: ['memberships', room.id] });
            queryClient.invalidateQueries({ queryKey: ['room-memberships'] });
          }
        }}
      />
    );
  }

  // Signed-out visitors: the auto-anon effect above usually signs them in as
  // a guest instantly (when anonymous sign-ins are enabled). If that fails
  // (e.g. the Supabase project has anon disabled), render the full
  // SignedOutPrompt so they still have Sign in / Recover with email link /
  // Continue as guest choices instead of a dead-end.
  if (!user) {
    return (
      <SignedOutPrompt
        title={room?.code ? `Join room "${room.code}"` : 'Join this room'}
        description="Sign in to keep your scores and mascot, recover a previous identity by email, or jump in as a guest."
        showMagicLink
        roomCode={room?.code}
        roomId={room?.id}
        onResolved={() => {
          if (room?.id) {
            queryClient.invalidateQueries({ queryKey: ['room', room.id] });
            queryClient.invalidateQueries({ queryKey: ['memberships', room.id] });
            queryClient.invalidateQueries({ queryKey: ['room-memberships'] });
          }
        }}
      />
    );
  }

  const modalProps = {
    state,
    session,
    memberships,
    userId: user?.id,
    currentSocialeId: room?.currentSocialeId ?? undefined,
    closeEndedModal,
    closeModal,
    markSubmitted,
    handleLeaveRoom,
    socialeModalContext,
    // P1-17: propagate host-broadcasted "lock it in" toggle to the answer modal.
    requireLockIn: hostSignals.lockInRequired,
    // P1-5: answer modal needs the roomId to broadcast typing/submitted pings.
    roomId: room?.id ?? null,
  };

  const sharedGlobalOverlays = (
    <>
      <ReactionOverlay reactions={reactions} bursts={bursts} />
      <RoomModals {...modalProps} />
      <VIBoxJukebox
        isOpen={showVIBox}
        onClose={() => setShowVIBox(false)}
        toast={(options) => logger.debug('VIBox toast', options)}
        room={room}
        memberships={memberships || []}
        mode="team"
      />
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
      {showJoinModal && (
        <JoinRoomModal
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          roomCode={room?.code || ''}
          onJoin={debouncedHandleJoinRoom}
          defaultName={resumableMembership?.playerName}
          onRecoverIdentity={() => {
            setShowJoinModal(false);
            setShowRecoveryModal(true);
          }}
        />
      )}
      {resumableMembership && !hasMembership && !showJoinModal && (
        <WelcomeBackCard
          playerName={resumableMembership.playerName}
          roomCode={resumableMembership.roomCode}
          onContinue={() => void handleResumeMembership()}
          onNotMe={handleClearResume}
        />
      )}
      <PlayerRecoveryModal
        open={showRecoveryModal}
        roomCode={room?.code || ''}
        roomId={room?.id}
        onClose={() => setShowRecoveryModal(false)}
        onRecovered={() => {
          setShowRecoveryModal(false);
          if (room?.id) {
            queryClient.invalidateQueries({ queryKey: ['room', room.id] });
            queryClient.invalidateQueries({ queryKey: ['memberships', room.id] });
            queryClient.invalidateQueries({ queryKey: ['room-memberships'] });
          }
        }}
      />
      {showCommunityModal && (
        <CommunityModal
          isOpen={showCommunityModal}
          onClose={() => setShowCommunityModal(false)}
          roomId={room?.id || ''}
          membershipId={myMembership?.id}
          displayName={myDisplayName}
          isMember={hasMembership}
          onJoinRoom={() => setShowJoinModal(true)}
        />
      )}
      <AudienceQuestionsSheet
        isOpen={showQuestionsSheet}
        onClose={() => setShowQuestionsSheet(false)}
        submissions={approvedSubmissions}
      />
    </>
  );

  const handleToggleLeaderboard = () => {
    setShowLeaderboardDrawer(!showLeaderboardDrawer);
    setShowChatDrawer(false);
    setShowHowToPlay(false);
  };
  
  const handleToggleChat = () => {
    setShowChatDrawer(!showChatDrawer);
    setShowLeaderboardDrawer(false);
    setShowHowToPlay(false);
  };

  const handleToggleHelp = () => {
    setShowHowToPlay(!showHowToPlay);
    setShowChatDrawer(false);
    setShowLeaderboardDrawer(false);
  };
  
  
  // Main content with 4-section layout
  const mainContent = (
    <div className={cn("flex-1 overflow-hidden relative z-10 flex flex-col", 
      isMainEventMode && "room-main-event-mode")}>
      <div className="flex-1 overflow-y-auto pt-4">
        {/* Section 1: Session or Sociale (latest room Sociale replaces session panel) */}
        <RoomMainEventPanel
          roomId={room?.id}
          userId={user?.id}
          memberships={memberships}
          onOpenLeaderboard={() => openEndedModal('leaderboard')}
          onOpenSelfie={() => openEndedModal('selfie')}
          onOpenModal={openModal}
          onJoinRoom={() => setShowJoinModal(true)}
          isSticky={!isMobile}
          currentSocialeId={room?.currentSocialeId}
        />
        
        {/* Section 2: Interactions Grid */}
        <InteractionsGrid
          onOpenPolls={() => setShowPollsSheet(true)}
          onOpenTopics={() => setShowTopicsSheet(true)}
          onOpenPrompts={() => setShowPromptsSheet(true)}
          onOpenFibbage={() => setShowFibbageSheet(true)}
          onOpenTrivia={() => setShowTriviaSheet(true)}
          pollsCount={polls.length}
          topicsCount={topics.length}
          promptsCount={prompts.length}
          fibbageCount={fibbageGames.length}
          triviaCount={trivia.length}
          // TODO: Replace mock social proof data with real room-level interaction stats
          // Current: Staggered participant counts 
          // Should be: Room members who have used each interaction type + recent room activity
          pollsParticipants={mockData.pollsParticipants}
          topicsParticipants={mockData.topicsParticipants}
          promptsParticipants={mockData.promptsParticipants}
          fibbageParticipants={mockData.fibbageParticipants}
          triviaParticipants={mockData.triviaParticipants}
        />
        
        {/* Section 3: Social Section */}
        <SocialSection
          onOpenLeaderboard={handleToggleLeaderboard}
          onOpenChat={handleToggleChat}
          onOpenCommunity={() => setShowCommunityModal(true)}
          onOpenQuestions={() => setShowQuestionsSheet(true)}
          leaderboardExpanded={showLeaderboardDrawer}
          chatExpanded={showChatDrawer}
        />
        
        {/* Section 4: Misc Section */}
        <MiscSection
          onOpenVIBox={() => setShowVIBox(!showVIBox)}
          onOpenHelp={handleToggleHelp}
          helpExpanded={showHowToPlay}
        />
      </div>
    </div>
  );

  // Mobile layout
  if (isMobile) {
    return (
      <MobileLayout 
        className="bg-gradient-to-b from-slate-900 to-slate-800 text-white"
      >
        <RoomReconnectingBanner />
        {/* P1-27: phone collapses to "Look up!" while the TV is revealing. */}
        <LookUpOverlay
          visible={primaryRoomSociale?.currentPhase === 'reveal'}
        />
        {/* P1-6: host-triggered grey-out overlay to pull attention to the TV. */}
        <AllEyesUpOverlay visible={hostSignals.attentionLocked} />
        {/* P1-2: hype tap button — only during results phase. */}
        <HypeTapButton
          roomId={room?.id ?? null}
          active={
            primaryRoomSociale?.currentPhase === 'results' ||
            primaryRoomSociale?.currentPhase === 'reveal'
          }
        />
        <BackgroundAnimation show={true} />
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            <RoomHeader
              roomCode={room?.code}
              currentPhase={primaryRoomSociale?.currentPhase as any}
              currentRoundIndex={
                primaryRoomSociale?.currentRoundIndex != null
                  ? primaryRoomSociale.currentRoundIndex + 1
                  : null
              }
              totalRounds={primaryRoomSociale?.totalRounds ?? null}
              isFinalRound={
                !!primaryRoomSociale?.totalRounds &&
                primaryRoomSociale?.currentRoundIndex != null &&
                primaryRoomSociale.currentRoundIndex + 1 === primaryRoomSociale.totalRounds
              }
              memberCount={memberships?.length ?? 0}
              grabMateMembershipId={myMembership?.id ?? null}
              visitStreakWeeks={myMembership?.currentStreak ?? null}
            />
            {mainContent}
          </div>
        </div>

        {/* Bottom Sheets */}
        <PollsBottomSheet
          isOpen={showPollsSheet}
          onClose={() => setShowPollsSheet(false)}
          polls={polls}
          membershipId={myMembership?.id}
          onJoinRoom={() => setShowJoinModal(true)}
        />
        
        <TopicsBottomSheet
          isOpen={showTopicsSheet}
          onClose={() => setShowTopicsSheet(false)}
          topics={topics}
          membershipId={myMembership?.id}
          onJoinRoom={() => setShowJoinModal(true)}
        />
        
        <PromptsBottomSheet
          isOpen={showPromptsSheet}
          onClose={() => setShowPromptsSheet(false)}
          prompts={prompts}
          onSubmitResponse={handleSubmitResponse}
        />
        
        <FibbageBottomSheet
          isOpen={showFibbageSheet}
          onClose={() => setShowFibbageSheet(false)}
          fibbageGames={fibbageGames}
          membership={myMembership || null}
        />
        
        <TriviaBottomSheet
          isOpen={showTriviaSheet}
          onClose={() => setShowTriviaSheet(false)}
          trivia={trivia}
          membershipId={myMembership?.id}
        />
        <ChatLobbyBottomSheet
          isOpen={showChatDrawer}
          onClose={() => setShowChatDrawer(false)}
          memberships={memberships}
          roomId={room?.id}
          userId={user?.id}
          membershipId={myMembership?.id}
          displayName={myDisplayName}
          myMembershipId={myMembership?.id}
          blockPlayer={(membershipId: string) => blockPlayer(membershipId)}
          onChallengePlayer={(membershipId: string, playerName: string) => {
            sendChallenge(membershipId, `Challenge from ${myDisplayName || 'Player'}`, 100);
          }}
        />
        <LeaderboardBottomSheet
          isOpen={showLeaderboardDrawer}
          onClose={() => setShowLeaderboardDrawer(false)}
          roomId={room?.id}
          currentSessionId={sessionId}
        />
        <HelpBottomSheet
          isOpen={showHowToPlay}
          onClose={() => setShowHowToPlay(false)}
          initialPhase={session?.status}
        />

        <ChallengeNotification
          challenges={pendingChallenges}
          onAccept={acceptChallenge}
          onDecline={declineChallenge}
          getMemberName={getMemberName}
        />
        <ChallengeModal
          isOpen={!!challengeTarget}
          onClose={() => setChallengeTarget(null)}
          onSend={async (question, wager) => {
            if (challengeTarget) {
              await sendChallenge(challengeTarget.id, question, wager);
            }
          }}
          targetName={challengeTarget?.name || ''}
        />
        {hasMembership && (
          <div className="safe-bottom-5rem-left-4">
            <SubmitQuestionButton onClick={() => setShowSubmitQuestion(true)} />
          </div>
        )}
        <SubmitQuestionModal
          isOpen={showSubmitQuestion}
          onClose={() => setShowSubmitQuestion(false)}
          onSubmit={async (q: string, c?: string) => { await submitQuestion(q, c); }}
        />

        {sharedGlobalOverlays}
      </MobileLayout>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-[90dvh] flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white sm:overflow-hidden">
      <RoomReconnectingBanner />
      <LookUpOverlay visible={primaryRoomSociale?.currentPhase === 'reveal'} />
      <AllEyesUpOverlay visible={hostSignals.attentionLocked} />
      <HypeTapButton
        roomId={room?.id ?? null}
        active={
          primaryRoomSociale?.currentPhase === 'results' ||
          primaryRoomSociale?.currentPhase === 'reveal'
        }
      />
      <BackgroundAnimation show={true} />
      <div className="flex-1 flex min-h-0 sm:overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 sm:overflow-hidden">
          <RoomHeader
            roomCode={room?.code}
            currentPhase={primaryRoomSociale?.currentPhase as any}
            currentRoundIndex={
              primaryRoomSociale?.currentRoundIndex != null
                ? primaryRoomSociale.currentRoundIndex + 1
                : null
            }
            totalRounds={primaryRoomSociale?.totalRounds ?? null}
            isFinalRound={
              !!primaryRoomSociale?.totalRounds &&
              primaryRoomSociale?.currentRoundIndex != null &&
              primaryRoomSociale.currentRoundIndex + 1 === primaryRoomSociale.totalRounds
            }
            memberCount={memberships?.length ?? 0}
            grabMateMembershipId={myMembership?.id ?? null}
            visitStreakWeeks={myMembership?.currentStreak ?? null}
          />
          {mainContent}
        </div>
        <RoomSidebar
          memberships={memberships}
          room={room}
          isCollapsed={isRailCollapsed}
          onToggle={() => setIsRailCollapsed(!isRailCollapsed)}
          roomId={room?.id}
          userId={user?.id}
          membershipId={myMembership?.id}
          displayName={myDisplayName}
          isModerator={isModerator}
          blockedIds={blockedIds}
          blockPlayer={blockPlayer}
          pendingReportCount={pendingReportCount}
          onChallengePlayer={(id: string, name: string) => setChallengeTarget({ id, name })}
          isMember={hasMembership}
          onJoinRoom={() => setShowJoinModal(true)}
        />
      </div>

      {/* Bottom Sheets for Desktop */}
      <PollsBottomSheet
        isOpen={showPollsSheet}
        onClose={() => setShowPollsSheet(false)}
        polls={polls}
        membershipId={myMembership?.id}
        onJoinRoom={() => setShowJoinModal(true)}
      />
      
      <TopicsBottomSheet
        isOpen={showTopicsSheet}
        onClose={() => setShowTopicsSheet(false)}
        topics={topics}
        membershipId={myMembership?.id}
        onJoinRoom={() => setShowJoinModal(true)}
      />
      
      <PromptsBottomSheet
        isOpen={showPromptsSheet}
        onClose={() => setShowPromptsSheet(false)}
        prompts={prompts}
        onSubmitResponse={handleSubmitResponse}
      />
      
      <FibbageBottomSheet
        isOpen={showFibbageSheet}
        onClose={() => setShowFibbageSheet(false)}
        fibbageGames={fibbageGames}
        membership={myMembership || null}
      />
      
      <TriviaBottomSheet
        isOpen={showTriviaSheet}
        onClose={() => setShowTriviaSheet(false)}
        trivia={trivia}
        membershipId={myMembership?.id}
      />
      <ChatLobbyBottomSheet
        isOpen={showChatDrawer}
        onClose={() => setShowChatDrawer(false)}
        memberships={memberships}
        roomId={room?.id}
        userId={user?.id}
        membershipId={myMembership?.id}
        displayName={myDisplayName}
        myMembershipId={myMembership?.id}
        blockPlayer={(membershipId: string) => blockPlayer(membershipId)}
        onChallengePlayer={(membershipId: string, playerName: string) => {
          sendChallenge(membershipId, `Challenge from ${myDisplayName || 'Player'}`, 100);
        }}
      />
      <LeaderboardBottomSheet
        isOpen={showLeaderboardDrawer}
        onClose={() => setShowLeaderboardDrawer(false)}
        roomId={room?.id}
        currentSessionId={sessionId}
      />
      <HelpBottomSheet
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        initialPhase={session?.status}
      />

      <ChallengeNotification
        challenges={pendingChallenges}
        onAccept={acceptChallenge}
        onDecline={declineChallenge}
        getMemberName={getMemberName}
      />

      <ChallengeModal
        isOpen={!!challengeTarget}
        onClose={() => setChallengeTarget(null)}
        onSend={async (question, wager) => {
          if (challengeTarget) {
            await sendChallenge(challengeTarget.id, question, wager);
          }
        }}
        targetName={challengeTarget?.name || ''}
      />

      {hasMembership && (
        <div className="safe-bottom-5rem-left-4">
          <SubmitQuestionButton 
            onClick={() => setShowSubmitQuestion(true)} 
            isMember={hasMembership}
            onJoinRoom={() => setShowJoinModal(true)}
          />
        </div>
      )}
      <SubmitQuestionModal
        isOpen={showSubmitQuestion}
        onClose={() => setShowSubmitQuestion(false)}
        onSubmit={async (q: string, c?: string) => { await submitQuestion(q, c); }}
      />

      {sharedGlobalOverlays}
    </div>
  );
}

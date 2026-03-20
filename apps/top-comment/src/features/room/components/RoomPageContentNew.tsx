import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRoomPage } from '../hooks/useRoomPage';
import { useAuth } from '../../../shared/providers/AuthContext';
import { useInteractions } from '../../../hooks/useInteractions';
import { VIBoxJukebox } from '../../../shared/components/vibox/VIBoxJukebox';
import { BackgroundAnimation } from '../../../components/BackgroundAnimation';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { SessionPanel } from './layout/SessionPanel';
import { RoomSidebar } from './layout/RoomSidebar';
import { RoomHeader } from './layout/RoomHeader';
import { InteractionsGrid } from './layout/InteractionsGrid';
import { SocialSection } from './layout/SocialSection';
import { MiscSection } from './layout/MiscSection';
import { MobileLayout } from '../../../shared/components/MobileLayout';
import { RoomModals } from './RoomModals';
import { RoomDrawers } from './RoomDrawers';
import { AuthModal } from '../../../shared/components/AuthModal';
import { JoinRoomModal } from '../../../shared/components/JoinRoomModal';
import { ReactionBar } from './ReactionBar';
import { ReactionOverlay } from './ReactionOverlay';
import { TabNavigation } from './TabNavigation';
import { CommunityFeed } from './CommunityFeed';
import { useReactions } from '../../../hooks/useReactions';
import { useBlocks } from '../../../hooks/useBlocks';
import { useReports } from '../../../hooks/useReports';
import { useChallenges } from '../../../hooks/useChallenges';
import { useAudienceSubmissions } from '../../../hooks/useAudienceSubmissions';
import { ChallengeNotification } from './challenges/ChallengeNotification';
import { ChallengeModal } from './challenges/ChallengeModal';
import { SubmitQuestionButton } from './submissions/SubmitQuestionButton';
import { SubmitQuestionModal } from './submissions/SubmitQuestionModal';
import { roomMembershipService } from '../../../services/roomMembershipService';
import { interactionService } from '../../../services/interactionService';
import { PollsBottomSheet } from './bottomsheets/PollsBottomSheet';
import { TopicsBottomSheet } from './bottomsheets/TopicsBottomSheet';
import { PromptsBottomSheet } from './bottomsheets/PromptsBottomSheet';
import { FibbageBottomSheet } from './bottomsheets/FibbageBottomSheet';

export function RoomPageContentNew() {
  const { room, memberships, session, sessionId, state, openModal, closeModal, markSubmitted, openEndedModal, closeEndedModal, handleLeaveRoom } = useRoomPage();
  const { user } = useAuth();
  const { isMobile, isRailCollapsed, setIsRailCollapsed } = useResponsiveLayout();
  
  // Get interactions
  const { interactions } = useInteractions({ roomId: room?.id });

  // Check if user has a membership in this room
  const myMembership = user ? memberships?.find(m => m.userId === user.id) : null;
  const isHost = room?.hostUid === user?.id;
  const hasMembership = !!myMembership || isHost;

  // Bottom sheet states
  const [showPollsSheet, setShowPollsSheet] = useState(false);
  const [showTopicsSheet, setShowTopicsSheet] = useState(false);
  const [showPromptsSheet, setShowPromptsSheet] = useState(false);
  const [showFibbageSheet, setShowFibbageSheet] = useState(false);

  // Existing states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showVIBox, setShowVIBox] = useState(false);
  const [showLobbyDrawer, setShowLobbyDrawer] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showLeaderboardDrawer, setShowLeaderboardDrawer] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [activeTab, setActiveTab] = useState<'host' | 'community'>('host');
  const [challengeTarget, setChallengeTarget] = useState<{ id: string; name: string } | null>(null);
  const [showSubmitQuestion, setShowSubmitQuestion] = useState(false);

  // Filter interactions by type
  const polls = useMemo(() => interactions.filter(i => i.type === 'poll'), [interactions]);
  const topics = useMemo(() => interactions.filter(i => i.type === 'topic'), [interactions]);
  const prompts = useMemo(() => interactions.filter(i => i.type === 'prompt'), [interactions]);
  const fibbageGames = useMemo(() => interactions.filter(i => i.type === 'headline_fibbage'), [interactions]);

  // Callback hooks
  const handleAuthSuccess = useCallback(() => {
    setShowAuthModal(false);
    window.location.reload();
  }, []);

  const handleJoinRoom = useCallback(async (displayName: string) => {
    if (!room?.code) return;
    
    try {
      await roomMembershipService.joinRoom({
        code: room.code,
        playerName: displayName,
      });
    } catch (error: any) {
      throw error;
    }
  }, [room?.code]);

  const requireMembership = useCallback(() => {
    if (!hasMembership) {
      setShowJoinModal(true);
      return false;
    }
    return true;
  }, [hasMembership]);

  // Custom hooks
  const { reactions, reactionCounts, bursts, sendReaction } = useReactions({
    roomId: room?.id,
    membershipId: myMembership?.id,
  });

  const handleReaction = useCallback((emoji: any) => {
    if (requireMembership()) {
      sendReaction(emoji);
    }
  }, [requireMembership, sendReaction]);

  const { blockedIds, blockPlayer } = useBlocks({ membershipId: myMembership?.id, roomId: room?.id });
  const { pendingCount: pendingReportCount } = useReports({ roomId: room?.id, isHost });

  const {
    pendingChallenges,
    sendChallenge,
    acceptChallenge,
    declineChallenge,
  } = useChallenges({ roomId: room?.id, membershipId: myMembership?.id });

  const {
    submitQuestion,
  } = useAudienceSubmissions({ roomId: room?.id, membershipId: myMembership?.id, isHost: false });

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

  // Clear ended modals when leaving ended phase
  useEffect(() => {
    if (session?.status !== 'ended') {
      state.endedModals.forEach(modal => {
        closeEndedModal(modal);
      });
    }
  }, [session?.status, state.endedModals, closeEndedModal]);

  // Show auth modal for non-authenticated users
  if (!user) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Room "{room?.code}"</h1>
            <p className="text-slate-300 mb-6">Please sign in to view this room.</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              Sign In / Sign Up
            </button>
          </div>
        </div>
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        )}
      </>
    );
  }

  const modalsThatHideNav: Array<'leaderboard' | 'selfie'> = ['selfie'];
  const shouldHideBottomNav = modalsThatHideNav.some(modal => state.endedModals.includes(modal));

  const drawerProps = {
    memberships,
    session,
    sessionId,
    roomId: room?.id,
    userId: user?.id,
    membershipId: myMembership?.id,
    displayName: myDisplayName,
    showChatLobbyDrawer: showChatDrawer || showLobbyDrawer,
    showLeaderboardDrawer,
    showHowToPlay,
    onCloseChatLobby: () => {
      setShowChatDrawer(false);
      setShowLobbyDrawer(false);
    },
    onCloseLeaderboard: () => setShowLeaderboardDrawer(false),
    onCloseHelp: () => setShowHowToPlay(false),
    blockPlayer: async (membershipId: string) => {
      // TODO: Implement block player functionality
      console.log('Block player:', membershipId);
    },
    onChallengePlayer: (membershipId: string, playerName: string) => {
      // TODO: Implement challenge player functionality
      console.log('Challenge player:', membershipId, playerName);
    },
  };

  const modalProps = {
    state,
    session,
    sessionId,
    memberships,
    userId: user?.id,
    closeEndedModal,
    closeModal,
    markSubmitted,
    handleLeaveRoom,
  };

  const handleToggleLeaderboard = () => {
    setShowLeaderboardDrawer(!showLeaderboardDrawer);
    setShowChatDrawer(false);
    setShowLobbyDrawer(false);
  };
  
  const handleToggleChat = () => {
    setShowChatDrawer(!showChatDrawer);
    setShowLeaderboardDrawer(false);
    setShowLobbyDrawer(false);
  };
  
  
  // Main content with new 4-section layout
  const mainContent = (
    <div className="flex-1 overflow-hidden relative z-10 flex flex-col">
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="flex-shrink-0"
      />
      
      {activeTab === 'host' ? (
        <div className="flex-1 overflow-y-auto pt-4">
          {/* Section 1: Session */}
          <SessionPanel
            session={session}
            sessionId={sessionId}
            memberships={memberships}
            onOpenLeaderboard={() => openEndedModal('leaderboard')}
            onOpenSelfie={() => openEndedModal('selfie')}
            onOpenModal={openModal}
            isSticky={!isMobile}
          />
          
          {/* Section 2: Interactions Grid */}
          <InteractionsGrid
            onOpenPolls={() => setShowPollsSheet(true)}
            onOpenTopics={() => setShowTopicsSheet(true)}
            onOpenPrompts={() => setShowPromptsSheet(true)}
            onOpenFibbage={() => setShowFibbageSheet(true)}
            pollsCount={polls.length}
            topicsCount={topics.length}
            promptsCount={prompts.length}
            fibbageCount={fibbageGames.length}
            // TODO: Replace mock social proof data with real room-level interaction stats
// Current: Random participant counts and activity indicators
// Should be: Room members who have used each interaction type + recent room activity
pollsParticipants={session ? Math.floor(Math.random() * 10) + 3 : 0}
            topicsParticipants={session ? Math.floor(Math.random() * 8) + 2 : 0}
            promptsParticipants={session ? Math.floor(Math.random() * 6) + 1 : 0}
            fibbageParticipants={session ? Math.floor(Math.random() * 12) + 4 : 0}
            pollsHasActivity={!!session && Math.random() > 0.5}
            topicsHasActivity={!!session && Math.random() > 0.7}
            promptsHasActivity={!!session && Math.random() > 0.6}
            fibbageHasActivity={!!session && Math.random() > 0.4}
          />
          
          {/* Section 3: Social Section */}
          <SocialSection
            onOpenLeaderboard={handleToggleLeaderboard}
            onOpenChat={handleToggleChat}
          />
          
          {/* Section 4: Misc Section */}
          <MiscSection
            onOpenVIBox={() => setShowVIBox(!showVIBox)}
            onOpenHelp={() => setShowHowToPlay(!showHowToPlay)}
          />
        </div>
      ) : (
        <CommunityFeed
          roomId={room?.id || ''}
          membershipId={myMembership?.id}
          displayName={myDisplayName}
          isMember={hasMembership}
          onJoinRoom={() => setShowJoinModal(true)}
        />
      )}
    </div>
  );

  // Mobile layout
  if (isMobile) {
    return (
      <MobileLayout 
        bottomNav={shouldHideBottomNav ? undefined : undefined}
        className="bg-gradient-to-b from-slate-900 to-slate-800 text-white"
      >
        <BackgroundAnimation show={true} />
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            {mainContent}
          </div>
        </div>

        {/* Bottom Sheets */}
        <PollsBottomSheet
          isOpen={showPollsSheet}
          onClose={() => setShowPollsSheet(false)}
          polls={polls}
          membershipId={myMembership?.id}
        />
        
        <TopicsBottomSheet
          isOpen={showTopicsSheet}
          onClose={() => setShowTopicsSheet(false)}
          topics={topics}
          membershipId={myMembership?.id}
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
        {!isHost && hasMembership && (
          <div className="fixed bottom-20 left-4 z-30">
            <SubmitQuestionButton onClick={() => setShowSubmitQuestion(true)} />
          </div>
        )}
        <SubmitQuestionModal
          isOpen={showSubmitQuestion}
          onClose={() => setShowSubmitQuestion(false)}
          onSubmit={async (q: string, c?: string) => { await submitQuestion(q, c); }}
        />

        <ReactionOverlay reactions={reactions} bursts={bursts} />
        <RoomDrawers {...drawerProps} />
        <RoomModals {...modalProps} />
        <VIBoxJukebox
          isOpen={showVIBox}
          onClose={() => setShowVIBox(false)}
          toast={(options) => console.log('Toast:', options)}
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
            onJoin={handleJoinRoom}
          />
        )}
      </MobileLayout>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-[90dvh] flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white sm:overflow-hidden">
      <BackgroundAnimation show={true} />
      <div className="flex-1 flex min-h-0 sm:overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 sm:overflow-hidden">
          <RoomHeader
            roomCode={room?.code}
            showVIBox={showVIBox}
            showHowToPlay={showHowToPlay}
            onToggleVIBox={() => setShowVIBox(!showVIBox)}
            onToggleHelp={() => setShowHowToPlay(!showHowToPlay)}
            onLeaveRoom={handleLeaveRoom}
          />
          {mainContent}
        </div>
        <RoomSidebar
          memberships={memberships}
          isCollapsed={isRailCollapsed}
          onToggle={() => setIsRailCollapsed(!isRailCollapsed)}
          roomId={room?.id}
          userId={user?.id}
          membershipId={myMembership?.id}
          displayName={myDisplayName}
          isHost={isHost}
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
      />
      
      <TopicsBottomSheet
        isOpen={showTopicsSheet}
        onClose={() => setShowTopicsSheet(false)}
        topics={topics}
        membershipId={myMembership?.id}
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

      {!isHost && (
        <div className="fixed bottom-20 left-4 z-30">
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

      <ReactionOverlay reactions={reactions} bursts={bursts} />
      <ReactionBar 
        onReact={handleReaction} 
        reactionCounts={reactionCounts} 
        isMember={hasMembership}
        onJoinRoom={() => setShowJoinModal(true)}
      />
      <RoomDrawers {...drawerProps} />
      <RoomModals {...modalProps} />
      <VIBoxJukebox
        isOpen={showVIBox}
        onClose={() => setShowVIBox(false)}
        toast={(options) => console.log('Toast:', options)}
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
          onJoin={handleJoinRoom}
        />
      )}
    </div>
  );
}

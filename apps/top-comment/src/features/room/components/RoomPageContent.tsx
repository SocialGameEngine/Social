import { useState, useEffect, useCallback } from 'react';
import { useRoomPage } from '../hooks/useRoomPage';
import { useAuth } from '../../../shared/providers/AuthContext';
import { VIBoxJukebox } from '../../../shared/components/vibox/VIBoxJukebox';
import { BackgroundAnimation } from '../../../components/BackgroundAnimation';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { SessionPanel } from './layout/SessionPanel';
import { RoomSidebar } from './layout/RoomSidebar';
import { RoomHeader } from './layout/RoomHeader';
import { InteractionSection } from './interactions';
import { MobileLayout } from '../../../shared/components/MobileLayout';
import { RoomModals } from './RoomModals';
import { RoomDrawers } from './RoomDrawers';
import { RoomFloatingButtons } from './RoomFloatingButtons';
import { RoomBottomNav } from './RoomBottomNav';
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

export function RoomPageContent() {
  const { room, memberships, session, sessionId, state, openModal, closeModal, markSubmitted, openEndedModal, closeEndedModal, handleLeaveRoom } = useRoomPage();
  const { user } = useAuth();
  const { isMobile, isRailCollapsed, setIsRailCollapsed } = useResponsiveLayout();

  // Check if user has a membership in this room (for interactive features)
  const myMembership = user ? memberships?.find(m => m.userId === user.id) : null;
  const isHost = room?.hostUid === user?.id;
  const hasMembership = !!myMembership || isHost;

  // ALL hooks must be called before any conditional returns
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

  // Callback hooks
  const handleAuthSuccess = useCallback(() => {
    setShowAuthModal(false);
    // Refresh the page to re-render with authenticated state
    window.location.reload();
  }, []);

  const handleJoinRoom = useCallback(async (displayName: string) => {
    if (!room?.code) return;
    
    try {
      await roomMembershipService.joinRoom({
        code: room.code,
        playerName: displayName,
      });
      // Room will automatically refresh due to real-time subscriptions
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

  // Custom hooks that depend on user state
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

  // Derived values
  const myDisplayName = myMembership?.playerName || user?.user_metadata?.display_name || 'Anonymous';

  // Helper: get member name from membership id
  const getMemberName = (membershipId: string | null | undefined) => {
    if (!membershipId || !memberships) return 'Unknown';
    const m = memberships.find((mem) => mem.id === membershipId);
    return m?.playerName || 'Anonymous';
  };

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

  // Configure which modals should hide the bottom navbar
  const modalsThatHideNav: Array<'leaderboard' | 'selfie'> = ['selfie'];
  const shouldHideBottomNav = modalsThatHideNav.some(modal => state.endedModals.includes(modal));

  // Shared drawer props
  const drawerProps = {
    memberships,
    session,
    sessionId,
    roomId: room?.id,
    state,
    openModal,
    closeModal,
    openEndedModal,
    closeEndedModal,
    markSubmitted,
    handleLeaveRoom,
    userId: user?.id,
    membershipId: myMembership?.id,
    displayName: myDisplayName,
    showLobbyDrawer,
    showChatDrawer,
    showLeaderboardDrawer,
    isMobile,
    isHost,
    showHowToPlay,
    onCloseLobby: () => setShowLobbyDrawer(false),
    onCloseChat: () => setShowChatDrawer(false),
    onCloseLeaderboard: () => setShowLeaderboardDrawer(false),
    onCloseHelp: () => setShowHowToPlay(false),
  };

  // Shared modal props
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

  // Mutual-exclusion toggles for FABs
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
  const handleToggleLobby = () => {
    setShowLobbyDrawer(!showLobbyDrawer);
    setShowChatDrawer(false);
    setShowLeaderboardDrawer(false);
  };

  // Bottom nav for mobile
  const bottomNavigation = (
    <RoomBottomNav
      showLobbyDrawer={showLobbyDrawer}
      showVIBox={showVIBox}
      showHowToPlay={showHowToPlay}
      onToggleLobby={handleToggleLobby}
      onToggleVIBox={() => setShowVIBox(!showVIBox)}
      onToggleHelp={() => setShowHowToPlay(!showHowToPlay)}
      isMember={hasMembership}
      onJoinRoom={() => setShowJoinModal(true)}
    />
  );

  // Shared content area (session panel + interactions or community feed)
  const mainContent = (
    <div className="flex-1 overflow-hidden relative z-10 flex flex-col">
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="flex-shrink-0"
      />
      
      {activeTab === 'host' ? (
        <div className="flex-1 overflow-y-auto pt-4">
          <SessionPanel
            session={session}
            sessionId={sessionId}
            memberships={memberships}
            onOpenLeaderboard={() => openEndedModal('leaderboard')}
            onOpenSelfie={() => openEndedModal('selfie')}
            onOpenModal={openModal}
            isSticky={!isMobile}
          />
          <InteractionSection
            room={room}
            memberships={memberships}
            hasActiveSession={!!session && session.status !== 'ended'}
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
        bottomNav={shouldHideBottomNav ? undefined : bottomNavigation}
        className="bg-gradient-to-b from-slate-900 to-slate-800 text-white"
      >
        <BackgroundAnimation show={true} />
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            {mainContent}
          </div>
        </div>

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
        <RoomFloatingButtons
          showLeaderboardDrawer={showLeaderboardDrawer}
          showChatDrawer={showChatDrawer}
          showLobbyDrawer={showLobbyDrawer}
          onToggleLeaderboard={handleToggleLeaderboard}
          onToggleChat={handleToggleChat}
          isMember={hasMembership}
          onJoinRoom={() => setShowJoinModal(true)}
        />
        <RoomModals {...modalProps} />
        <VIBoxJukebox
          isOpen={showVIBox}
          onClose={() => setShowVIBox(false)}
          toast={(options) => console.log('Toast:', options)}
          mode="team"
        />
        {showAuthModal && (
          <AuthModal
            onClose={() => {
              console.log('AuthModal onClose called');
              setShowAuthModal(false);
            }}
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

      {/* Challenge notifications */}
      <ChallengeNotification
        challenges={pendingChallenges}
        onAccept={acceptChallenge}
        onDecline={declineChallenge}
        getMemberName={getMemberName}
      />

      {/* Challenge creation modal */}
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

      {/* Submit question button (for non-hosts) */}
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
          onClose={() => {
            console.log('AuthModal onClose called (desktop)');
            setShowAuthModal(false);
          }}
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

import { useState, useEffect } from 'react';
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
import { useBlocks } from '../../../hooks/useBlocks';
import { useReports } from '../../../hooks/useReports';
import { useChallenges } from '../../../hooks/useChallenges';
import { useAudienceSubmissions } from '../../../hooks/useAudienceSubmissions';
import { ChallengeNotification } from './challenges/ChallengeNotification';
import { ChallengeModal } from './challenges/ChallengeModal';
import { SubmitQuestionButton } from './submissions/SubmitQuestionButton';
import { SubmitQuestionModal } from './submissions/SubmitQuestionModal';

export function RoomPageContent() {
  const { room, memberships, session, sessionId, state, openModal, closeModal, markSubmitted, openEndedModal, closeEndedModal, handleLeaveRoom } = useRoomPage();
  const { user } = useAuth();
  const { isMobile, isRailCollapsed, setIsRailCollapsed } = useResponsiveLayout();

  // Check if user has a membership in this room (we know they have one if this component renders)
  const myMembership = user ? memberships?.find(m => m.userId === user.id) : null;
  const isHost = room?.hostUid === user?.id;

  // Derive chat/leaderboard props
  const myDisplayName = myMembership?.playerName || user?.user_metadata?.display_name || 'Anonymous';
  
  const [showVIBox, setShowVIBox] = useState(false);
  const [showLobbyDrawer, setShowLobbyDrawer] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showLeaderboardDrawer, setShowLeaderboardDrawer] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showTopicsModal, setShowTopicsModal] = useState(false);
  const [showPollsModal, setShowPollsModal] = useState(false);

  // Blocks & reports
  const { blockedIds, blockPlayer } = useBlocks({ membershipId: myMembership?.id, roomId: room?.id });
  const { pendingCount: pendingReportCount } = useReports({ roomId: room?.id, isHost });

  // Challenges
  const {
    pendingChallenges,
    sendChallenge,
    acceptChallenge,
    declineChallenge,
  } = useChallenges({ roomId: room?.id, membershipId: myMembership?.id });
  const [challengeTarget, setChallengeTarget] = useState<{ id: string; name: string } | null>(null);

  // Audience submissions (player side only - host reviews in HostPage)
  const {
    submitQuestion,
  } = useAudienceSubmissions({ roomId: room?.id, membershipId: myMembership?.id, isHost: false });
  const [showSubmitQuestion, setShowSubmitQuestion] = useState(false);

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
  const mobileMenu = (
    <RoomBottomNav
      variant="menu"
      showLobbyDrawer={showLobbyDrawer}
      showVIBox={showVIBox}
      showHowToPlay={showHowToPlay}
      onToggleLobby={() => {
        handleToggleLobby();
        setShowMobileMenu(false);
      }}
      onToggleVIBox={() => {
        setShowVIBox(!showVIBox);
        setShowMobileMenu(false);
      }}
      onToggleHelp={() => {
        setShowHowToPlay(!showHowToPlay);
        setShowMobileMenu(false);
      }}
    />
  );

  // Shared content area (session panel + interactions)
  const isLobbyPhase = !session || session.status === 'lobby';
  const mainContent = (
    <div className="flex-1 overflow-y-auto relative z-10 pt-4">
      <SessionPanel
        session={session}
        sessionId={sessionId}
        memberships={memberships}
        onOpenLeaderboard={() => openEndedModal('leaderboard')}
        onOpenSelfie={() => openEndedModal('selfie')}
        onOpenModal={openModal}
        onOpenTopics={() => setShowTopicsModal(true)}
        onOpenPolls={() => setShowPollsModal(true)}
        isSticky={!isMobile}
      />
      {!isLobbyPhase && (
        <InteractionSection
          room={room}
          memberships={memberships}
          hasActiveSession={!!session && session.status !== 'ended'}
        />
      )}
    </div>
  );

  const topicsModal = showTopicsModal ? (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close topics"
        className="absolute inset-0 bg-slate-950/85"
        onClick={() => setShowTopicsModal(false)}
      />
      <div className="relative h-full w-full overflow-y-auto px-4 py-6">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Topics
            </h2>
            <button
              type="button"
              onClick={() => setShowTopicsModal(false)}
              className="rounded-full border border-cyan-400/40 bg-slate-900/60 px-4 py-2 text-sm font-bold uppercase tracking-wider text-cyan-200 hover:bg-slate-800/60"
            >
              Close
            </button>
          </div>
          <InteractionSection
            room={room}
            memberships={memberships}
            hasActiveSession={!!session && session.status !== 'ended'}
          />
        </div>
      </div>
    </div>
  ) : null;

  const pollsModal = showPollsModal ? (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close polls"
        className="absolute inset-0 bg-slate-950/85"
        onClick={() => setShowPollsModal(false)}
      />
      <div className="relative h-full w-full overflow-y-auto px-4 py-6">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Polls
            </h2>
            <button
              type="button"
              onClick={() => setShowPollsModal(false)}
              className="rounded-full border border-cyan-400/40 bg-slate-900/60 px-4 py-2 text-sm font-bold uppercase tracking-wider text-cyan-200 hover:bg-slate-800/60"
            >
              Close
            </button>
          </div>
          <p className="text-sm sm:text-base text-cyan-100/90">
            Polls content coming soon.
          </p>
        </div>
      </div>
    </div>
  ) : null;

  // Mobile layout
  if (isMobile) {
    return (
      <MobileLayout 
        className="bg-gradient-to-b from-slate-900 to-slate-800 text-white"
      >
        {!shouldHideBottomNav && (
          <>
            <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 backdrop-blur bg-slate-900/60 border-b border-cyan-400/20">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Pub Söcial" className="h-8 w-8 rounded-full" />
                <span className="text-sm font-black tracking-wide text-white">Pub Söcial</span>
              </div>
              <button
                type="button"
                aria-label="Open menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/80 text-white shadow-lg shadow-cyan-500/20 backdrop-blur transition hover:bg-slate-700/80"
                onClick={() => setShowMobileMenu((open) => !open)}
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {showMobileMenu && (
              <div className="fixed inset-0 z-40">
                <button
                  type="button"
                  aria-label="Close menu"
                  className="absolute inset-0 bg-slate-900/60"
                  onClick={() => setShowMobileMenu(false)}
                />
                <div className="absolute right-4 top-16 w-56 rounded-2xl border border-cyan-400/30 bg-slate-900/90 p-2 shadow-xl shadow-fuchsia-500/10 backdrop-blur">
                  <div className="chaos-menu">
                    {mobileMenu}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
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
        {!isHost && (
          <div className="fixed bottom-20 left-4 z-30">
            <SubmitQuestionButton onClick={() => setShowSubmitQuestion(true)} />
          </div>
        )}
        <SubmitQuestionModal
          isOpen={showSubmitQuestion}
          onClose={() => setShowSubmitQuestion(false)}
          onSubmit={async (q: string, c?: string) => { await submitQuestion(q, c); }}
        />

        <RoomDrawers {...drawerProps} />
        <RoomFloatingButtons
          showLeaderboardDrawer={showLeaderboardDrawer}
          showChatDrawer={showChatDrawer}
          showLobbyDrawer={showLobbyDrawer}
          onToggleLeaderboard={handleToggleLeaderboard}
          onToggleChat={handleToggleChat}
        />
        <RoomModals {...modalProps} />
        {topicsModal}
        {pollsModal}
        <VIBoxJukebox
          isOpen={showVIBox}
          onClose={() => setShowVIBox(false)}
          toast={(options) => console.log('Toast:', options)}
          mode="team"
        />
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
          <SubmitQuestionButton onClick={() => setShowSubmitQuestion(true)} />
        </div>
      )}
      <SubmitQuestionModal
        isOpen={showSubmitQuestion}
        onClose={() => setShowSubmitQuestion(false)}
        onSubmit={async (q: string, c?: string) => { await submitQuestion(q, c); }}
      />

      <RoomDrawers {...drawerProps} />
      <RoomModals {...modalProps} />
      {topicsModal}
      {pollsModal}
      <VIBoxJukebox
        isOpen={showVIBox}
        onClose={() => setShowVIBox(false)}
        toast={(options) => console.log('Toast:', options)}
        mode="team"
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRoom } from '../../../hooks/useRoom';
import { useSession, useMemberships } from '../../session/hooks';
import { RoomPageProvider } from '../context/RoomPageContext';
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

function RoomPageContent() {
  const { room, memberships, session, sessionId, state, openModal, closeModal, markSubmitted, openEndedModal, closeEndedModal, handleLeaveRoom } = useRoomPage();
  const { user } = useAuth();
  const membershipsData = useMemberships(sessionId || undefined);
  const { isMobile, isRailCollapsed, setIsRailCollapsed } = useResponsiveLayout();

  // Derive chat/leaderboard props
  const myMembership = memberships?.find(m => m.userId === user?.id);
  const myDisplayName = myMembership?.playerName || user?.user_metadata?.display_name || 'Anonymous';
  
  const [showVIBox, setShowVIBox] = useState(false);
  const [showLobbyDrawer, setShowLobbyDrawer] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showLeaderboardDrawer, setShowLeaderboardDrawer] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

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
    userId: user?.id,
    membershipId: myMembership?.id,
    displayName: myDisplayName,
    showLobbyDrawer,
    showChatDrawer,
    showLeaderboardDrawer,
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
    membershipsData,
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
    />
  );

  // Shared content area (session panel + interactions)
  const mainContent = (
    <div className="flex-1 overflow-y-auto relative z-10 pt-4">
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

        <RoomDrawers {...drawerProps} />
        <RoomFloatingButtons
          showLeaderboardDrawer={showLeaderboardDrawer}
          showChatDrawer={showChatDrawer}
          showLobbyDrawer={showLobbyDrawer}
          onToggleLeaderboard={handleToggleLeaderboard}
          onToggleChat={handleToggleChat}
        />
        <RoomModals {...modalProps} />
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
        />
      </div>

      <RoomDrawers {...drawerProps} />
      <RoomModals {...modalProps} />
      <VIBoxJukebox
        isOpen={showVIBox}
        onClose={() => setShowVIBox(false)}
        toast={(options) => console.log('Toast:', options)}
        mode="team"
      />
    </div>
  );
}

export function RoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const { room, memberships, isLoading: roomLoading, error: roomError } = useRoom({
    roomCode,
  });

  const { session } = useSession(sessionId || undefined);

  // Get sessionId from room when it updates
  useEffect(() => {
    if (room?.currentSessionId && room.currentSessionId !== sessionId) {
      setSessionId(room.currentSessionId);
    }
  }, [room?.currentSessionId, sessionId]);

  if (roomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-pulse">Loading room...</div>
      </div>
    );
  }

  if (roomError || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Room Not Found</h1>
          <p className="text-slate-400">The room code "{roomCode}" doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <RoomPageProvider
      room={room}
      memberships={memberships}
      session={session}
      sessionId={sessionId}
    >
      <RoomPageContent />
    </RoomPageProvider>
  );
}

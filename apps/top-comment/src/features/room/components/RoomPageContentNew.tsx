import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRoomPage } from '../hooks/useRoomPage';
import { useAuth } from '../../../shared/providers/AuthContext';
import { useInteractions } from '../../../hooks/useInteractions';
import { VIBoxJukebox } from '../../../shared/components/vibox';
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
import { AuthModal } from '../../../shared/components/AuthModal';
import { JoinRoomModal } from '../../../shared/components/JoinRoomModal';
import { ReactionOverlay } from './ReactionOverlay';
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
import { logger } from '../../../shared/utils/logger';
import { isCurrentUserModerator } from '../../../shared/utils/moderatorUtils';
import { roomMembershipService } from '../../../services/roomMembershipService';
import { interactionService } from '../../../services/interactionService';
import { getIsMainEventMode, type SessionDisplayState } from './PhaseController';
import { getSessionDisplayCopy } from '../utils/sessionDisplayCopy';

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

export function RoomPageContentNew() {
  const { room, memberships, session, sessionId, state, openModal, closeModal, markSubmitted, openEndedModal, closeEndedModal, handleLeaveRoom } = useRoomPage();
  const { user } = useAuth();
  const { isMobile, isRailCollapsed, setIsRailCollapsed } = useResponsiveLayout();
  
  // Get interactions
  const { interactions } = useInteractions({ roomId: room?.id });

  // Check if user has a membership in this room
  const myMembership = user ? memberships?.find(m => m.userId === user.id) : null;
  const hasMembership = !!myMembership;
  
  // Check if user is a moderator
  const isModerator = room ? isCurrentUserModerator(room, user) : false;

  // Calculate main event mode for visual hierarchy
  const isMainEventMode = getIsMainEventMode(session);

  // Join session interaction state
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  const handleJoinSession = useCallback(async () => {
    if (!room?.code || hasMembership) return;
    
    setIsJoining(true);
    try {
      await roomMembershipService.joinRoom({
        code: room.code,
        playerName: user?.user_metadata?.display_name || 'Player',
      });
      setJoinSuccess(true);
      setTimeout(() => setJoinSuccess(false), 2000);
    } catch (error) {
      console.error('Join failed:', error);
    } finally {
      setIsJoining(false);
    }
  }, [room?.code, hasMembership, user]);

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

  // Update different interaction types at different intervals (staggered)
  useEffect(() => {
    if (!session) return;

    // Start with activity enabled for testing
    setMockData({
      pollsParticipants: 5,
      topicsParticipants: 4,
      promptsParticipants: 3,
      fibbageParticipants: 6,
      triviaParticipants: 4,
      pollsHasActivity: true,
      topicsHasActivity: true,
      promptsHasActivity: true,
      fibbageHasActivity: true,
      triviaHasActivity: true,
    });

    const intervals = [
      // Polls update every 10 seconds (was 1 second)
      setInterval(() => {
        setMockData(prev => ({
          ...prev,
          pollsParticipants: Math.floor(Math.random() * 10) + 3,
          pollsHasActivity: true, // 100% activity when number changes
        }));
        // Reset activity after 3 seconds
        setTimeout(() => {
          setMockData(prev => ({ ...prev, pollsHasActivity: false }));
        }, 3000);
      }, 10000),
      
      // Topics update every 12 seconds (was 1 second)  
      setInterval(() => {
        setMockData(prev => ({
          ...prev,
          topicsParticipants: Math.floor(Math.random() * 8) + 2,
          topicsHasActivity: true, // 100% activity when number changes
        }));
        // Reset activity after 3 seconds
        setTimeout(() => {
          setMockData(prev => ({ ...prev, topicsHasActivity: false }));
        }, 3000);
      }, 12000),
      
      // Prompts update every 8 seconds (was 1 second)
      setInterval(() => {
        setMockData(prev => ({
          ...prev,
          promptsParticipants: Math.floor(Math.random() * 6) + 1,
          promptsHasActivity: true, // 100% activity when number changes
        }));
        // Reset activity after 3 seconds
        setTimeout(() => {
          setMockData(prev => ({ ...prev, promptsHasActivity: false }));
        }, 3000);
      }, 8000),
      
      // Fibbage updates every 15 seconds (was 1 second)
      setInterval(() => {
        setMockData(prev => ({
          ...prev,
          fibbageParticipants: Math.floor(Math.random() * 12) + 4,
          fibbageHasActivity: true, // 100% activity when number changes
        }));
        // Reset activity after 3 seconds
        setTimeout(() => {
          setMockData(prev => ({ ...prev, fibbageHasActivity: false }));
        }, 3000);
      }, 15000),
      // Trivia updates every 20 seconds
      setInterval(() => {
        setMockData(prev => ({
          ...prev,
          triviaParticipants: Math.floor(Math.random() * 8) + 2,
          triviaHasActivity: true,
        }));
        // Reset activity after 3 seconds
        setTimeout(() => {
          setMockData(prev => ({ ...prev, triviaHasActivity: false }));
        }, 3000);
      }, 20000),
    ];

    return () => intervals.forEach(clearInterval);
  }, [session]);

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
      await roomMembershipService.joinRoom({
        code: room.code,
        playerName: displayName,
      });
    } catch (error: any) {
      throw error;
    }
  }, [room?.code]);

  
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
        />
        
        {/* Section 4: Misc Section */}
        <MiscSection
          onOpenVIBox={() => setShowVIBox(!showVIBox)}
          onOpenHelp={handleToggleHelp}
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
        <BackgroundAnimation show={true} />
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            <RoomHeader
              roomCode={room?.code}
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
          blockPlayer={async (membershipId: string) => {
            logger.debug('RoomPageContentNew blockPlayer placeholder', { membershipId });
          }}
          onChallengePlayer={(membershipId: string, playerName: string) => {
            logger.debug('RoomPageContentNew onChallengePlayer placeholder', { membershipId, playerName });
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
            onJoin={handleJoinRoom}
          />
        )}
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
        blockPlayer={async (membershipId: string) => {
          logger.debug('RoomPageContentNew blockPlayer placeholder', { membershipId });
        }}
        onChallengePlayer={(membershipId: string, playerName: string) => {
          logger.debug('RoomPageContentNew onChallengePlayer placeholder', { membershipId, playerName });
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
          onJoin={handleJoinRoom}
        />
      )}
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
    </div>
  );
}

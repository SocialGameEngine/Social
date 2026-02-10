import { lazy, Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../../../hooks/useRoom';
import { useSession, useTeams } from '../../session/hooks';
import { RoomPageProvider } from '../context/RoomPageContext';
import { useRoomPage } from '../hooks/useRoomPage';
import { useAuth } from '../../../shared/providers/AuthContext';
import { VIBoxJukebox } from '../../../shared/components/vibox/VIBoxJukebox';
import { BackgroundAnimation } from '../../../components/BackgroundAnimation';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { SessionPanel } from './layout/SessionPanel';
import { RoomSidebar } from './layout/RoomSidebar';
import { LobbyDrawer } from './layout/LobbyDrawer';
import { ChatDrawer } from './layout/ChatDrawer';
import { LeaderboardHistoryDrawer } from './layout/LeaderboardHistoryDrawer';
import { HelpDrawer } from './layout/HelpDrawer';
import { InteractionSection } from './interactions';

// Lazy load ended modals
const LeaderboardModal = lazy(() => import('./LeaderboardModal.tsx'));
const SelfieModal = lazy(() => import('./SelfieModal.tsx'));
const AnswerModal = lazy(() => import('./AnswerModal.tsx'));
const VoteModal = lazy(() => import('./VoteModal.tsx'));

function RoomPageContent() {
  const { room, memberships, session, sessionId, state, openModal, closeModal, markSubmitted, openEndedModal, closeEndedModal, handleLeaveRoom } = useRoomPage();
  const { user, isGuest, signOut } = useAuth();
  const navigate = useNavigate();
  const teams = useTeams(sessionId || undefined);
  const { isMobile, isRailCollapsed, setIsRailCollapsed } = useResponsiveLayout();

  // Derive chat/leaderboard props
  const myMembership = memberships?.find(m => m.userId === user?.id);
  const myDisplayName = myMembership?.playerName || user?.user_metadata?.display_name || 'Anonymous';
  
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showVIBox, setShowVIBox] = useState(false);
  const [showLobbyDrawer, setShowLobbyDrawer] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showLeaderboardDrawer, setShowLeaderboardDrawer] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Clear ended modals when leaving ended phase
  useEffect(() => {
    if (session?.status !== 'ended') {
      state.endedModals.forEach(modal => {
        closeEndedModal(modal);
      });
    }
  }, [session?.status, state.endedModals, closeEndedModal]);

  const handleSignOut = useCallback(async () => {
    if (!signOut) return;
    try {
      await signOut();
      setShowAccountMenu(false);
      navigate('/');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }, [signOut, navigate]);

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

  // Configure which modals should hide the bottom navbar
  const modalsThatHideNav: Array<'leaderboard' | 'selfie'> = ['selfie'];
  const shouldHideBottomNav = modalsThatHideNav.some(modal => state.endedModals.includes(modal));

  return (
    <div className="min-h-[90dvh] flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white sm:overflow-hidden">
      <BackgroundAnimation show={true} />

      {/* Main content area - shared structure */}
      <div className="flex-1 flex min-h-0 sm:overflow-hidden">
        {/* Main Column */}
        <div className="flex-1 flex flex-col min-h-0 sm:overflow-hidden">
          {/* Header - desktop only */}
          {!isMobile && (
            <header className="flex items-center justify-between p-4 border-b border-slate-700/50 relative z-10">
              <h1 className="text-3xl font-black tracking-tight">{room?.code}</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.location.href = '/join'}
                  className="px-3 py-1.5 text-xs font-medium bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg transition-colors"
                  title="Bail"
                >
                  Bail
                </button>
                <button
                  onClick={() => setShowVIBox(!showVIBox)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    showVIBox 
                      ? 'bg-cyan-600 text-cyan-100' 
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                  title={showVIBox ? 'Close VIBox' : 'VIBox'}
                >
                  VIBox
                </button>
                <button
                  onClick={() => setShowHowToPlay(true)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    showHowToPlay 
                      ? 'bg-cyan-600 text-cyan-100' 
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                  title={showHowToPlay ? 'Close Help' : 'Help'}
                >
                  Help
                </button>
                <div ref={!isMobile ? accountMenuRef : undefined} className="relative">
                  <button
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      showAccountMenu 
                        ? 'bg-cyan-600 text-cyan-100' 
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                    title={showAccountMenu ? 'Close Profile' : 'Profile'}
                  >
                    {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Profile'}
                  </button>
                  {showAccountMenu && (
                    <div className="absolute top-full right-0 mt-2 w-64 rounded-xl bg-slate-800 border border-cyan-400/50 shadow-lg shadow-fuchsia-500/20 z-50 overflow-hidden">
                      <div className="p-4 space-y-3">
                        {user ? (
                          <>
                            <div className="space-y-1">
                              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Account</p>
                              {user.user_metadata?.display_name && (
                                <p className="text-sm font-semibold text-pink-400">{user.user_metadata.display_name}</p>
                              )}
                              {user.email ? (
                                <p className="text-sm text-cyan-300 break-all">{user.email}</p>
                              ) : (
                                <p className="text-sm text-slate-400 italic">No email</p>
                              )}
                            </div>
                            {isGuest && (
                              <div className="pt-2 border-t border-slate-700">
                                <p className="text-xs text-slate-400">Guest mode</p>
                              </div>
                            )}
                            <div className="pt-2 border-t border-slate-700">
                              <button
                                onClick={handleSignOut}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                </svg>
                                Sign Out
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Not signed in</p>
                            <p className="text-sm text-slate-400">Sign in to access your account</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleLeaveRoom}
                  className="px-3 py-1.5 text-xs font-medium bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg transition-colors"
                >
                  Leave
                </button>
              </div>
            </header>
          )}

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
        </div>

        {/* Right Sidebar — desktop only (hidden on mobile via internal class) */}
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

      {/* Mobile Drawers */}
      <LobbyDrawer
        memberships={memberships}
        isOpen={showLobbyDrawer}
        onClose={() => setShowLobbyDrawer(false)}
      />
      <ChatDrawer
        isOpen={showChatDrawer}
        onClose={() => setShowChatDrawer(false)}
        roomId={room?.id}
        userId={user?.id}
        membershipId={myMembership?.id}
        displayName={myDisplayName}
      />
      <LeaderboardHistoryDrawer
        isOpen={showLeaderboardDrawer}
        onClose={() => setShowLeaderboardDrawer(false)}
        roomId={room?.id}
        currentSessionId={sessionId}
      />
      <HelpDrawer
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        initialPhase={session?.status}
      />

      {/* Floating Action Buttons - Mobile only */}
      {isMobile && (
        <div className="fixed right-4 bottom-24 flex flex-col items-end gap-3 z-40 sm:hidden">
          {/* Leaderboard Button */}
          <button
            onClick={() => {
              setShowLeaderboardDrawer(!showLeaderboardDrawer);
              setShowChatDrawer(false);
              setShowLobbyDrawer(false);
            }}
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
              showLeaderboardDrawer 
                ? 'bg-amber-400 text-white shadow-amber-400/40' 
                : 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-500/30'
            }`}
            aria-label={showLeaderboardDrawer ? 'Close Leaderboard' : 'Open Leaderboard'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
          
          {/* Chat Button */}
          <button
            onClick={() => {
              setShowChatDrawer(!showChatDrawer);
              setShowLeaderboardDrawer(false);
              setShowLobbyDrawer(false);
            }}
            className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
              showChatDrawer 
                ? 'bg-cyan-400 text-white shadow-cyan-400/40' 
                : 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-cyan-500/30'
            }`}
            aria-label={showChatDrawer ? 'Close Chat' : 'Open Chat'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      )}

      {/* Bottom Navigation Bar - Mobile only */}
      <nav className={`chaos-bottom-nav sm:hidden ${shouldHideBottomNav ? 'hidden' : ''}`}>
        <button type="button" className="chaos-nav-item" onClick={() => window.location.href = '/join'}>
          <div className="text-2xl">🚪</div>
          <span className="chaos-nav-label">Bail</span>
        </button>
        <button
          type="button"
          className={`chaos-nav-item ${showLobbyDrawer ? 'opacity-100' : 'opacity-70'}`}
          onClick={() => {
            setShowLobbyDrawer(!showLobbyDrawer);
            setShowChatDrawer(false);
            setShowLeaderboardDrawer(false);
          }}
        >
          <div className="text-2xl">👥</div>
          <span className="chaos-nav-label">Lobby</span>
        </button>
        <button 
          type="button" 
          className={`chaos-nav-item ${showVIBox ? 'opacity-100' : 'opacity-70'}`}
          onClick={() => setShowVIBox(!showVIBox)}
        >
          <div className="text-2xl">🎵</div>
          <span className="chaos-nav-label">VIBox</span>
        </button>
        <button 
          type="button" 
          className={`chaos-nav-item ${showHowToPlay ? 'opacity-100' : 'opacity-70'}`}
          onClick={() => setShowHowToPlay(!showHowToPlay)}
        >
          <div className="text-2xl">❓</div>
          <span className="chaos-nav-label">Help</span>
        </button>
        <div ref={isMobile ? accountMenuRef : undefined} className="relative">
          <button 
            type="button" 
            className={`chaos-nav-item ${showAccountMenu ? 'opacity-100' : 'opacity-70'}`}
            onClick={() => setShowAccountMenu(!showAccountMenu)}
          >
            <div className="text-2xl">
              {user ? (
                isGuest ? '👤' : (
                  <span className="text-sm font-semibold">
                    {(user.user_metadata?.display_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </span>
                )
              ) : '👤'}
            </div>
            <span className="chaos-nav-label">Profile</span>
          </button>
          {showAccountMenu && isMobile && (
            <div className="absolute bottom-full right-0 mb-2 w-64 rounded-xl bg-slate-800 border border-cyan-400/50 shadow-lg shadow-fuchsia-500/20 z-50 overflow-hidden">
              <div className="p-4 space-y-3">
                {user ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Account</p>
                      {user.user_metadata?.display_name && (
                        <p className="text-sm font-semibold text-pink-400">{user.user_metadata.display_name}</p>
                      )}
                      {user.email ? (
                        <p className="text-sm text-cyan-300 break-all">{user.email}</p>
                      ) : (
                        <p className="text-sm text-slate-400 italic">No email</p>
                      )}
                    </div>
                    {isGuest && (
                      <div className="pt-2 border-t border-slate-700">
                        <p className="text-xs text-slate-400">Guest mode</p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-700">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Not signed in</p>
                    <p className="text-sm text-slate-400">Sign in to access your account</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Ended Phase Modals */}
      <Suspense fallback={null}>
        {state.endedModals.includes('leaderboard') && (
          <LeaderboardModal
            isOpen={true}
            onClose={() => closeEndedModal('leaderboard')}
            finalLeaderboard={teams.map((t, i) => ({
              id: t.id,
              teamName: t.teamName || 'Unknown',
              score: t.score || 0,
              rank: i + 1,
              mascotId: t.mascotId,
            }))}
            currentMembershipId={memberships?.find(m => m.userId === user?.id)?.id}
            onLeave={handleLeaveRoom}
          />
        )}
        {state.endedModals.includes('selfie') && (
          <SelfieModal
            isOpen={true}
            onClose={() => closeEndedModal('selfie')}
            currentTeam={teams.find(t => t.uid === user?.id)}
            finalLeaderboard={teams.map((t, i) => ({ ...t, rank: i + 1 }))}
            venueName={session?.venueName}
          />
        )}

        {/* Answer Modal */}
        {state.activeModal === 'answer' && session && sessionId && (
          <AnswerModal
            isOpen={true}
            onClose={() => closeModal()}
            sessionId={sessionId}
            roundIndex={session.roundIndex || 0}
            prompt={session.rounds?.[session.roundIndex || 0]?.groups?.[0]?.prompt || ''}
            onSubmit={() => {
              markSubmitted('answer');
              closeModal();
            }}
            endsAt={session.endsAt}
            paused={session.paused}
          />
        )}

        {/* Vote Modal */}
        {state.activeModal === 'vote' && session && sessionId && (
          <VoteModal
            isOpen={true}
            onClose={() => closeModal()}
            sessionId={sessionId}
            roundIndex={session.roundIndex || 0}
            answers={[]} // Will be populated via hook inside modal or passed from parent
            teams={teams}
            onSubmit={() => {
              markSubmitted('vote');
              closeModal();
            }}
            prompt={session.rounds?.[session.roundIndex || 0]?.groups?.[0]?.prompt || ''}
            endsAt={session.endsAt}
            paused={session.paused}
          />
        )}
      </Suspense>

      {/* VIBox Modal */}
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

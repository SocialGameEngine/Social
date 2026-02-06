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
import { RoomCanvas } from './layout/RoomCanvas';
import { RoomInfoRail } from './layout/RoomInfoRail';
import { ActivityFeedWidget } from '../widgets/ActivityFeedWidget';
import { RoomChatWidget } from '../widgets/RoomChatWidget';
import { PollsWidget } from '../widgets/PollsWidget';
import { TriviaWidget } from '../widgets/TriviaWidget';

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
  
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showVIBox, setShowVIBox] = useState(false);
  const [isWidgetsExpanded, setIsWidgetsExpanded] = useState(false);
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
  const modalsThatHideNav: Array<'leaderboard' | 'selfie'> = ['selfie']; // Add 'leaderboard' or others as needed
  const shouldHideBottomNav = modalsThatHideNav.some(modal => state.endedModals.includes(modal));

  // Shared widget cards rendered in both layouts
  const widgetCards = (
    <>
      <ActivityFeedWidget />
      <RoomChatWidget />
      <PollsWidget />
      <TriviaWidget />
    </>
  );

  return (
    <div className="min-h-[90dvh] flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white overflow-hidden">
      <BackgroundAnimation show={true} />

      {isMobile ? (
        /* ── Mobile Layout ── */
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* SessionPanel - at top, fixed height, lower z-index so widgets can overlay */}
          <div className="shrink-0 relative z-10">
            <SessionPanel
              session={session}
              sessionId={sessionId}
              memberships={memberships}
              onOpenLeaderboard={() => openEndedModal('leaderboard')}
              onOpenSelfie={() => openEndedModal('selfie')}
              onOpenModal={openModal}
              isSticky={false}
            />
          </div>

          {/* Bottom area: absolute positioned so widgets can overlay SessionPanel */}
          <div className={`absolute bottom-0 left-0 right-0 flex flex-col z-10 transition-all duration-300 ease-out ${isWidgetsExpanded ? 'h-[66vh] bg-slate-900/95 backdrop-blur-sm' : 'h-[33vh]'}`}>
            {/* Divider with toggle - at top of overlay area */}
            <button
              onClick={() => setIsWidgetsExpanded(!isWidgetsExpanded)}
              className="relative h-1 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent shrink-0 w-full group cursor-pointer z-30"
              aria-label={isWidgetsExpanded ? 'Collapse widgets' : 'Expand widgets'}
            >
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className={`w-7 h-7 rounded-full bg-slate-900 border border-cyan-400/40 flex items-center justify-center shadow-lg shadow-cyan-500/20 transition-transform duration-300 ${isWidgetsExpanded ? '' : 'rotate-180'}`}>
                  <svg className="w-4 h-4 text-cyan-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Widgets section - expands upward OVER SessionPanel */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <RoomCanvas>{widgetCards}</RoomCanvas>
            </div>
          </div>
        </div>
      ) : (
        /* ── Desktop Layout (2-column) ── */
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Main Column */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-slate-700/50 order-1">
              <h1 className="text-3xl font-black tracking-tight">{room?.code}</h1>
              <button
                onClick={handleLeaveRoom}
                className="px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-slate-300"
              >
                Leave
              </button>
            </header>

            <div className={`flex flex-col min-h-0 overflow-hidden transition-all duration-300 ease-out order-5 z-10 ${isWidgetsExpanded ? 'max-h-[80vh]' : 'max-h-[50vh]'} flex-1`}>
              <RoomCanvas>{widgetCards}</RoomCanvas>
            </div>

            {/* Modern gradient divider with toggle chevron */}
            <button
              onClick={() => setIsWidgetsExpanded(!isWidgetsExpanded)}
              className="relative h-1 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent shrink-0 w-full group cursor-pointer order-4"
              aria-label={isWidgetsExpanded ? 'Collapse widgets' : 'Expand widgets'}
            >
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className={`w-7 h-7 rounded-full bg-slate-900 border border-cyan-400/40 flex items-center justify-center shadow-lg shadow-cyan-500/20 transition-transform duration-300 ${isWidgetsExpanded ? '' : 'rotate-180'}`}>
                  <svg className="w-4 h-4 text-cyan-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            <div className="shrink-0">
              <SessionPanel
                session={session}
                sessionId={sessionId}
                memberships={memberships}
                onOpenLeaderboard={() => openEndedModal('leaderboard')}
                onOpenSelfie={() => openEndedModal('selfie')}
                onOpenModal={openModal}
              />
            </div>
          </div>

          {/* Right Rail */}
          <RoomInfoRail
            memberships={memberships}
            room={room}
            isCollapsed={isRailCollapsed}
            onToggle={() => setIsRailCollapsed(!isRailCollapsed)}
          />
        </div>
      )}

      {/* Bottom Navigation Bar - Mobile only: Home, VIBox, Help, Profile */}
      <nav className={`chaos-bottom-nav sm:hidden ${shouldHideBottomNav ? 'hidden' : ''}`}>
        <button
          type="button"
          className="chaos-nav-item"
          onClick={() => window.location.href = '/'}
        >
          <div className="text-2xl">🏠</div>
          <span className="chaos-nav-label">Home</span>
        </button>
        <button
          type="button"
          className="chaos-nav-item"
          onClick={() => setShowVIBox(true)}
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
        <div ref={accountMenuRef} className="relative">
          <button
            type="button"
            className="chaos-nav-item"
            onClick={() => setShowAccountMenu(!showAccountMenu)}
          >
            <div className="text-2xl">
              {user ? (
                isGuest ? (
                  '👤'
                ) : (
                  <span className="text-sm font-semibold">
                    {(user.user_metadata?.display_name?.[0] || user.email?.[0] || "U").toUpperCase()}
                  </span>
                )
              ) : (
                '👤'
              )}
            </div>
            <span className="chaos-nav-label">Profile</span>
          </button>

          {/* Account Menu Dropdown */}
          {showAccountMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-64 rounded-xl bg-slate-800 border border-cyan-400/50 shadow-lg shadow-fuchsia-500/20 z-50 overflow-hidden">
              <div className="p-4 space-y-3">
                {user ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
                        Account
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
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
                      Not signed in
                    </p>
                    <p className="text-sm text-slate-400">
                      Sign in to access your account
                    </p>
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

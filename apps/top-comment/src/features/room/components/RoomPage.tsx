import { useState, useEffect, useCallback, lazy, Suspense, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../../../hooks/useRoom';
import { useSession, useTeams, useAnswers } from '../../session/hooks';
import { RoomPageProvider } from '../context/RoomPageContext';
import { useRoomPage } from '../hooks/useRoomPage';
import { PhaseCardButton } from './PhaseCardButton';
import { DrinkTank } from '../../../components/DrinkTank';
import { BackgroundAnimation } from '../../../components/BackgroundAnimation';
import { getSessionPhase } from '../utils/phaseConfig';
import { useAuth } from '../../../shared/providers/AuthContext';
import { VIBoxJukebox } from '../../../shared/components/vibox/VIBoxJukebox';
import type { GamePhase } from '../types';

// Lazy load modals for performance
const AnswerModal = lazy(() => import('./AnswerModal.tsx'));
const VoteModal = lazy(() => import('./VoteModal.tsx'));

function RoomPageContent() {
  const { room, memberships, session, sessionId, state, openModal, closeModal, markSubmitted, handleLeaveRoom } = useRoomPage();
  const { user, isGuest, signOut } = useAuth();
  const navigate = useNavigate();
  const currentPhase = getSessionPhase(session);
  const teams = useTeams(sessionId || undefined);
  const answers = useAnswers(sessionId || undefined, session?.roundIndex);
  
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showVIBox, setShowVIBox] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const handleOpenModal = useCallback((phase: GamePhase) => {
    if (phase === 'answer' || phase === 'vote') {
      openModal(phase);
    }
  }, [openModal]);

  const handleAnswerSubmit = useCallback(() => {
    markSubmitted('answer');
    closeModal();
  }, [markSubmitted, closeModal]);

  const handleVoteSubmit = useCallback(() => {
    markSubmitted('vote');
    closeModal();
  }, [markSubmitted, closeModal]);

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <BackgroundAnimation show={true} />
      
      {/* Header - Hidden on mobile */}
      <header className="hidden sm:flex items-center justify-between p-4 border-b border-slate-700/50">
        <h1 className="text-3xl font-black tracking-tight">{room?.code}</h1>
        <button
          onClick={handleLeaveRoom}
          className="px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-slate-300"
        >
          Leave
        </button>
      </header>

      {/* Main Content - Added pt-4 for mobile (no header), pb-28 for bottom nav */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 pt-4 sm:pt-4 pb-28 sm:pb-4 max-w-2xl mx-auto w-full">
        {/* Phase Status */}
        <div className="w-full mb-8">
          <PhaseCardButton
            phase={currentPhase}
            hasSubmitted={
              currentPhase === 'answer' 
                ? state.submissionStatus.answer 
                : currentPhase === 'vote' 
                  ? state.submissionStatus.vote 
                  : false
            }
            onClick={() => handleOpenModal(currentPhase)}
            disabled={currentPhase === 'lobby' || currentPhase === 'ended'}
            endsAt={session?.endsAt}
            paused={session?.paused}
            prompt={session?.rounds?.[session?.roundIndex || 0]?.groups?.[0]?.prompt || ''}
          />
        </div>

        {/* Drink Tank */}
        <DrinkTank roomMemberships={memberships || []} />
      </main>

      {/* Bottom Navigation Bar - Mobile only: Home, VIBox, Help, Profile */}
      <nav className="chaos-bottom-nav sm:hidden">
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

      {/* Modals */}
      <Suspense fallback={null}>
        {state.activeModal === 'answer' && sessionId && (
          <AnswerModal
            isOpen={true}
            onClose={closeModal}
            sessionId={sessionId}
            roundIndex={session?.roundIndex || 0}
            prompt={session?.rounds?.[session?.roundIndex || 0]?.groups?.[0]?.prompt || ''}
            onSubmit={handleAnswerSubmit}
            endsAt={session?.endsAt}
            paused={session?.paused}
          />
        )}
        {state.activeModal === 'vote' && sessionId && (
          <VoteModal
            isOpen={true}
            onClose={closeModal}
            sessionId={sessionId}
            roundIndex={session?.roundIndex || 0}
            answers={answers}
            teams={teams}
            onSubmit={handleVoteSubmit}
            prompt={session?.rounds?.[session?.roundIndex || 0]?.groups?.[0]?.prompt || ''}
            endsAt={session?.endsAt}
            paused={session?.paused}
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
    autoRefresh: false,
  });

  const { session } = useSession(sessionId || undefined);

  // Get sessionId from room when it updates
  useEffect(() => {
    if (room?.currentSessionId && !sessionId) {
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

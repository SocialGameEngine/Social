/**
 * RoomPage Migration Example - Using V2 Async Hooks
 * 
 * This is an EXAMPLE showing how to migrate RoomPage to use the new async state architecture.
 * 
 * Key Changes:
 * 1. useRoom → useRoomV2
 * 2. useSession → useSession (from hooks-v2)
 * 3. Add skeleton loading states
 * 4. Add connection status indicators
 * 5. Add error states with retry
 * 6. Add stale data banners
 * 
 * BEFORE implementing, review this example and adapt to your specific needs.
 */

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useRoomV2 } from '../../../hooks/useRoomV2';
import { useSession } from '../../session/hooks-v2';
import { RoomPageProvider } from '../context/RoomPageContext';
import { useAuth } from '../../../shared/providers/AuthContext';
import { RoomPageContent } from './index';
import { PlayerAuthModal } from '../../auth/PlayerAuthModal';
import { VenueAuthModal } from '../../auth/VenueAuthModal';
import { RoomSkeleton } from '../../../shared/components/skeletons/RoomSkeleton';
import { ErrorState } from '../../../shared/components/ErrorState';
import { ConnectionIndicator } from '../../../shared/components/ConnectionIndicator';
import { StaleDataBanner } from '../../../shared/components/StaleDataBanner';
import { AsyncErrorBoundary } from '../../../shared/components/AsyncErrorBoundary';

export function RoomPageV2() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { loading: authLoading, user, isGuest, signOut, isVenueAccount } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showPlayerAuthModal, setShowPlayerAuthModal] = useState(false);
  const [showVenueAuthModal, setShowVenueAuthModal] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  
  // V2 HOOK: useRoomV2 returns AsyncSubscriptionResult
  const {
    status: roomStatus,
    data: roomData,
    error: roomError,
    connectionStatus: roomConnectionStatus,
    retry: retryRoom,
    isStale: roomIsStale,
  } = useRoomV2({ roomCode });

  // V2 HOOK: useSession from hooks-v2 returns AsyncSubscriptionResult
  const {
    status: sessionStatus,
    data: session,
    connectionStatus: sessionConnectionStatus,
  } = useSession(sessionId || undefined);

  // Extract room data (V2 returns data object, not flat properties)
  const room = roomData?.room;
  const memberships = roomData?.memberships || [];

  // Get sessionId from room when it updates
  useEffect(() => {
    console.log('🏠 Room updated:', { roomId: room?.id, roomSessionId: room?.currentSessionId, localSessionId: sessionId });
    if (room?.currentSessionId && room.currentSessionId !== sessionId) {
      console.log('🔄 Updating sessionId from', sessionId, 'to', room.currentSessionId);
      setSessionId(room.currentSessionId);
    }
  }, [room, sessionId]);

  // Account button handlers (unchanged)
  const handlePlayerSignIn = () => {
    setShowAccountMenu(false);
    setShowPlayerAuthModal(true);
  };

  const handleVenueSignIn = () => {
    setShowAccountMenu(false);
    setShowVenueAuthModal(true);
  };

  const handleSignOut = async () => {
    if (!signOut) return;
    try {
      await signOut();
      setShowAccountMenu(false);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // Close account menu when clicking outside (unchanged)
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

  // V2 LOADING STATE: Show skeleton instead of generic loading text
  if (authLoading || roomStatus === "booting" || roomStatus === "loading") {
    return <RoomSkeleton />;
  }

  // V2 ERROR STATE: Show error component with retry
  if (roomStatus === "error" || !room) {
    return (
      <ErrorState
        title="Room Not Found"
        message={roomError?.message || `The room code "${roomCode}" doesn't exist.`}
        onRetry={retryRoom}
        retryLabel="Try Again"
      />
    );
  }

  // V2 ASYNC ERROR BOUNDARY: Wrap content to catch async errors
  return (
    <AsyncErrorBoundary>
      {/* V2 CONNECTION STATUS: Show connection indicator for real-time updates */}
      <div className="fixed top-4 left-4 z-50">
        <ConnectionIndicator 
          status={roomConnectionStatus} 
          onReconnect={retryRoom}
        />
      </div>

      {/* V2 STALE DATA BANNER: Show when room data is stale */}
      {roomIsStale && (
        <div className="fixed top-16 left-4 right-4 z-40">
          <StaleDataBanner onRefresh={retryRoom} />
        </div>
      )}

      {/* Account Button - Fixed top right (unchanged) */}
      <div className="fixed top-4 right-4 z-50">
        <div className="relative" ref={accountMenuRef}>
          <button
            onClick={() => user ? setShowAccountMenu(!showAccountMenu) : handlePlayerSignIn()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-600/80 hover:bg-slate-500/80 hover:scale-110 hover:shadow-lg hover:shadow-cyan-400/50 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            aria-label={user ? "Account menu" : "Sign in"}
            aria-expanded={showAccountMenu}
          >
            {user && !isGuest ? (
              <span className="text-slate-200 text-sm font-semibold">
                {(user.user_metadata?.display_name?.[0] || user.email?.[0] || "U").toUpperCase()}
              </span>
            ) : user && isGuest ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 text-cyan-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 text-slate-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            )}
          </button>

          {/* Account Menu Dropdown (unchanged) */}
          {showAccountMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 rounded-xl bg-slate-800 border border-cyan-400/50 shadow-lg shadow-fuchsia-500/20 z-50 overflow-hidden">
              <div className="p-4 space-y-3">
                {user ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
                        {isVenueAccount ? "Venue Account" : "Player Account"}
                      </p>
                      {user.user_metadata?.display_name && (
                        <p className="text-sm font-semibold text-pink-400">
                          {user.user_metadata.display_name}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* V2 PROVIDER: Pass room and memberships from data object */}
      <RoomPageProvider
        room={room}
        memberships={memberships}
        session={session}
        sessionStatus={sessionStatus}
        sessionConnectionStatus={sessionConnectionStatus}
      >
        <RoomPageContent />
      </RoomPageProvider>

      {/* Auth Modals (unchanged) */}
      {showPlayerAuthModal && (
        <PlayerAuthModal onClose={() => setShowPlayerAuthModal(false)} />
      )}
      {showVenueAuthModal && (
        <VenueAuthModal onClose={() => setShowVenueAuthModal(false)} />
      )}
    </AsyncErrorBoundary>
  );
}

/**
 * MIGRATION CHECKLIST:
 * 
 * ✅ Replace useRoom with useRoomV2
 * ✅ Replace useSession with hooks-v2 version
 * ✅ Update destructuring to use { status, data, error, connectionStatus }
 * ✅ Replace generic loading with RoomSkeleton
 * ✅ Add ErrorState component with retry
 * ✅ Add ConnectionIndicator for real-time status
 * ✅ Add StaleDataBanner for stale data
 * ✅ Wrap in AsyncErrorBoundary
 * ✅ Update RoomPageProvider props to match new data structure
 * 
 * TESTING CHECKLIST:
 * 
 * □ Test loading state shows skeleton
 * □ Test error state shows error with retry
 * □ Test connection indicator shows Live/Reconnecting/Offline
 * □ Test stale data banner appears after 30s
 * □ Test retry functionality works
 * □ Test all existing functionality still works
 */

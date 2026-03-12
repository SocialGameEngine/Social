import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/providers/AuthContext';

interface RoomBottomNavProps {
  showLobbyDrawer: boolean;
  showVIBox: boolean;
  showHowToPlay: boolean;
  onToggleLobby: () => void;
  onToggleVIBox: () => void;
  onToggleHelp: () => void;
  isMember?: boolean;
  onJoinRoom?: () => void;
}

export function RoomBottomNav({
  showLobbyDrawer,
  showVIBox,
  showHowToPlay,
  onToggleLobby,
  onToggleVIBox,
  onToggleHelp,
  isMember = true,
  onJoinRoom,
}: RoomBottomNavProps) {
  const { user, isGuest, signOut } = useAuth();
  const navigate = useNavigate();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = useCallback(async () => {
    if (!signOut) return;
    try {
      await signOut();
      setShowAccountMenu(false);
      navigate('/join');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }, [signOut, navigate]);

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
    <>
      <button type="button" className="chaos-nav-item" onClick={() => window.location.href = '/join'}>
        <div className="text-2xl">🚪</div>
        <span className="chaos-nav-label">Bail</span>
      </button>
      <button
        type="button"
        className={`chaos-nav-item ${showLobbyDrawer ? 'opacity-100' : 'opacity-70'}`}
        onClick={() => isMember ? onToggleLobby() : onJoinRoom?.()}
        title={isMember ? undefined : "Join this room to access lobby"}
      >
        <div className="text-2xl">{isMember ? '👥' : '🔒'}</div>
        <span className="chaos-nav-label">{isMember ? 'Lobby' : 'Join'}</span>
      </button>
      <button 
        type="button" 
        className={`chaos-nav-item ${showVIBox ? 'opacity-100' : 'opacity-70'}`}
        onClick={onToggleVIBox}
      >
        <div className="text-2xl">🎵</div>
        <span className="chaos-nav-label">VIBox</span>
      </button>
      <button 
        type="button" 
        className={`chaos-nav-item ${showHowToPlay ? 'opacity-100' : 'opacity-70'}`}
        onClick={onToggleHelp}
      >
        <div className="text-2xl">❓</div>
        <span className="chaos-nav-label">Help</span>
      </button>
      <div ref={accountMenuRef} className="relative">
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
        {showAccountMenu && (
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
    </>
  );
}

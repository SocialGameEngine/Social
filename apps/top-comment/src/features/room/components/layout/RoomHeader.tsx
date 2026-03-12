import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../shared/providers/AuthContext';

interface RoomHeaderProps {
  roomCode: string | undefined;
  showVIBox: boolean;
  showHowToPlay: boolean;
  onToggleVIBox: () => void;
  onToggleHelp: () => void;
  onLeaveRoom: () => void;
}

export function RoomHeader({
  roomCode,
  showVIBox,
  showHowToPlay,
  onToggleVIBox,
  onToggleHelp,
  onLeaveRoom,
}: RoomHeaderProps) {
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
    <header className="flex items-center justify-between p-4 border-b border-slate-700/50 relative z-10">
      <h1 className="text-3xl font-black tracking-tight">{roomCode}</h1>
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.location.href = '/join'}
          className="px-3 py-1.5 text-xs font-medium bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg transition-colors"
          title="Bail"
        >
          Bail
        </button>
        <button
          onClick={onToggleVIBox}
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
          onClick={onToggleHelp}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            showHowToPlay 
              ? 'bg-cyan-600 text-cyan-100' 
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
          title={showHowToPlay ? 'Close Help' : 'Help'}
        >
          Help
        </button>
        <div ref={accountMenuRef} className="relative">
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
          onClick={onLeaveRoom}
          className="px-3 py-1.5 text-xs font-medium bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg transition-colors"
        >
          Leave
        </button>
      </div>
    </header>
  );
}

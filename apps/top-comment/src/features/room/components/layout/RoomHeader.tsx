import { useRef, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../../shared/providers/AuthContext';

interface RoomHeaderProps {
  roomCode: string | undefined;
}

export function RoomHeader({
  roomCode,
}: RoomHeaderProps) {
  const { user, isAnonymous, signOut } = useAuth();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      setShowAccountMenu(false);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }, [signOut]);

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
    <header className="flex items-center justify-between p-4 border-b border-slate-700/50 relative z-30">
      <h1 className="text-3xl font-black tracking-tight">{roomCode}</h1>
      <div ref={accountMenuRef} className="relative">
        <button
          type="button"
          onClick={() => setShowAccountMenu(!showAccountMenu)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-600/80 hover:bg-slate-500/80 hover:scale-110 hover:shadow-lg hover:shadow-cyan-400/50 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          aria-label={user ? "Account menu" : "Sign in"}
          aria-expanded={showAccountMenu}
        >
          {user && !isAnonymous ? (
            <span className="text-slate-200 text-sm font-semibold">
              {(user.user_metadata?.display_name?.[0] || user.email?.[0] || "U").toUpperCase()}
            </span>
          ) : user && isAnonymous ? (
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
              className="w-5 h-5 text-slate-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
          )}
        </button>
          {showAccountMenu && (
            <div
              onMouseDown={(event) => event.stopPropagation()}
              className="absolute top-full right-0 mt-2 w-64 rounded-xl bg-slate-800 border border-cyan-400/50 shadow-lg shadow-fuchsia-500/20 z-[120] overflow-hidden"
            >
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
                    {isAnonymous && (
                      <div className="pt-2 border-t border-slate-700">
                        <p className="text-xs text-slate-400">Guest mode</p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-700">
                      <button
                        type="button"
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={async (event) => {
                          event.stopPropagation();
                          await handleSignOut();
                        }}
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
    </header>
  );
}

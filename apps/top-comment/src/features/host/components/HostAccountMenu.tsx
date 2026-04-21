import { useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { logger } from "../../../shared/utils/logger";

interface HostAccountMenuProps {
  user: User | null;
  isAnonymous: boolean;
  isVenueAccount: boolean;
  showAccountMenu: boolean;
  setShowAccountMenu: (show: boolean) => void;
  accountMenuRef: React.RefObject<HTMLDivElement>;
  onPlayerSignIn: () => void;
  onVenueSignIn: () => void;
  onSignOut: () => Promise<void>;
}

export function HostAccountMenu({
  user,
  isAnonymous,
  isVenueAccount,
  showAccountMenu,
  setShowAccountMenu,
  accountMenuRef,
  onPlayerSignIn,
  onVenueSignIn,
  onSignOut,
}: HostAccountMenuProps) {
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
  }, [showAccountMenu, accountMenuRef, setShowAccountMenu]);

  const handleSignOut = async () => {
    logger.debug('HostAccountMenu handleSignOut called');
    try {
      await onSignOut();
      logger.debug('signOut completed');
      setShowAccountMenu(false);
    } catch (error) {
      logger.error('Sign out failed', { error });
    }
  };

  const handlePlayerSignIn = () => {
    setShowAccountMenu(false);
    onPlayerSignIn();
  };

  const handleVenueSignIn = () => {
    setShowAccountMenu(false);
    onVenueSignIn();
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="relative" ref={accountMenuRef}>
        <button
          onClick={() => user ? setShowAccountMenu(!showAccountMenu) : handleVenueSignIn()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-600/80 hover:bg-slate-500/80 hover:scale-110 hover:shadow-lg hover:shadow-pink-400/50 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-slate-950"
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
              className="w-5 h-5 text-pink-400"
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

        {/* Account Menu Dropdown */}
        {showAccountMenu && (
          <div className="absolute top-full right-0 mt-2 w-64 rounded-xl bg-slate-800 border border-pink-400/50 shadow-lg shadow-pink-500/20 z-50 overflow-hidden">
            <div className="p-4 space-y-3">
              {user ? (
                <>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-pink-400">
                      {isVenueAccount ? "Venue Account" : "Player Account"}
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
                  {isAnonymous && (
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
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-pink-400">
                      Not signed in
                    </p>
                    <p className="text-sm text-slate-400">
                      Choose your account type to get started
                    </p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={handlePlayerSignIn}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 hover:bg-slate-700/50 rounded-lg transition-colors"
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
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Player Sign In
                    </button>
                    <button
                      onClick={handleVenueSignIn}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-pink-400 hover:text-pink-300 hover:bg-slate-700/50 rounded-lg transition-colors"
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
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Venue Sign In
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

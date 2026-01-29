import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../shared/providers/AuthContext";
import { useState, useEffect, useRef } from "react";

export function RootLayout() {
  // Safely use hooks with error handling
  let user, isGuest, signOut;
  try {
    const authData = useAuth();
    user = authData?.user;
    isGuest = authData?.isGuest;
    signOut = authData?.signOut;
  } catch (error) {
    console.warn('Auth hook error:', error);
    user = null;
    isGuest = false;
    signOut = undefined;
  }

  
  // Mobile scroll behavior - hide/show navbar
  const [isMobile, setIsMobile] = useState(false);
  const [navbarHidden, setNavbarHidden] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) return; // Only run on mobile

    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 50) {
        setNavbarHidden(false); // Always show at top
      } else if (currentScrollY > lastScrollY + 10) {
        setNavbarHidden(true); // Scrolling down
      } else if (currentScrollY < lastScrollY - 10) {
        setNavbarHidden(false); // Scrolling up
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

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

  // Handle logout
  const handleSignOut = async () => {
    if (!signOut) return;
    try {
      await signOut();
      setShowAccountMenu(false);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };


  return (
    <div className="min-h-[100svh] bg-transparent text-slate-900">
      {/* Navbar - Fixed positioning, hides on mobile scroll */}
      <nav className={`
        fixed top-0 left-0 right-0 z-50 h-16
        transition-transform duration-200 will-change-transform
        ${isMobile && navbarHidden ? '-translate-y-full' : 'translate-y-0'}
        backdrop-blur-md bg-slate-900/40 border-b border-slate-700/50
        shadow-lg shadow-black/10
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          {/* Left: User Avatar with Account Menu */}
          <div className="flex-shrink-0 relative" ref={accountMenuRef}>
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-slate-700/60 hover:bg-slate-600/60 backdrop-blur-sm border border-slate-600/50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
              aria-label="Account menu"
              aria-expanded={showAccountMenu}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 shrink-0">
                {user ? (
                  isGuest ? (
                    // Guest mode icon
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4 text-slate-300"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  ) : (
                    // User initial
                    <span className="text-slate-200">
                      {(user.user_metadata?.display_name?.[0] || user.email?.[0] || "U").toUpperCase()}
                    </span>
                  )
                ) : (
                  // Not logged in - show guest icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4 text-slate-300"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                )}
              </div>
              {user && (
                <span className="text-slate-200 hidden sm:block max-w-[120px] truncate">
                  {user.user_metadata?.display_name || user.email?.split('@')[0] || 'Account'}
                </span>
              )}
            </button>

            {/* Account Menu Dropdown */}
            {showAccountMenu && (
              <div className="absolute top-full left-0 mt-2 w-64 rounded-xl bg-slate-800 border border-cyan-400/50 shadow-lg shadow-fuchsia-500/20 z-50 overflow-hidden">
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

          {/* Center: Logo with Pub Social text - absolute left-1/2 -translate-x-1/2 top-0 outside any parent with transform */}
          <div className="absolute left-1/2 top-0 h-16 flex items-center gap-3 -translate-x-1/2">
            <Link to="/" className="flex items-center gap-3 transition-transform hover:scale-105">
              <img
                src="/logo.png"
                alt="Söcial logo - Click to go home"
                className="h-12 w-auto drop-shadow-lg cursor-pointer"
                title="Click to go home"
              />
              <span 
                className="text-2xl font-black tracking-tight"
                style={{
                  color: '#ff00ff',
                  filter: 'drop-shadow(0 0 2px #ff00ff) drop-shadow(0 0 4px rgba(255, 0, 255, 0.3))'
                }}
              >
                Pub Söcial
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content with padding-top = navbar height */}
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
}

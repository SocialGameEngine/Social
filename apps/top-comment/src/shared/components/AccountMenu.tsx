import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthContext';
import { AuthModal } from './AuthModal';

interface AccountMenuProps {
  position?: 'above' | 'below';
}

export function AccountMenu({ position = 'below' }: AccountMenuProps) {
  const { user, isAnonymous, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = useCallback(async () => {
    if (!signOut) return;
    try {
      await signOut();
      setIsOpen(false);
      navigate('/join');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }, [signOut, navigate]);

  const handleAuthSuccess = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  const handleSignIn = useCallback(() => {
    setAuthMode('login');
    setIsOpen(false);
    setShowAuthModal(true);
  }, []);

  const handleSignUp = useCallback(() => {
    setAuthMode('signup');
    setIsOpen(false);
    setShowAuthModal(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const positionClass = position === 'above'
    ? 'absolute bottom-full right-0 mb-2'
    : 'absolute top-full right-0 mt-2';

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => user ? setIsOpen(!isOpen) : handleSignIn()}
        className={`chaos-nav-item ${isOpen ? 'opacity-100' : 'opacity-70'}`}
        aria-label={user ? "Account menu" : "Sign in"}
        aria-expanded={isOpen}
      >
        <div className="text-2xl">
          {user && !isAnonymous ? (
            <span className="text-sm font-semibold">
              {(user.user_metadata?.display_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
            </span>
          ) : user && isAnonymous ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-cyan-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          ) : (
            '👤'
          )}
        </div>
        <span className="chaos-nav-label">Profile</span>
      </button>
      {isOpen && user && (
        <div className={`${positionClass} w-64 rounded-xl bg-slate-800 border border-cyan-400/50 shadow-lg shadow-fuchsia-500/20 z-[100] overflow-hidden`}>
          <div className="p-4 space-y-3">
            {user && !isAnonymous ? (
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
              <>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Guest Account</p>
                  <p className="text-sm text-slate-400">You're playing as a guest</p>
                </div>
                <div className="pt-2 border-t border-slate-700">
                  <p className="text-xs text-slate-400 mb-2">Want to save your progress?</p>
                  <button
                    onClick={handleSignIn}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 rounded-lg transition-all shadow-md hover:shadow-lg mb-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    Sign In
                  </button>
                  <div className="pt-2 border-t border-slate-700">
                    <p className="text-xs text-slate-400 text-center">
                      Don't have an account?{' '}
                      <button
                        onClick={handleSignUp}
                        className="text-cyan-400 hover:text-cyan-300 underline font-medium"
                      >
                        Sign up
                      </button>
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-slate-700/50 rounded-lg transition-colors mt-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          initialMode={authMode}
        />
      )}
    </div>
  );
}

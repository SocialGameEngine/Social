import { useState } from 'react';
import { useAuth } from '../providers/AuthContext';
import { AuthModal } from './AuthModal';
import { PlayerRecoveryModal } from '../../features/auth/PlayerRecoveryModal';
import { logger } from '../utils/logger';

interface SignedOutPromptProps {
  /** Optional heading override. */
  title?: string;
  /** Optional description override. */
  description?: string;
  /**
   * Show the "Recover with email link" option (magic-link `PlayerRecoveryModal`).
   * Recommended on player flows (room pages); off for host/venue flows that use
   * email+password through `AuthModal` instead.
   */
  showMagicLink?: boolean;
  /**
   * Scope the magic-link recovery to a specific room. If omitted, the modal
   * still works but won't auto-link a membership for the current room.
   */
  roomCode?: string;
  roomId?: string;
  /** Called once the user has (re)signed in via any path. */
  onResolved: () => void;
}

/**
 * Full-screen blocker shown when the Supabase session has expired or been
 * signed out. Replaces the prior "Continue as Guest"-only modal, which forced
 * returning users to abandon their real account.
 */
export function SignedOutPrompt({
  title = 'Signed out',
  description = "You've been signed out. Sign back in to keep your progress, or continue as a guest.",
  showMagicLink = false,
  roomCode,
  roomId,
  onResolved,
}: SignedOutPromptProps) {
  const { signInAnonymously, clearSessionExpired } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  const handleGuest = async () => {
    setGuestLoading(true);
    setGuestError(null);
    try {
      await signInAnonymously();
      clearSessionExpired();
      onResolved();
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error);
      logger.error('Guest sign-in failed', { error: raw });

      // Supabase surfaces disabled-provider errors in a couple of shapes.
      // Detect and translate to something the user can actually act on.
      const lc = raw.toLowerCase();
      const anonDisabled =
        lc.includes('anonymous') &&
        (lc.includes('disabled') || lc.includes('not allowed') || lc.includes('not enabled'));

      setGuestError(
        anonDisabled
          ? 'Guest access is disabled for this venue. Sign in with your account or use the email link to join.'
          : 'Could not start a guest session. Try signing in instead.',
      );
    } finally {
      setGuestLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    clearSessionExpired();
    onResolved();
  };

  const handleRecovered = () => {
    setShowRecoveryModal(false);
    clearSessionExpired();
    onResolved();
  };

  const subModalOpen = showAuthModal || showRecoveryModal;

  return (
    <>
      {/* Must sit below AuthModal / PlayerRecoveryModal — those use z-[100] and z-50.
          This shell was z-[200], which kept the prompt visually on top of both. */}
      {!subModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-cyan-400/30 bg-slate-800 p-6 text-center shadow-2xl">
            <h2 className="mb-2 text-xl font-bold text-white">{title}</h2>
            <p className="mb-6 text-sm text-slate-400">{description}</p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setGuestError(null);
                  setShowAuthModal(true);
                }}
                className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-3 font-semibold text-white transition-all hover:from-cyan-400 hover:to-fuchsia-400"
              >
                Sign in to my account
              </button>

              {showMagicLink && (
                <button
                  onClick={() => {
                    setGuestError(null);
                    setShowRecoveryModal(true);
                  }}
                  className="w-full rounded-lg border border-cyan-400/40 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-cyan-200 transition-colors hover:bg-slate-900"
                >
                  Recover with email link
                </button>
              )}

              <button
                onClick={handleGuest}
                disabled={guestLoading}
                className="w-full rounded-lg px-4 py-3 text-sm text-slate-400 transition-colors hover:text-slate-200 disabled:opacity-60"
              >
                {guestLoading ? 'Starting guest session…' : 'Continue as guest'}
              </button>
            </div>

            {guestError && (
              <p
                role="alert"
                className="mt-4 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-left text-xs text-rose-200"
              >
                {guestError}
              </p>
            )}
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 z-[210]">
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        </div>
      )}

      {showMagicLink && showRecoveryModal && (
        <div className="fixed inset-0 z-[210]">
          <PlayerRecoveryModal
            open
            roomCode={roomCode}
            roomId={roomId}
            onClose={() => setShowRecoveryModal(false)}
            onRecovered={handleRecovered}
          />
        </div>
      )}
    </>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase/client';
import { storeMembership } from '../../utils/membershipStorage';

interface PlayerRecoveryModalProps {
  open: boolean;
  onClose: () => void;
  /** Optional scoping: only complete recovery for this room. */
  roomCode?: string;
  roomId?: string;
  /** Called after a membership is successfully recovered for this room. */
  onRecovered?: (membership: { id: string; playerName: string }) => void;
}

type Step = 'enter-email' | 'sent' | 'done' | 'no-match';

/**
 * Magic-link powered player recovery. Sends a Supabase OTP, then -- once the
 * player has clicked the link and returned -- looks up their room_memberships
 * row at this venue and rehydrates localStorage.
 */
export function PlayerRecoveryModal({
  open,
  onClose,
  roomCode,
  roomId,
  onRecovered,
}: PlayerRecoveryModalProps) {
  const [step, setStep] = useState<Step>('enter-email');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep('enter-email');
    setEmail('');
    setErrorMsg(null);
  }, [open]);

  // Listen for a signed-in session while the modal is open. When one appears,
  // look up this user's membership for the current room and persist it.
  useEffect(() => {
    if (!open) return;

    const sub = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== 'SIGNED_IN' || !session?.user) return;

      try {
        // Prefer scoping to the known roomId for faster lookup.
        let query = supabase
          .from('room_memberships')
          .select('id, player_name, room_id, is_banned')
          .eq('user_id', session.user.id)
          .order('joined_at', { ascending: false })
          .limit(1);

        if (roomId) query = query.eq('room_id', roomId);

        const { data, error } = await query.maybeSingle();

        if (error || !data || data.is_banned) {
          setStep('no-match');
          return;
        }

        if (roomCode) {
          storeMembership(roomCode, data.id);
        }
        onRecovered?.({ id: data.id, playerName: data.player_name ?? '' });
        setStep('done');
      } catch {
        setStep('no-match');
      }
    });

    return () => {
      sub.data.subscription.unsubscribe();
    };
  }, [open, roomCode, roomId, onRecovered]);

  if (!open) return null;

  const handleSendLink = async (): Promise<void> => {
    setErrorMsg(null);
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg('Enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo:
            typeof window !== 'undefined' && roomCode
              ? `${window.location.origin}/room/${encodeURIComponent(roomCode)}`
              : typeof window !== 'undefined'
                ? `${window.location.origin}/join`
                : undefined,
        },
      });
      if (error) throw error;
      setStep('sent');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not send magic link.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-recovery-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-cyan-400/40 bg-slate-900 p-6 shadow-2xl shadow-cyan-500/20">
        <div className="flex items-start justify-between">
          <h2 id="player-recovery-title" className="text-xl font-black text-pink-400">
            Recover your progress
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {step === 'enter-email' && (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-slate-300">
              Enter the email you used before and we'll send you a magic link. No password needed.
            </p>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-cyan-400/40 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
            />
            {errorMsg && <p className="text-sm text-rose-400">{errorMsg}</p>}
            <button
              onClick={() => void handleSendLink()}
              disabled={submitting || !email.trim()}
              className="w-full rounded-full bg-pink-500 px-4 py-2 font-bold text-white hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Sending...' : 'Send magic link'}
            </button>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-slate-700" />
              <span className="text-xs uppercase tracking-widest text-slate-500">or</span>
              <div className="h-px flex-1 bg-slate-700" />
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-full border border-slate-600 px-4 py-2 font-semibold text-slate-200 hover:bg-slate-800"
            >
              Join as a new player instead
            </button>
          </div>
        )}

        {step === 'sent' && (
          <div className="mt-5 space-y-3 text-sm text-slate-200">
            <p className="font-semibold text-cyan-300">Check your inbox.</p>
            <p>
              We sent a magic link to <span className="font-semibold text-white">{email}</span>. Tap
              it on this device to finish signing back in.
            </p>
            <p className="text-xs text-slate-400">
              This window will update automatically when you complete the link.
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="mt-5 space-y-3 text-sm text-slate-200">
            <p className="font-semibold text-green-400">You're back in.</p>
            <p>Your progress at this venue has been restored on this device.</p>
            <button
              onClick={onClose}
              className="mt-2 w-full rounded-full bg-pink-500 px-4 py-2 font-bold text-white hover:bg-pink-400"
            >
              Continue
            </button>
          </div>
        )}

        {step === 'no-match' && (
          <div className="mt-5 space-y-3 text-sm text-slate-200">
            <p className="font-semibold text-amber-300">No account found for this venue.</p>
            <p>
              That email isn't linked to any membership here yet. Close this window and join fresh
              -- you can save progress at the end of the game.
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full rounded-full bg-pink-500 px-4 py-2 font-bold text-white hover:bg-pink-400"
            >
              Join as a new player
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerRecoveryModal;

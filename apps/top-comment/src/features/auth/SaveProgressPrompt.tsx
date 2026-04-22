import { useEffect, useState } from 'react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../shared/providers/AuthContext';

interface SaveProgressPromptProps {
  /** membership id to link to the authenticated user on success */
  membershipId?: string;
  className?: string;
}

/**
 * Lightweight end-of-game prompt that lets a player attach an email to their
 * room_membership. We use Supabase OTP (`signInWithOtp`) so there's no
 * password involved -- the player taps the magic link later and
 * `room_memberships.user_id` will already be wired up because the player
 * is signed in (or we attach it now if already signed in).
 */
export function SaveProgressPrompt({ membershipId, className = '' }: SaveProgressPromptProps) {
  const { user, isAnonymous } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sent' | 'linked' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If the player becomes non-anonymous (e.g. after email link), opportunistically
  // link their membership to their new user_id in the background.
  useEffect(() => {
    if (!membershipId || !user || isAnonymous) return;
    let cancelled = false;
    (async () => {
      try {
        const { error } = await supabase
          .from('room_memberships')
          .update({ user_id: user.id })
          .eq('id', membershipId)
          .is('user_id', null);
        if (!cancelled && !error) setStatus('linked');
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [membershipId, user, isAnonymous]);

  // If the user is already signed in with a real email, there's nothing to do.
  if (user && !isAnonymous) return null;

  const handleSubmit = async () => {
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
            typeof window !== 'undefined' ? window.location.href : undefined,
        },
      });
      if (error) throw error;
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Could not send link.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'sent') {
    return (
      <div className={`rounded-2xl border border-cyan-400/40 bg-slate-900/70 p-4 text-sm text-slate-200 ${className}`}>
        <p className="font-semibold text-cyan-300">Check your inbox.</p>
        <p className="mt-1">
          We sent a link to <span className="font-semibold text-white">{email}</span>. Tap it on any
          device to pick up where you left off.
        </p>
      </div>
    );
  }

  if (!expanded) {
    return (
      <div className={`flex flex-col items-center gap-2 rounded-2xl border border-cyan-400/30 bg-slate-900/60 px-4 py-3 text-center text-sm ${className}`}>
        <p className="text-slate-200">Want to keep your score across visits?</p>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="rounded-full bg-pink-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-pink-400"
        >
          Save progress →
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border border-cyan-400/40 bg-slate-900/70 p-4 text-sm ${className}`}>
      <p className="font-semibold text-cyan-300">Save progress</p>
      <p className="text-slate-300">
        Enter your email and we'll send you a magic link you can use on any device to restore your
        membership.
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
      {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => void handleSubmit()}
          disabled={submitting || !email.trim()}
          className="flex-1 rounded-full bg-pink-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-pink-400 disabled:opacity-60"
        >
          {submitting ? 'Sending...' : 'Send link'}
        </button>
        <button
          onClick={() => setExpanded(false)}
          className="rounded-full border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

export default SaveProgressPrompt;

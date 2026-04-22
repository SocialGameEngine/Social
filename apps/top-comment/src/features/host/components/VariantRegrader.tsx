import { useCallback, useMemo, useState } from 'react';
import { supabase } from '../../../supabase/client';
import type { SocialeResponse, Socialite } from '../../../domain/types/sociale.types';

interface VariantRegraderProps {
  socialeId: string;
  round: {
    id: string;
    type: string;
    settings: Record<string, any>;
  };
  responses: SocialeResponse[];
  socialites: Socialite[];
}

/**
 * P1-25 — host-only regrade panel shown during reveal on written-answer
 * trivia rounds. Lists each submitted answer alongside a checkbox to "accept
 * variant" (and optionally persist it to the global library). Clicking apply
 * invokes `sociales-regrade-variant` which rescores everyone.
 */
export function VariantRegrader({
  socialeId,
  round,
  responses,
  socialites,
}: VariantRegraderProps) {
  const snapshot = round.settings?.snapshot ?? {};
  const accepted: string[] = snapshot?.writtenAnswer?.acceptedAnswers ?? [];

  const incorrect = useMemo(
    () =>
      responses.filter((r) => {
        if (r.isCorrect) return false;
        const val =
          typeof r.value === 'string'
            ? r.value
            : typeof (r as any).content === 'string'
              ? (r as any).content
              : '';
        return Boolean(val);
      }),
    [responses]
  );

  const socialiteById = useMemo(() => {
    const map = new Map<string, Socialite>();
    socialites.forEach((s) => map.set(s.id, s));
    return map;
  }, [socialites]);

  if (round.type !== 'trivia') return null;
  if (snapshot?.format && snapshot.format !== 'written_answer') {
    /* allow absence; only bail when explicitly MC */
  }
  if (snapshot?.multipleChoice) return null;
  if (incorrect.length === 0) return null;

  return (
    <div className="rounded-xl border border-purple-600/60 bg-purple-900/20 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-black uppercase tracking-wider text-purple-200">
          Accept a variant
        </div>
        <div className="text-[11px] text-purple-200/70">
          {accepted.length} accepted spelling{accepted.length === 1 ? '' : 's'}
        </div>
      </div>
      <ul className="space-y-2">
        {incorrect.map((r) => (
          <VariantRow
            key={r.id}
            socialeId={socialeId}
            roundId={round.id}
            answer={
              typeof r.value === 'string'
                ? r.value
                : String((r as any).content ?? '')
            }
            author={socialiteById.get(r.socialiteId)?.displayName ?? 'Unknown'}
          />
        ))}
      </ul>
    </div>
  );
}

interface VariantRowProps {
  socialeId: string;
  roundId: string;
  answer: string;
  author: string;
}

function VariantRow({ socialeId, roundId, answer, author }: VariantRowProps) {
  const [persist, setPersist] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const accept = useCallback(async () => {
    setBusy(true);
    setStatus('Rescoring…');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : undefined;
      const { data, error } = await supabase.functions.invoke(
        'sociales-regrade-variant',
        {
          headers,
          body: {
            socialeId,
            roundId,
            variant: answer,
            persistToLibrary: persist,
          },
        }
      );
      if (error) throw error;
      const rescored = (data as any)?.rescored ?? 0;
      setStatus(`Accepted. ${rescored} response${rescored === 1 ? '' : 's'} updated.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }, [socialeId, roundId, answer, persist]);

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-purple-800/60 bg-purple-950/40 p-2">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-bold uppercase tracking-wider text-purple-200/80">
          {author}
        </div>
        <div className="truncate text-sm text-purple-50">{answer}</div>
        {status && <div className="mt-1 text-[11px] text-purple-200/80">{status}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <label className="flex items-center gap-1 text-[11px] text-purple-200/80">
          <input
            type="checkbox"
            checked={persist}
            onChange={(e) => setPersist(e.target.checked)}
            className="h-3 w-3"
          />
          save
        </label>
        <button
          type="button"
          onClick={() => void accept()}
          disabled={busy}
          className="rounded-md bg-purple-500 px-2 py-1 text-[11px] font-bold text-purple-50 hover:bg-purple-400 disabled:opacity-40"
        >
          Accept
        </button>
      </div>
    </li>
  );
}

export default VariantRegrader;

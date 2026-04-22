import { useCallback, useMemo, useState } from 'react';
import { supabase } from '../../../supabase/client';
import type { SocialeResponse, Socialite } from '../../../domain/types/sociale.types';

interface ModerationQueueProps {
  responses: SocialeResponse[];
  socialites: Socialite[];
  /** Optional filter: only show moderation options for open-text rounds. */
  roundType?: string;
  /** Hide the panel entirely when there's nothing to moderate. */
  hideWhenEmpty?: boolean;
}

type Action = 'approve' | 'scrub' | 'unscrub';

/**
 * P1-24 — host-only side panel listing submitted open-text answers with
 * approve / scrub / unscrub buttons. Scrubbed answers stay in the DB but are
 * filtered out of the TV + leaderboard feeds (via moderation_status filter).
 *
 * Visible on any phase where responses exist. Intentionally unopinionated
 * about where it mounts — parent chooses layout.
 */
export function ModerationQueue({
  responses,
  socialites,
  roundType,
  hideWhenEmpty,
}: ModerationQueueProps) {
  const socialiteById = useMemo(() => {
    const map = new Map<string, Socialite>();
    socialites.forEach((s) => map.set(s.id, s));
    return map;
  }, [socialites]);

  // Only open-text rounds produce user-generated content worth moderating.
  // Multiple-choice answers are inherently sanitized.
  const shouldShow =
    roundType === undefined ||
    roundType === 'topic' ||
    roundType === 'prompt' ||
    (roundType === 'trivia' && responses.some((r) => typeof r.value === 'string'));

  if (!shouldShow) return null;
  if (hideWhenEmpty && responses.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-black uppercase tracking-wider text-slate-200">
          Moderation queue
        </div>
        <div className="text-[11px] text-slate-500">
          {responses.length} response{responses.length === 1 ? '' : 's'}
        </div>
      </div>

      {responses.length === 0 ? (
        <div className="py-4 text-center text-xs text-slate-500">No responses yet.</div>
      ) : (
        <ul className="space-y-2">
          {responses.map((r) => {
            const author = socialiteById.get(r.socialiteId);
            const content =
              typeof r.value === 'string'
                ? r.value
                : typeof r.value === 'object' && r.value !== null
                  ? JSON.stringify(r.value)
                  : String((r as any).content ?? r.value ?? '');
            const status = ((r as any).moderationStatus ?? 'approved') as
              | 'pending'
              | 'approved'
              | 'scrubbed';
            return (
              <ModerationRow
                key={r.id}
                responseId={r.id}
                author={author?.displayName ?? 'Unknown'}
                content={content}
                status={status}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface ModerationRowProps {
  responseId: string;
  author: string;
  content: string;
  status: 'pending' | 'approved' | 'scrubbed';
}

function ModerationRow({ responseId, author, content, status: initialStatus }: ModerationRowProps) {
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);

  const act = useCallback(
    async (action: Action) => {
      setBusy(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined;
        await supabase.functions.invoke('sociales-moderate-response', {
          headers,
          body: { responseId, action },
        });
        setStatus(
          action === 'scrub' ? 'scrubbed' : action === 'unscrub' ? 'pending' : 'approved'
        );
      } finally {
        setBusy(false);
      }
    },
    [responseId]
  );

  return (
    <li
      className={`flex items-start justify-between gap-2 rounded-lg border p-2 ${
        status === 'scrubbed'
          ? 'border-rose-700/60 bg-rose-900/20'
          : status === 'pending'
            ? 'border-amber-700/60 bg-amber-900/10'
            : 'border-slate-700 bg-slate-900/60'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {author}
        </div>
        <div
          className={`text-sm ${
            status === 'scrubbed' ? 'italic text-rose-300 line-through' : 'text-slate-100'
          }`}
        >
          {content || <span className="text-slate-500">(empty)</span>}
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        {status !== 'approved' && (
          <button
            type="button"
            onClick={() => void act('approve')}
            disabled={busy}
            className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-bold text-emerald-50 hover:bg-emerald-500 disabled:opacity-40"
          >
            Approve
          </button>
        )}
        {status !== 'scrubbed' ? (
          <button
            type="button"
            onClick={() => void act('scrub')}
            disabled={busy}
            className="rounded-md bg-rose-700 px-2 py-1 text-[11px] font-bold text-rose-50 hover:bg-rose-600 disabled:opacity-40"
          >
            Scrub
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void act('unscrub')}
            disabled={busy}
            className="rounded-md bg-slate-700 px-2 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-600 disabled:opacity-40"
          >
            Un-scrub
          </button>
        )}
      </div>
    </li>
  );
}

export default ModerationQueue;

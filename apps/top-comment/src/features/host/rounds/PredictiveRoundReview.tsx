// Host review overlay for predictive round answers.
// Host can approve or reject each submitted prediction.

import { supabase } from '../../../supabase/client';
import type { SocialeResponse } from '../../../domain/types/sociale.types';

interface PredictiveRoundReviewProps {
  socialeId: string;
  responses: SocialeResponse[];
  isDark: boolean;
}

export function PredictiveRoundReview({ socialeId, responses, isDark }: PredictiveRoundReviewProps) {
  const pending = responses.filter((r) => !(r as any).hostApproved && !(r as any).hostRejected);
  const approved = responses.filter((r) => (r as any).hostApproved);

  const handleApprove = async (responseId: string) => {
    await supabase
      .from('sociale_responses')
      .update({ moderation_status: 'approved' })
      .eq('id', responseId);
  };

  const handleReject = async (responseId: string) => {
    await supabase
      .from('sociale_responses')
      .update({ moderation_status: 'rejected' })
      .eq('id', responseId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔮</span>
        <p className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
          Predictive Review
        </p>
        <span className={`ml-auto text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {approved.length} approved · {pending.length} pending
        </span>
      </div>

      {pending.length === 0 && (
        <p className={`text-center text-sm py-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          All predictions reviewed
        </p>
      )}

      <div className="space-y-2">
        {pending.map((r) => (
          <div
            key={r.id}
            className={`rounded-xl border p-3 flex items-start gap-3 ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {(r as any).displayName ?? r.socialiteId}
              </p>
              <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {(r as any).value?.content || (r as any).value || 'No content'}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleApprove(r.id)}
                className="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold hover:bg-green-500/30 transition-colors"
              >
                ✓ Approve
              </button>
              <button
                type="button"
                onClick={() => handleReject(r.id)}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-colors"
              >
                ✗ Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

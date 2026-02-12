import { useState } from 'react';
import type { AudienceSubmission } from '../../../../services/audienceSubmissionService';

interface SubmissionReviewPanelProps {
  submissions: AudienceSubmission[];
  pendingCount: number;
  isLoading: boolean;
  onApprove: (submissionId: string) => Promise<any>;
  onReject: (submissionId: string, reason?: string) => Promise<any>;
}

function SubmissionCard({
  submission,
  onApprove,
  onReject,
}: {
  submission: AudienceSubmission;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason?: string) => Promise<void>;
}) {
  const [isActing, setIsActing] = useState(false);
  const isPending = submission.status === 'pending';

  const handleApprove = async () => {
    setIsActing(true);
    try { await onApprove(submission.id); } finally { setIsActing(false); }
  };

  const handleReject = async () => {
    setIsActing(true);
    try { await onReject(submission.id); } finally { setIsActing(false); }
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/50 rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white">{submission.questionText}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-slate-500">
              {submission.playerName || 'Anonymous'}
            </span>
            {submission.category && (
              <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                {submission.category}
              </span>
            )}
          </div>
        </div>
        <span className="text-[10px] text-slate-600 shrink-0">
          {new Date(submission.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {isPending ? (
        <div className="flex gap-1.5">
          <button
            onClick={handleApprove}
            disabled={isActing}
            className="flex-1 px-2 py-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 rounded hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
          >
            Approve
          </button>
          <button
            onClick={handleReject}
            disabled={isActing}
            className="px-2 py-1 text-[10px] font-medium text-slate-400 bg-slate-700 rounded hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      ) : (
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
          submission.status === 'approved' ? 'text-emerald-400 bg-emerald-500/10' :
          submission.status === 'rejected' ? 'text-rose-400 bg-rose-500/10' :
          submission.status === 'used' ? 'text-amber-400 bg-amber-500/10' :
          'text-slate-400 bg-slate-700'
        }`}>
          {submission.status}
        </span>
      )}
    </div>
  );
}

export function SubmissionReviewPanel({
  submissions,
  pendingCount,
  isLoading,
  onApprove,
  onReject,
}: SubmissionReviewPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-slate-700/50 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Audience Questions {pendingCount > 0 && (
            <span className="ml-1 text-cyan-400 bg-cyan-500/15 px-1.5 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {isLoading ? (
          <p className="text-xs text-slate-500 text-center py-4">Loading submissions...</p>
        ) : submissions.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No submissions yet</p>
        ) : (
          submissions.map((sub) => (
            <SubmissionCard
              key={sub.id}
              submission={sub}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))
        )}
      </div>
    </div>
  );
}

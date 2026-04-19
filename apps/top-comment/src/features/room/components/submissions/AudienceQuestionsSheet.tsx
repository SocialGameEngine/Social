import { BottomSheet } from '../../../../shared/components/BottomSheet';
import type { AudienceSubmission } from '../../../../services/audienceSubmissionService';

interface AudienceQuestionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: AudienceSubmission[];
}

export function AudienceQuestionsSheet({ isOpen, onClose, submissions }: AudienceQuestionsSheetProps) {
  const approved = submissions.filter(s => s.status === 'approved' || s.status === 'used');

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Audience Questions">
      <div className="flex flex-col gap-3 pb-4">
        {approved.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-8">No questions yet. Submit one below!</p>
        ) : (
          approved.map(q => (
            <div key={q.id} className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 space-y-1">
              <p className="text-white text-sm font-medium">{q.questionText}</p>
              <div className="flex items-center gap-2">
                {q.category && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-medium">
                    {q.category}
                  </span>
                )}
                {q.playerName && (
                  <span className="text-xs text-slate-400">from {q.playerName}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </BottomSheet>
  );
}

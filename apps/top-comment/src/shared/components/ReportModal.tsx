import { useState } from 'react';
import type { ReportReason, ReportContentType } from '../../services/reportService';

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'cheating', label: 'Cheating' },
  { value: 'other', label: 'Other' },
];

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason, description?: string) => Promise<void>;
  onBlock?: () => void;
  targetName?: string;
  contentType: ReportContentType;
}

export function ReportModal({
  isOpen,
  onClose,
  onSubmit,
  onBlock,
  targetName,
  contentType,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason) return;
    setIsSubmitting(true);
    try {
      await onSubmit(reason, description || undefined);
      setSubmitted(true);
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason(null);
    setDescription('');
    setSubmitted(false);
    onClose();
  };

  const title = targetName
    ? `Report ${targetName}`
    : `Report ${contentType === 'chat_message' ? 'Message' : contentType === 'response' ? 'Response' : 'Player'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 bg-slate-800 border border-slate-700 rounded-xl shadow-xl">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>

        {submitted ? (
          <div className="p-6 text-center space-y-4">
            <div className="text-3xl">✅</div>
            <p className="text-sm text-slate-300">Report submitted. Thank you for helping keep the room safe.</p>
            {onBlock && (
              <button
                onClick={() => {
                  onBlock();
                  handleClose();
                }}
                className="w-full px-4 py-2 text-sm font-medium text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg hover:bg-rose-500/20 transition-colors"
              >
                Block this player
              </button>
            )}
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reason</p>
              <div className="space-y-1">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      reason === r.value
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-700/50 text-slate-300 border border-transparent hover:bg-slate-700'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Details <span className="text-slate-500">(optional)</span>
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any additional context..."
                rows={2}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                maxLength={500}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reason || isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

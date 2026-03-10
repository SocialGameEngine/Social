import { useState } from 'react';
import { useResponses } from '../../../../hooks/useResponses';
import type { Interaction } from '../../../../shared/types';

interface ResponsesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  interaction: Interaction;
  onCloseInteraction: () => void;
  onSubmitResponse: (text: string) => Promise<void>;
}

export function ResponsesDrawer({
  isOpen,
  onClose,
  interaction,
  onCloseInteraction,
  onSubmitResponse,
}: ResponsesDrawerProps) {
  const { responses, isLoading } = useResponses({ interactionId: interaction.id });
  const [draft, setDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const timeAgo = getTimeAgo(interaction.createdAt);

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer Content */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg overflow-y-auto shadow-2xl bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900">
          <h2 className="text-lg font-bold text-white">Responses</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Question Summary */}
        <div className="p-4 border-b border-slate-700/30">
          <p className="text-base font-semibold text-white">{interaction.question}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span>🎯 {timeAgo}</span>
            <span>👥 {responses.length} responses</span>
          </div>
        </div>

        {/* Responses List */}
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-5 w-5 border-2 border-cyan-400/40 border-t-cyan-400 rounded-full" />
            </div>
          ) : responses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">No responses yet</p>
              <p className="text-slate-500 text-xs mt-1">Responses will appear here in real-time</p>
            </div>
          ) : (
            responses.map((response) => (
              <div
                key={response.id}
                className="rounded-lg bg-slate-800/50 border border-slate-700/30 p-3"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-cyan-300">
                    {response.playerName || 'Anonymous'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {getTimeAgo(response.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-white leading-relaxed">{response.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 p-4 border-t border-slate-700/50 bg-slate-900">
          <div className="space-y-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type your response..."
              className="w-full min-h-[90px] rounded-xl border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
            />
            <button
              onClick={async () => {
                if (!draft.trim() || isSubmitting) return;
                setIsSubmitting(true);
                try {
                  await onSubmitResponse(draft.trim());
                  setDraft('');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="w-full text-sm font-medium py-2.5 rounded-full border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!draft.trim() || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Response'}
            </button>
            <button
              onClick={onCloseInteraction}
              className="w-full text-sm font-medium py-2.5 rounded-full border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              Close Prompt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default ResponsesDrawer;

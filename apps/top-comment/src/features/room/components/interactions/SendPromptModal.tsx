import { useState, useCallback } from 'react';
import { Button } from '../../../../components/Button';

interface SendPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (question: string, description?: string) => Promise<void>;
}

const QUICK_IDEAS = [
  "How's everyone feeling?",
  "Ready to start?",
  "What should we play next?",
];

const CHAR_LIMIT = 200;

export function SendPromptModal({ isOpen, onClose, onSend }: SendPromptModalProps) {
  const [question, setQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = useCallback(async () => {
    const trimmed = question.trim();
    if (!trimmed) return;

    setIsSending(true);
    setError(null);

    try {
      await onSend(trimmed);
      setQuestion('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send prompt');
    } finally {
      setIsSending(false);
    }
  }, [question, onSend, onClose]);

  const handleQuickIdea = useCallback((idea: string) => {
    setQuestion(idea);
  }, []);

  if (!isOpen) return null;

  const characterCount = Math.min(question.length, CHAR_LIMIT);

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!isSending ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg overflow-y-auto shadow-2xl bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900">
          <h2 className="text-lg font-bold text-white">Send Quick Prompt</h2>
          <button
            onClick={onClose}
            disabled={isSending}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 p-4 sm:p-5">
          {/* Question Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-cyan-200 mb-2">
              Question
            </label>
            <textarea
              className="w-full min-h-[100px] rounded-xl bg-slate-800 border border-slate-600 text-sm text-white placeholder:text-slate-500 p-3 focus:outline-none focus:border-cyan-400/50 transition-colors resize-none"
              placeholder="Type your prompt here..."
              value={question.slice(0, CHAR_LIMIT)}
              maxLength={CHAR_LIMIT}
              onChange={(e) => setQuestion(e.target.value.slice(0, CHAR_LIMIT))}
              disabled={isSending}
              autoFocus
            />
            <div className="flex justify-end mt-1">
              <span className={`text-xs ${characterCount >= CHAR_LIMIT ? 'text-rose-400' : 'text-slate-500'}`}>
                {characterCount}/{CHAR_LIMIT}
              </span>
            </div>
          </div>

          {/* Quick Ideas */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
              Quick ideas
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_IDEAS.map((idea) => (
                <button
                  key={idea}
                  onClick={() => handleQuickIdea(idea)}
                  disabled={isSending}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-600 text-slate-300 hover:border-cyan-400/50 hover:text-cyan-300 transition-colors"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isSending}
              className="flex-1 text-sm font-medium py-2.5 rounded-full border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <Button
              onClick={handleSend}
              disabled={!question.trim() || isSending}
              isLoading={isSending}
              className="flex-1 chaos-cta-button font-bold text-sm"
            >
              Send Prompt
            </Button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-center text-sm text-rose-400">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SendPromptModal;

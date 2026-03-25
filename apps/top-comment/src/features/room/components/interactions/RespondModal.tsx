import { useState, useCallback, useEffect } from 'react';
import { Button } from '../../../../components/Button';

interface RespondModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: string;
  onSubmit: (text: string) => Promise<void>;
  existingResponse?: string;
}

const CHAR_LIMIT = 200;

export function RespondModal({
  isOpen,
  onClose,
  question,
  onSubmit,
  existingResponse,
}: RespondModalProps) {
  const [text, setText] = useState(existingResponse || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update text when existingResponse changes (e.g., when reopening modal)
  useEffect(() => {
    setText(existingResponse || '');
  }, [existingResponse]);

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  }, [text, onSubmit, onClose]);

  if (!isOpen) return null;

  const characterCount = Math.min(text.length, CHAR_LIMIT);
  const limitReached = characterCount >= CHAR_LIMIT;

  return (
    <div className="fixed inset-0 z-[100] flex sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg overflow-y-auto shadow-2xl bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900">
          <h2 className="text-lg font-bold text-white">Quick Prompt</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-3 sm:space-y-8 sm:p-5">
          {/* Prompt Card */}
          <div className="chaos-interaction-card px-3 py-3 text-center sm:px-4 sm:py-4 shadow-xl border-2 border-black/80">
            <p className="text-xl font-black tracking-tight drop-shadow-lg sm:text-2xl text-black">
              {question}
            </p>
          </div>

          {/* Response Input */}
          <div className="chaos-answer-pill rounded-3xl px-3 py-3 sm:px-5 sm:py-4 border border-black/70">
            <textarea
              className="min-h-[90px] w-full bg-transparent text-sm leading-relaxed placeholder:text-slate-400 focus:outline-none sm:min-h-[120px] sm:text-base text-white"
              placeholder="Share your thoughts..."
              value={text.slice(0, CHAR_LIMIT)}
              maxLength={CHAR_LIMIT}
              onChange={(e) => setText(e.target.value.slice(0, CHAR_LIMIT))}
              disabled={isSubmitting}
              autoFocus
              aria-label="Your response"
            />
          </div>

          {/* Character Count */}
          <div className="flex items-center justify-end text-[11px] sm:text-xs">
            <span className={limitReached ? 'text-rose-400 font-bold text-sm sm:text-base' : 'text-brand-primary'}>
              {characterCount}/{CHAR_LIMIT}
            </span>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || isSubmitting}
            isLoading={isSubmitting}
            fullWidth
            size="sm"
            className="chaos-cta-button font-black text-xs sm:text-sm"
          >
            {isSubmitting ? 'Submitting...' : existingResponse ? 'Update Response' : 'Submit Response'}
          </Button>

          {/* Error */}
          {error && (
            <p className="text-center text-sm text-rose-400">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default RespondModal;

import { useState, useCallback } from 'react';
import { Button } from '../../../components/Button';
import { Timer } from '../../../components/Timer';
import { submitAnswer } from '../../session/sessionService';
import { useAuth } from '../../../shared/providers/AuthContext';
import { validateAnswer } from '../utils/validation';

interface AnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  roundIndex: number;
  prompt: string;
  onSubmit: () => void;
  endsAt?: string | null;
  paused?: boolean;
}

const CHAR_LIMIT = 120;

export function AnswerModal({
  isOpen,
  onClose,
  sessionId,
  roundIndex,
  prompt,
  onSubmit,
  endsAt,
  paused,
}: AnswerModalProps) {
  const { user } = useAuth();
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!user) return;

    const validation = validateAnswer(answer);
    if (!validation.valid) {
      setError(validation.error || 'Invalid answer');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitAnswer({
        sessionId,
        text: answer.trim(),
      });
      onSubmit();
      setAnswer('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  }, [answer, user, sessionId, onSubmit]);

  if (!isOpen) return null;

  const characterCount = Math.min(answer.length, CHAR_LIMIT);
  const limitReached = characterCount >= CHAR_LIMIT;

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />
      
      {/* Modal Content */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg overflow-y-auto shadow-2xl bg-slate-900">
        {/* Header with Timer */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900">
          <span className="text-cyan-400 font-black text-lg">
            {paused ? (
              'Paused'
            ) : endsAt ? (
              <Timer endTime={endsAt} size="sm" />
            ) : (
              '--'
            )}
          </span>
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
        
        {/* Content - Exactly like AnswerPhase */}
        <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
          <p className="text-center text-xs font-semibold uppercase tracking-wide sm:text-sm text-cyan-200">
            Round {roundIndex + 1}
          </p>
          
          {/* Prompt Card - chaos-prompt-card */}
          <div className="chaos-prompt-card px-3 py-3 text-center sm:px-4 sm:py-4 shadow-xl border-2 border-black/80">
            {prompt ? (
              <p className="text-2xl font-black tracking-tight drop-shadow-lg sm:text-3xl text-black">
                {prompt}
              </p>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-cyan-300">Loading...</span>
              </div>
            )}
          </div>
          
          {/* Answer Input - chaos-answer-pill */}
          <div className="chaos-answer-pill rounded-3xl px-3 py-3 sm:px-5 sm:py-4 border border-black/70">
            <textarea
              className="min-h-[90px] w-full bg-transparent text-sm leading-relaxed placeholder:text-slate-400 focus:outline-none sm:min-h-[140px] sm:text-base text-white"
              placeholder="Type your best response"
              value={answer.slice(0, CHAR_LIMIT)}
              maxLength={CHAR_LIMIT}
              onChange={(e) => setAnswer(e.target.value.slice(0, CHAR_LIMIT))}
              disabled={isSubmitting}
              aria-label="Your answer"
            />
          </div>

          {/* Character Count */}
          <div className="flex items-center justify-end text-[11px] sm:text-xs">
            <span className={limitReached ? 'text-rose-400 font-bold text-sm sm:text-base' : 'text-brand-primary'}>
              {characterCount}/{CHAR_LIMIT}
            </span>
          </div>

          {/* Submit Button - chaos-cta-button */}
          <Button
            onClick={handleSubmit}
            disabled={!answer.trim() || isSubmitting}
            isLoading={isSubmitting}
            fullWidth
            size="sm"
            className="chaos-cta-button font-black text-xs sm:text-sm"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit answer'
            )}
          </Button>

          {/* Cancel Link */}
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full text-center text-xs sm:text-sm font-medium transition-colors text-cyan-200 hover:text-cyan-300"
          >
            Cancel
          </button>

          {/* Error */}
          {error && (
            <p className="text-center text-sm text-rose-400">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnswerModal;

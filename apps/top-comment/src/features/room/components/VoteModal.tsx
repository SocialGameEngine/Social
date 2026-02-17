import { useState, useCallback } from 'react';
import { Button } from '../../../components/Button';
import { Timer } from '../../../components/Timer';
import { submitVote } from '../../session/sessionService';
import { useAuth } from '../../../shared/providers/AuthContext';
import type { Answer } from '../../../shared/types';

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  roundIndex: number;
  answers: Answer[];
    onSubmit: () => void;
  prompt?: string;
  endsAt?: string | null;
  paused?: boolean;
}

export function VoteModal({
  isOpen,
  onClose,
  sessionId,
  answers,
  onSubmit,
  prompt,
  endsAt,
  paused,
}: VoteModalProps) {
  const { user } = useAuth();
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!selectedAnswerId || !user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await submitVote({
        sessionId,
        answerId: selectedAnswerId,
      });
      onSubmit();
      setSelectedAnswerId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedAnswerId, user, sessionId, onSubmit]);

  
  if (!isOpen) return null;

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
        
        {/* Content - Like AnswerPhase */}
        <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
          {/* Vote Header */}
          <p className="text-center text-2xl font-black tracking-tight sm:text-3xl text-cyan-400 neon-glow-cyan">
            Vote!
          </p>
          
          {/* Prompt Card - chaos-prompt-card like AnswerModal */}
          <div className="chaos-prompt-card px-3 py-3 text-center sm:px-4 sm:py-4 shadow-xl border-2 border-black/80">
            {prompt ? (
              <p className="text-xl font-black tracking-tight drop-shadow-lg sm:text-2xl text-black">
                {prompt}
              </p>
            ) : (
              <p className="text-sm text-black/60">No prompt available</p>
            )}
          </div>
          
          {/* Answers List - Invisible container */}
          <div className="px-5 py-5 sm:px-8 sm:py-6">
            <div className="space-y-3 max-h-[40vh] overflow-y-auto py-2">
              {answers.length ? (
                answers.map((answer) => {
                  const isSelected = selectedAnswerId === answer.id;
                  // For now, just show the answer text without author info
                  // TODO: Map membershipId to playerName when available

                  return (
                    <button
                      key={answer.id}
                      onClick={() => !isSubmitting && setSelectedAnswerId(isSelected ? null : answer.id)}
                      disabled={isSubmitting}
                      className={`flex gap-3 w-[calc(100%-1rem)] mx-auto text-left p-3 shadow-[0_16px_0_#000] border-2 border-black/80 transition-all duration-200 rounded-[28px] text-black rotate-[2deg] ${
                        isSelected
                          ? 'bg-gradient-to-br from-cyan-400 to-purple-500 ring-2 ring-cyan-400'
                          : 'bg-gradient-to-br from-cyan-400 to-fuchsia-500 hover:scale-[1.02]'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black tracking-tight text-black leading-relaxed">{answer.text}</p>
                      </div>
                      {/* Heart vote button on right */}
                      <div className="flex-shrink-0 flex items-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isSubmitting) {
                              setSelectedAnswerId(isSelected ? null : answer.id);
                            }
                          }}
                          disabled={isSubmitting}
                          className={`text-2xl transition-all duration-200 ${
                            isSelected
                              ? 'transform scale-110 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]'
                              : 'text-black hover:text-gray-700'
                          }`}
                          aria-label={isSelected ? "Remove vote" : "Vote for this answer"}
                        >
                          {isSelected ? (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/>
                            </svg>
                          ) : (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="text-center text-slate-400 py-4">No answers yet...</p>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-center text-sm text-rose-400">{error}</p>
          )}

          {/* Submit Button - chaos-cta-button */}
          <Button
            onClick={handleSubmit}
            disabled={!selectedAnswerId || isSubmitting}
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
              'Submit Vote'
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
        </div>
      </div>
    </div>
  );
}

export default VoteModal;

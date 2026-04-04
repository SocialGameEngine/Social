import { useState, useCallback, useEffect } from 'react';
import { Button } from '../../../components/Button';
import { Timer } from '../../../components/Timer';
import { useAuth } from '../../../shared/providers/AuthContext';
import { validateAnswer } from '../utils/validation';
import { useSubmitResponse, useCurrentSocialite, useMyResponses } from '../../../features/sociale/hooks';

interface SocialeAnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  socialeId: string;
  roundId: string;
  roundIndex: number;
  roundType?: string;
  prompt: string;
  roundSettings?: any; // Add round settings for format/snapshot
  onSubmit: () => void;
  endsAt?: string | null;
  paused?: boolean;
}

const CHAR_LIMIT = 120;

// Client-side storage key for submitted answers
const getStoredAnswerKey = (socialeId: string, roundId: string, socialiteId: string) => 
  `sociale-answer-${socialeId}-${roundId}-${socialiteId}`;

// Store answer client-side to avoid DB calls
const storeAnswerClientSide = (socialeId: string, roundId: string, socialiteId: string, answer: string) => {
  const key = getStoredAnswerKey(socialeId, roundId, socialiteId);
  localStorage.setItem(key, answer);
};

// Get stored answer client-side
const getStoredAnswerClientSide = (socialeId: string, roundId: string, socialiteId: string): string | null => {
  const key = getStoredAnswerKey(socialeId, roundId, socialiteId);
  return localStorage.getItem(key);
};

// Clear stored answer for a round
const clearStoredAnswerClientSide = (socialeId: string, roundId: string, socialiteId: string) => {
  const key = getStoredAnswerKey(socialeId, roundId, socialiteId);
  localStorage.removeItem(key);
};

export function SocialeAnswerModal({
  isOpen,
  onClose,
  socialeId,
  roundId,
  roundIndex,
  roundType,
  prompt,
  roundSettings,
  onSubmit,
  endsAt,
  paused,
}: SocialeAnswerModalProps) {
  const { user } = useAuth();
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Determine if this is a multiple choice question
  const isMultipleChoice = roundSettings?.format === 'multiple_choice';
  const snapshot = roundSettings?.snapshot;
  const mcOptions = isMultipleChoice && snapshot?.multipleChoice ? snapshot.multipleChoice.options : [];
  
  // Use Sociale response submission hook
  const submitResponseMutation = useSubmitResponse();
  
  // Get current user's socialite
  const { data: currentSocialite } = useCurrentSocialite(socialeId, user?.id);
  
  // Get user's existing responses (fallback if client storage is empty)
  const { data: myResponses = [] } = useMyResponses(socialeId, currentSocialite?.id);
  
  // Check if user has already submitted an answer for this round
  const hasExistingResponse = myResponses.some(r => r.roundId === roundId);
  
  // Debug logging
  console.log('🔥 SocialeAnswerModal roundSettings:', roundSettings);
  console.log('🔥 isMultipleChoice:', isMultipleChoice);
  console.log('🔥 snapshot:', snapshot);
  console.log('🔥 mcOptions length:', mcOptions.length);
  console.log('🔥 hasExistingResponse:', hasExistingResponse);
  
  // Populate answer from client-side storage or existing response when modal opens
  useEffect(() => {
    if (!isOpen || !currentSocialite) return;
    
    // First try client-side storage (fastest)
    const storedAnswer = getStoredAnswerClientSide(socialeId, roundId, currentSocialite.id);
    if (storedAnswer) {
      if (isMultipleChoice) {
        setSelectedOption(storedAnswer);
      } else {
        setAnswer(storedAnswer);
      }
      return;
    }
    
    // Fallback to existing response from database
    const existingResponse = myResponses.find(r => r.roundId === roundId);
    if (existingResponse) {
      const answerValue = typeof existingResponse.value === 'string' 
        ? existingResponse.value 
        : String(existingResponse.value);
      
      if (isMultipleChoice) {
        setSelectedOption(answerValue);
      } else {
        setAnswer(answerValue);
      }
      
      // Store it client-side for future use
      storeAnswerClientSide(socialeId, roundId, currentSocialite.id, answerValue);
    } else {
      setAnswer('');
      setSelectedOption(null);
    }
  }, [isOpen, socialeId, roundId, currentSocialite, myResponses, isMultipleChoice]);

  const handleSubmit = useCallback(async () => {
    if (!user || !currentSocialite) return;

    // Validate based on question type
    if (isMultipleChoice) {
      if (!selectedOption) {
        setError('Please select an option');
        return;
      }
    } else {
      const validation = validateAnswer(answer, roundType);
      if (!validation.valid) {
        setError(validation.error || 'Invalid answer');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitResponseMutation.mutateAsync({
        socialeId,
        roundId,
        socialiteId: currentSocialite.id,
        type: isMultipleChoice ? 'multiple_choice' : 'text',
        value: isMultipleChoice ? selectedOption : answer.trim(),
      });
      
      // Store answer client-side for instant retrieval
      const answerValue = isMultipleChoice ? (selectedOption || '') : answer.trim();
      storeAnswerClientSide(socialeId, roundId, currentSocialite.id, answerValue);
      
      onSubmit();
      setAnswer('');
      setSelectedOption(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  }, [answer, selectedOption, user, currentSocialite, socialeId, roundId, onSubmit, submitResponseMutation, isMultipleChoice, roundType]);

  // Clear client-side storage when round changes (cleanup)
  useEffect(() => {
    if (!currentSocialite) return;
    
    // Clear old round answers when we detect a new round
    const clearOldRoundAnswers = () => {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(`sociale-answer-${socialeId}-`) && key.includes(currentSocialite.id)) {
          const [_, ...parts] = key.split('-');
          const storedRoundId = parts[2];
          if (storedRoundId !== roundId) {
            clearStoredAnswerClientSide(socialeId, storedRoundId, currentSocialite.id);
          }
        }
      });
    };
    
    clearOldRoundAnswers();
  }, [socialeId, roundId, currentSocialite]);

  if (!isOpen) return null;

  const characterCount = !isMultipleChoice ? Math.min(answer.length, CHAR_LIMIT) : 0;
  const limitReached = !isMultipleChoice && characterCount >= CHAR_LIMIT;

  return (
    <div className="fixed inset-0 z-[100] flex sm:items-center sm:justify-center sm:p-4">
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
          
          {/* Answer Input - MC or Text */}
          {isMultipleChoice && mcOptions && mcOptions.length > 0 ? (
            // Multiple Choice Options
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mcOptions.map((option: any) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedOption(option.id)}
                    disabled={isSubmitting}
                    className={`p-4 rounded-xl border-2 transition-all font-medium text-sm sm:text-base ${
                      selectedOption === option.id
                        ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400 shadow-lg shadow-cyan-400/25'
                        : 'border-slate-600 bg-slate-800/50 text-white hover:border-cyan-400/50 hover:bg-slate-800'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Written Answer Text Input
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
          )}

          {/* Character Count - Only show for written answers */}
          {!isMultipleChoice && (
            <div className="flex items-center justify-end text-[11px] sm:text-xs">
              <span className={limitReached ? 'text-rose-400 font-bold text-sm sm:text-base' : 'text-brand-primary'}>
                {characterCount}/{CHAR_LIMIT}
              </span>
            </div>
          )}

          {/* Submit Button - chaos-cta-button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!isMultipleChoice && !answer.trim()) || (isMultipleChoice && !selectedOption)}
            isLoading={isSubmitting}
            fullWidth
            size="sm"
            className="chaos-cta-button font-black text-xs sm:text-sm"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              hasExistingResponse ? 'Update answer' : (
                isMultipleChoice ? 'Select an option' : 'Submit answer'
              )
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

export default SocialeAnswerModal;

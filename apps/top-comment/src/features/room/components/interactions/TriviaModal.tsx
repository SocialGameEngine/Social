import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../supabase/client';
import { interactionService } from '../../../../services/interactionService';
import { Button } from '../../../../components/Button';
import { FullscreenModal } from '../../../../shared/components/FullscreenModal';
import { logger } from '../../../../shared/utils/logger';
import type { Interaction } from '../../../../domain/types/interaction.types';
import type { TriviaSubmission, TriviaReveal, TriviaInteractionSettings } from '../../../../domain/types/interaction.types';

interface TriviaModalProps {
  interaction: Interaction;
  isOpen: boolean;
  onClose: () => void;
  membershipId: string | null;
  onJoinRoom?: () => void;
}

export function TriviaModal({ interaction, isOpen, onClose, membershipId, onJoinRoom }: TriviaModalProps) {
  const [submission, setSubmission] = useState<TriviaSubmission | null>(null);
  const [reveal, setReveal] = useState<TriviaReveal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [shuffledOptions, setShuffledOptions] = useState<any[]>([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false); // Transient UI state
  const [gradingResult, setGradingResult] = useState<any>(null);

  const loadSubmission = useCallback(async () => {
    if (!membershipId) return;
    
    try {
      const data = await interactionService.getTriviaSubmission(interaction.id, membershipId);
      setSubmission(data);
      
      // Pre-fill form if user has already submitted
      if (data) {
        if (data.payload.format === 'multiple_choice') {
          setSelectedOption((data.payload as any).selectedOptionId);
        } else {
          setWrittenAnswer((data.payload as any).rawText);
        }
      }
    } catch (error) {
      logger.error('Failed to load trivia submission', { error });
    }
  }, [interaction.id, membershipId]);

  
  // Load grading result from session storage when modal opens
  useEffect(() => {
    if (isOpen && interaction.id) {
      const saved = sessionStorage.getItem(`trivia_result_${interaction.id}`);
      if (saved) {
        try {
          setGradingResult(JSON.parse(saved));
        } catch (e) {
          logger.error('Failed to parse saved grading result', { error: e });
        }
      }
    }
  }, [isOpen, interaction.id]);

  // Save grading result to session storage when it changes
  useEffect(() => {
    if (gradingResult && interaction.id) {
      sessionStorage.setItem(`trivia_result_${interaction.id}`, JSON.stringify(gradingResult));
    }
  }, [gradingResult, interaction.id]);

  const settings = interaction.settings as unknown as TriviaInteractionSettings;
  const snapshot = settings.snapshot;
  const isMultipleChoice = snapshot.multipleChoice !== undefined;
  const isWrittenAnswer = snapshot.writtenAnswer !== undefined;
  const isResultsPhase = interaction.status === 'results';
  const isClosed = interaction.status === 'closed';

  const loadReveal = useCallback(async () => {
    if (!isResultsPhase || !membershipId) return;
    
    try {
      const data = await interactionService.getTriviaReveal(interaction.id, membershipId);
      setReveal(data);
    } catch (error) {
      logger.error('Failed to load trivia reveal', { error });
    }
  }, [interaction.id, membershipId, isResultsPhase]);

  // Helper functions for safe payload access
  const getUserAnswer = (): string => {
    if (!submission) return '';
    
    if (submission.payload.format === 'multiple_choice') {
      const payload = submission.payload as { format: 'multiple_choice'; selectedOptionId: string };
      const option = snapshot.multipleChoice?.options?.find((opt: any) => opt.id === payload.selectedOptionId);
      return option?.text || payload.selectedOptionId;
    } else if (submission.payload.format === 'written_answer') {
      const payload = submission.payload as { format: 'written_answer'; rawText: string };
      return payload.rawText;
    }
    return '';
  };

  useEffect(() => {
    if (isOpen) {
      setIsLoading(false);
      
      // Shuffle options once when modal opens
      if (isMultipleChoice && snapshot.multipleChoice?.options) {
        const options = [...snapshot.multipleChoice.options];
        if (snapshot.multipleChoice.shuffleOptions) {
          // Fisher-Yates shuffle
          for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
          }
        }
        setShuffledOptions(options);
      }
    }
  }, [isOpen, isMultipleChoice, snapshot]);

  useEffect(() => {
    if (isOpen && membershipId) {
      loadSubmission();
    }
  }, [isOpen, membershipId, loadSubmission]);

  useEffect(() => {
    loadReveal();
  }, [loadReveal]);

  useEffect(() => {
    if (!isOpen || !interaction.id) return;

    // Initial count
    setAnsweredCount(interaction.responseCount || 0);

    // Listen for new submissions
    const channel = supabase
      .channel(`trivia_submissions_${interaction.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trivia_submissions',
          filter: `interaction_id = eq.${interaction.id}`
        },
        (payload) => {
          logger.debug('New trivia submission', { payload });
          setAnsweredCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [isOpen, interaction.id, interaction.responseCount]);

  // Removed deprecated polling for reveal updates
  // Immediate feedback is now provided on submission via gradingResult

  const handleSubmitAnswer = async () => {
    if (!membershipId) return;

    // Validate input
    if (isMultipleChoice && !selectedOption) {
      alert('Please select an answer');
      return;
    }
    if (isWrittenAnswer && !writtenAnswer.trim()) {
      alert('Please enter an answer');
      return;
    }
    if (isWrittenAnswer && writtenAnswer.length > (snapshot.writtenAnswer?.maxLength || 200)) {
      alert(`Answer must be ${snapshot.writtenAnswer?.maxLength || 200} characters or less`);
      return;
    }

    // Set transient submitting state
    setIsSubmitting(true);
    try {
      const payload = isMultipleChoice
        ? { format: 'multiple_choice' as const, selectedOptionId: selectedOption }
        : { format: 'written_answer' as const, rawText: writtenAnswer.trim() };

      // Submit and get immediate grading result
      const gradingResult = await interactionService.submitTriviaAnswer(interaction.id, membershipId, payload);
      
      logger.debug('Trivia grading result', {
        gradingResult,
        correctAnswer: gradingResult?.correctAnswer,
        keys: Object.keys(gradingResult || {}),
      });
      
      // Store the immediate grading result
      setGradingResult(gradingResult);
      
      // Load the raw submission data
      await loadSubmission();
      
      logger.debug('Trivia submitted successfully with immediate result', { gradingResult });
    } catch (error: any) {
      logger.error('Failed to submit trivia answer', { error });
      alert(error.message || 'Failed to submit answer');
    } finally {
      // Clear transient submitting state
      setIsSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'hard': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getTimeRemaining = () => {
    if (!interaction.answerEndsAt) return null;
    
    const now = new Date().getTime();
    const end = new Date(interaction.answerEndsAt).getTime();
    const remaining = Math.max(0, Math.floor((end - now) / 1000));
    
    if (remaining === 0) return 'Time\'s up!';
    
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <FullscreenModal
      isOpen={isOpen}
      onClose={onClose}
      title="Trivia"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-3xl">🧠</span>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">
            {snapshot.prompt}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span className={getDifficultyColor(snapshot.difficulty)}>
              {snapshot.difficulty?.toUpperCase()}
            </span>
            <span>{snapshot.categoryKey}</span>
            {interaction.answerEndsAt && !isResultsPhase && (
              <span className="font-mono">
                ⏱️ {getTimeRemaining()}
              </span>
            )}
            {isResultsPhase && reveal && (
              <span>{reveal.statistics.totalResponses} response{reveal.statistics.totalResponses !== 1 ? 's' : ''}</span>
            )}
            {isClosed && <span className="font-bold text-red-500">CLOSED</span>}
          </div>
          {snapshot.hint && !isResultsPhase && (
            <p className="text-sm mt-2 text-slate-400 italic">
              💡 Hint: {snapshot.hint}
            </p>
          )}
        </div>
      </div>

      {/* Question Content */}
      {isLoading ? (
        <div className="text-center py-8 text-sm text-slate-400">
          Loading trivia...
        </div>
      ) : gradingResult || (isResultsPhase && reveal) ? (
        /* Results View - immediate grading result or official results */
        <div className="space-y-4">
          {/* Show immediate grading result */}
          {gradingResult && (
            <div className={`border rounded-lg p-4 ${
              gradingResult.isCorrect
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="text-sm text-slate-400 mb-1">Your Answer:</div>
              <div className="text-lg font-bold">
                {getUserAnswer()}
              </div>
              <div className="mt-2 flex items-center gap-2">
                {gradingResult.isCorrect ? '✅ Correct!' : '❌ Incorrect'}
              </div>
              
              {/* Points awarded */}
              {gradingResult.pointsAwarded > 0 && (
                <div className="mt-2 text-sm text-cyan-400">
                  +{gradingResult.pointsAwarded} points earned!
                </div>
              )}
              
              {/* Late submission notice */}
              {gradingResult.isLate && (
                <div className="mt-2 text-sm text-yellow-400">
                  ⚠️ Submitted after deadline (no points awarded)
                </div>
              )}
            </div>
          )}

          {/* Show correct answer and explanation */}
          {(gradingResult || (isResultsPhase && reveal)) && (
            <>
              {/* Correct Answer */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Correct Answer:</div>
                <div className="text-lg font-bold text-green-500">
                  {isMultipleChoice 
                    ? (() => {
                        const correctOptionId = gradingResult?.correctAnswer || reveal?.correctAnswer;
                        const option = snapshot.multipleChoice?.options?.find(opt => opt.id === correctOptionId);
                        logger.debug('Resolved trivia correct option', { correctOptionId, option });
                        return option?.text || `Option ${correctOptionId} (text not found)`;
                      })()
                    : (gradingResult?.correctAnswer || reveal?.correctAnswer || 'Answer not available')
                  }
                </div>
              </div>

              {/* Explanation */}
              {(gradingResult?.explanation || reveal?.explanation) && (
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">Explanation:</div>
                  <div className="text-white">{gradingResult?.explanation || reveal?.explanation}</div>
                </div>
              )}
            </>
          )}

          {/* Show official results when in results phase */}
          {isResultsPhase && reveal && (
            <>
              {/* Statistics */}
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">Statistics:</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Correct Rate:</span>
                    <span className="ml-2 font-bold text-green-500">
                      {reveal.statistics.totalResponses > 0 
                        ? Math.round((reveal.statistics.correctResponses / reveal.statistics.totalResponses) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Avg Time:</span>
                    <span className="ml-2 font-bold">
                      {Math.round(reveal.statistics.averageResponseTime / 1000)}s
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Answer Input View */
        <div className="space-y-4">
          {/* Answered Count */}
          <div className="text-center text-sm text-slate-400">
            {answeredCount} {answeredCount === 1 ? 'person has answered' : 'people have answered'}
          </div>

          {isMultipleChoice && snapshot.multipleChoice && (
            <div className="space-y-2">
              {(shuffledOptions.length > 0 ? shuffledOptions : snapshot.multipleChoice.options).map((option) => (
                <button
                  key={option.id}
                  onClick={() => !isClosed && setSelectedOption(option.id)}
                  disabled={isClosed || isSubmitting}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedOption === option.id
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                  } ${isClosed ? 'cursor-default' : 'cursor-pointer'} ${
                    isSubmitting ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedOption === option.id
                        ? 'border-cyan-500 bg-cyan-500'
                        : 'border-slate-500'
                    }`}>
                      {selectedOption === option.id && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-white font-medium">
                      {option.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {isWrittenAnswer && (
            <div>
              <textarea
                value={writtenAnswer}
                onChange={(e) => setWrittenAnswer(e.target.value)}
                disabled={isClosed || isSubmitting}
                placeholder="Type your answer here..."
                maxLength={snapshot.writtenAnswer?.maxLength || 200}
                className="w-full p-4 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none resize-none"
                rows={3}
              />
              <div className="text-right text-xs text-slate-400 mt-1">
                {writtenAnswer.length}/{snapshot.writtenAnswer?.maxLength || 200}
              </div>
            </div>
          )}

          {/* Submit Button */}
          {!gradingResult && !isClosed && (
            <Button
              onClick={handleSubmitAnswer}
              disabled={isSubmitting || (!selectedOption && !writtenAnswer.trim())}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Answer'
              )}
            </Button>
          )}

        </div>
      )}

      {/* Join Room Prompt */}
      {!membershipId && (
        <div className="text-center py-4">
          <p className="mb-2 text-slate-400">👋 Join this room to answer the trivia!</p>
          <Button onClick={onJoinRoom} size="sm">
            Join Room
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-slate-700/50 pt-4">
        <Button
          variant="secondary"
          onClick={onClose}
          className="w-full"
        >
          Close
        </Button>
      </div>
    </FullscreenModal>
  );
}

export default TriviaModal;

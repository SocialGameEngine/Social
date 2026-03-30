import { useState, useEffect } from 'react';
import { Button } from '@social/ui';
import { HostModal } from './HostModal';
import { triviaService } from '../../../services/triviaService';
import type { QuestionPack, TriviaQuestion } from '../../../services/triviaService';

interface HostCreateTriviaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (questionId: string, answerSeconds?: number, scoring?: any, policy?: any) => Promise<void>;
}

export default function HostCreateTriviaModal({ isOpen, onClose, onSubmit }: HostCreateTriviaModalProps) {
  const [questionPacks, setQuestionPacks] = useState<QuestionPack[]>([]);
  const [selectedPack, setSelectedPack] = useState<string>('');
  const [availableQuestions, setAvailableQuestions] = useState<TriviaQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [answerSeconds, setAnswerSeconds] = useState(43200); // 12 hours in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoadingPacks, setIsLoadingPacks] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Load question packs when modal opens
  useEffect(() => {
    if (isOpen) {
      loadQuestionPacks();
    }
  }, [isOpen]);

  // Load questions when pack is selected
  useEffect(() => {
    if (selectedPack) {
      loadQuestions(selectedPack);
    }
  }, [selectedPack]);

  const loadQuestionPacks = async () => {
    setIsLoadingPacks(true);
    try {
      const packs = await triviaService.getQuestionPacks({ status: 'published' });
      setQuestionPacks(packs);
      if (packs.length > 0) {
        setSelectedPack(packs[0].id);
      }
    } catch (error) {
      console.error('Failed to load question packs:', error);
      setError('Failed to load question packs');
    } finally {
      setIsLoadingPacks(false);
    }
  };

  const loadQuestions = async (packId: string) => {
    setIsLoadingQuestions(true);
    try {
      const questions = await triviaService.getQuestions({ 
        packId, 
        status: 'published' 
      });
      setAvailableQuestions(questions);
      if (questions.length > 0) {
        setSelectedQuestion(questions[0].id);
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
      setError('Failed to load questions');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedQuestion) {
      setError('Please select a question');
      return;
    }

    if (answerSeconds < 3600 || answerSeconds > 86400) {
      setError('Answer time must be between 1 and 24 hours');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const scoring = {
        pointsCorrect: 100,
        pointsPartial: 50,
        speedBonusEnabled: false,
        maxSpeedBonus: 0,
      };

      const policy = {
        allowAnswerChangeUntilClose: false,
        lateSubmissions: 'reject' as const,
        showCorrectAnswerAtReveal: true,
        showExplanationAtReveal: true,
      };

      await onSubmit(selectedQuestion, answerSeconds, scoring, policy);
      onClose();
    } catch (error) {
      console.error('Failed to create trivia:', error);
      setError('Failed to create trivia');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedPack('');
      setSelectedQuestion('');
      setAnswerSeconds(43200); // 12 hours
      setError('');
      setAvailableQuestions([]);
      onClose();
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

  const getDifficultyLabel = (difficulty: string) => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  return (
    <HostModal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Create Trivia"
      maxWidth="2xl"
      disabled={isSubmitting}
    >
      <div className="space-y-6">
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/50">
            <p className="text-sm text-red-500 font-semibold">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h2 className="text-2xl font-bold text-white">
            Create Trivia
          </h2>
        </div>

        <p className="text-sm text-slate-400">
          Select a question from your question packs to create a trivia interaction.
        </p>

        {/* Question Pack Selection */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-cyan-200">
            Question Pack
          </label>
          {isLoadingPacks ? (
            <div className="p-4 text-center text-slate-400">
              Loading question packs...
            </div>
          ) : questionPacks.length === 0 ? (
            <div className="p-4 text-center text-slate-400">
              No published question packs available. Create some questions first!
            </div>
          ) : (
            <select
              value={selectedPack}
              onChange={(e) => setSelectedPack(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              disabled={isSubmitting}
            >
              {questionPacks.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.name} {pack.description && `- ${pack.description}`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Question Selection */}
        {selectedPack && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-cyan-200">
              Select Question
            </label>
            {isLoadingQuestions ? (
              <div className="p-4 text-center text-slate-400">
                Loading questions...
              </div>
            ) : availableQuestions.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                No published questions in this pack.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {availableQuestions.map((question) => (
                  <div
                    key={question.id}
                    onClick={() => setSelectedQuestion(question.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedQuestion === question.id
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-white font-medium line-clamp-2">
                          {question.prompt}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="text-slate-400">{question.categoryKey}</span>
                          <span className={getDifficultyColor(question.difficulty)}>
                            {getDifficultyLabel(question.difficulty)}
                          </span>
                          <span className="text-slate-400">
                            {question.format === 'multiple_choice' ? 'Multiple Choice' : 'Written Answer'}
                          </span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedQuestion === question.id
                          ? 'border-cyan-500 bg-cyan-500'
                          : 'border-slate-500'
                      }`}>
                        {selectedQuestion === question.id && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        {selectedQuestion && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-cyan-200">
                Answer Time (hours)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={Math.round(answerSeconds / 3600)}
                onChange={(e) => setAnswerSeconds((parseInt(e.target.value) || 12) * 3600)}
                className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                disabled={isSubmitting}
              />
              <p className="text-xs text-slate-400">
                Players will have {Math.round(answerSeconds / 3600)} hours to answer.
              </p>
            </div>
          </div>
        )}

        {/* Preview */}
        {selectedQuestion && availableQuestions.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-cyan-200">
              Preview
            </label>
            <div className="p-4 bg-slate-800 border border-slate-600 rounded-lg">
              {(() => {
                const question = availableQuestions.find(q => q.id === selectedQuestion);
                if (!question) return null;
                
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <div>
                        <p className="text-white font-semibold">{question.prompt}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span>{question.categoryKey}</span>
                          <span className={getDifficultyColor(question.difficulty)}>
                            {getDifficultyLabel(question.difficulty)}
                          </span>
                          <span>{Math.round(answerSeconds / 3600)}h</span>
                        </div>
                      </div>
                    </div>
                    
                    {question.format === 'multiple_choice' && question.options && (
                      <div className="space-y-2">
                        {question.options
                          .sort(() => Math.random() - 0.5) // Shuffle for preview
                          .map((option) => (
                          <div key={option.id} className="p-2 bg-slate-700 rounded border border-slate-600">
                            <span className="text-sm text-slate-300">
                              {option.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {question.format === 'written_answer' && (
                      <div className="p-3 bg-slate-700 rounded border border-slate-600">
                        <input
                          type="text"
                          placeholder="Type your answer here..."
                          className="w-full bg-transparent text-white placeholder-slate-400 outline-none"
                          disabled
                        />
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-700">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedQuestion || isLoadingPacks || isLoadingQuestions}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create Trivia'
            )}
          </Button>
        </div>
      </div>
    </HostModal>
  );
}

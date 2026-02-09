import { useState, useEffect } from 'react';
import type { Interaction } from '../../../../shared/types';

interface InteractionCardProps {
  interaction: Interaction;
  isHost: boolean;
  hasResponded: boolean;
  hasVoted: boolean;
  memberCount: number;
  onRespond?: () => void;
  onVote?: () => void;
  onViewResponses?: () => void;
  onViewResults?: () => void;
  onClose?: (interactionId: string) => void;
  onAutoAdvanceToResults?: (interactionId: string) => void;
}

export function InteractionCard({
  interaction,
  isHost,
  hasResponded,
  hasVoted,
  memberCount,
  onRespond,
  onVote,
  onViewResponses,
  onViewResults,
  onClose,
  onAutoAdvanceToResults,
}: InteractionCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Timer countdown for active and voting phases
  useEffect(() => {
    const endTime = interaction.status === 'active' ? interaction.answerEndsAt : interaction.votingEndsAt;
    if (!endTime) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const end = new Date(endTime!).getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      setTimeRemaining(remaining);
      
      // Auto-advance when timer ends
      if (remaining === 0) {
        if (interaction.status === 'active' && onAutoAdvanceToResults) {
          onAutoAdvanceToResults(interaction.id);
        }
      }
      
      return remaining > 0;
    };

    const hasTime = calculateTimeRemaining();
    
    // Auto-advance if time has already ended
    if (!hasTime) {
      if (interaction.status === 'active' && onAutoAdvanceToResults) {
        onAutoAdvanceToResults(interaction.id);
      }
      return;
    }

    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [interaction.status, interaction.answerEndsAt, interaction.votingEndsAt, onAutoAdvanceToResults]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Determine if the card is clickable and what action to take
  const handleClick = () => {
    if (interaction.status === 'results') {
      // Everyone can view results
      if (onViewResults) onViewResults();
    } else if (isHost) {
      if (interaction.status === 'closed' && onViewResults) {
        onViewResults();
      } else if (onViewResponses) {
        onViewResponses();
      }
    } else if (interaction.status === 'voting') {
      // Allow users to vote or change their vote during voting phase
      if (onVote) onVote();
    } else if (interaction.status === 'active') {
      // Allow users to respond or change their response during active phase
      if (onRespond) onRespond();
    }
  };

  // Card is only disabled when there's truly nothing to do
  const isDisabled = false; // Users can always interact to change answers/votes

  const getStatusText = () => {
    if (interaction.status === 'active') {
      return timeRemaining > 0 ? `Answer • ${formatTime(timeRemaining)}` : 'Answer time ended';
    }
    if (interaction.status === 'voting') {
      return timeRemaining > 0 ? `Voting • ${formatTime(timeRemaining)}` : 'Voting ended';
    }
    if (interaction.status === 'results') {
      return 'Results';
    }
    if (interaction.status === 'closed') {
      return 'Closed';
    }
    return 'Active';
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className="w-full chaos-interaction-card px-3 py-6 sm:py-8 shadow-xl border-2 border-black/80 transform transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 min-h-[100px] sm:min-h-[120px] text-left"
    >
      {/* 3-Column Layout — matches PhaseCardButton */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Label + Counts */}
        <div className="flex-shrink-0 w-16 sm:w-20">
          <span className="text-sm sm:text-base font-black uppercase tracking-wider text-black/70">
            Prompt
          </span>
          <div className="mt-1">
            <span className="text-cyan-700 font-black text-sm sm:text-base">
              {interaction.responseCount}/{memberCount}
            </span>
          </div>
          {interaction.status === 'voting' && (
            <div className="mt-1">
              <span className="text-purple-700 font-black text-sm sm:text-base">
                {interaction.voteCount} votes
              </span>
            </div>
          )}
          {(hasResponded || hasVoted) && (
            <span className="block text-xs text-green-700 font-bold mt-1">
              {hasVoted ? '✓ Voted' : '✓ Done'}
            </span>
          )}
        </div>

        {/* Middle: Question + Status */}
        <div className="flex-1 min-w-0 text-center px-2">
          <p className="text-xl sm:text-2xl font-black tracking-tight text-black leading-tight">
            {interaction.question}
          </p>
          {interaction.description && (
            <p className="text-xs text-black/50 mt-1">{interaction.description}</p>
          )}
          <div className="mt-2">
            <span className={`text-xs font-bold ${
              interaction.status === 'active'
                ? 'text-cyan-600'
                : interaction.status === 'voting'
                ? 'text-cyan-600'
                : interaction.status === 'results'
                ? 'text-yellow-600'
                : interaction.status === 'closed'
                ? 'text-gray-600'
                : 'text-black/60'
            }`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* Right: Chevron */}
        <div className="flex-shrink-0 w-12 sm:w-16 text-right flex flex-col items-end justify-center">
          <svg className="w-8 h-8 text-black/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Host: Close button */}
      {isHost && (
        <div className="mt-3 text-center">
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onClose?.(interaction.id); }}
            className="text-xs font-bold uppercase tracking-wider text-black/40 hover:text-red-700 transition-colors"
          >
            Close Prompt
          </span>
        </div>
      )}
    </button>
  );
}

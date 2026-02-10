import { useState, useEffect } from 'react';
import type { Interaction } from '../../../../shared/types';

interface InteractionCardProps {
  interaction: Interaction;
  isHost: boolean;
  hasResponded: boolean;
  hasVoted: boolean;
  onRespond?: () => void;
  onVote?: () => void;
  onViewResponses?: () => void;
  onViewResults?: () => void;
  onAutoAdvanceToResults?: (interactionId: string) => void;
}

export function InteractionCard({
  interaction,
  isHost,
  hasResponded,
  hasVoted,
  onRespond,
  onVote,
  onViewResponses,
  onViewResults,
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

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className="w-full chaos-interaction-card pl-4 pr-2 py-3 sm:py-4 shadow-xl border-2 border-black/80 transform transition-all hover:scale-[1.04] active:scale-[0.96] disabled:hover:scale-100 min-h-[80px] sm:min-h-[100px] text-left"
      style={{ transform: 'rotate(2deg) scale(0.9)' }}
    >
      {/* 3-Column Layout — matches PhaseCardButton */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Action Type + Timer */}
        <div className="flex-shrink-0 w-16 sm:w-20">
          <span className="text-sm sm:text-base font-black uppercase tracking-wider text-black/70">
            {interaction.status === 'active' ? 'Answer' : 
             interaction.status === 'voting' ? 'Vote' : 
             interaction.status === 'results' ? 'Results' : 'Prompt'}
          </span>
          <div className="mt-1 text-center">
            <span className="text-cyan-700 font-black text-base sm:text-lg">
              {timeRemaining > 0 ? formatTime(timeRemaining) : '--'}
            </span>
          </div>
          {(hasResponded || hasVoted) && (
            <span className="block text-xs text-green-700 font-bold mt-1">✓ Done</span>
          )}
        </div>

        {/* Middle: Question */}
        <div className="flex-1 min-w-0 text-center px-2">
          <p className="text-xl sm:text-2xl font-black tracking-tight text-black leading-tight">
            {interaction.question}
          </p>
        </div>

        {/* Right: Clickable indicator */}
        <div className="flex-shrink-0 w-12 sm:w-16 text-right flex flex-col items-end justify-center">
          <svg className="w-8 h-8 text-black/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
          {(hasResponded || hasVoted) && (
            <span className="text-xs text-green-700 font-bold mt-1">Tap to change</span>
          )}
        </div>
      </div>
    </button>
  );
}

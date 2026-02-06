import { Timer } from '../../../components/Timer';
import { getPhaseConfig, isActionPhase } from '../utils/phaseConfig';
import type { GamePhase } from '../types';

interface PhaseCardButtonProps {
  phase: GamePhase;
  hasSubmitted: boolean;
  onClick: () => void;
  disabled?: boolean;
  endsAt?: string;
  paused?: boolean;
  prompt?: string;
}

export function PhaseCardButton({
  phase,
  hasSubmitted,
  onClick,
  disabled = false,
  endsAt,
  paused,
  prompt,
}: PhaseCardButtonProps) {
  const config = getPhaseConfig(phase);
  const isAction = isActionPhase(phase);

  const handleClick = () => {
    if (!disabled && (isAction || phase === 'results' || phase === 'ended')) {
      onClick();
    }
  };

  // Get action label for left side
  const actionLabel = phase === 'answer' ? 'Answer' : phase === 'vote' ? 'Vote' : phase === 'results' ? 'Results' : phase === 'lobby' ? 'Lobby' : phase === 'ended' ? 'Results' : 'Game';

  return (
    <button
      onClick={handleClick}
      disabled={disabled || (!isAction && phase !== 'results' && phase !== 'ended')}
      className="w-full chaos-prompt-card px-3 py-6 sm:py-8 shadow-xl border-2 border-black/80 transform transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[100px] sm:min-h-[120px]"
      aria-label={hasSubmitted ? config.submittedText : config.buttonText}
    >
      {/* 3-Column Layout */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Action Type + Timer */}
        <div className="flex-shrink-0 w-16 sm:w-20">
          <span className="text-sm sm:text-base font-black uppercase tracking-wider text-black/70">
            {actionLabel}
          </span>
          <div className="mt-1">
            {(endsAt || paused) ? (
              <span className="text-cyan-700 font-black text-base sm:text-lg">
                {paused ? 'Paused' : <Timer endTime={endsAt} size="sm" variant="light" />}
              </span>
            ) : (
              <span className="text-black/40 font-black text-base">--</span>
            )}
          </div>
          {hasSubmitted && (
            <span className="block text-xs text-green-700 font-bold mt-1">✓ Done</span>
          )}
        </div>
        
        {/* Middle: Prompt */}
        <div className="flex-1 min-w-0 text-center px-2">
          {prompt ? (
            <p className="text-xl sm:text-2xl font-black tracking-tight text-black leading-tight">
              {prompt}
            </p>
          ) : (
            <p className="text-base sm:text-lg font-medium text-black/60">
              {config.description}
            </p>
          )}
        </div>
        
        {/* Right: Clickable indicator */}
        <div className="flex-shrink-0 w-12 sm:w-16 text-right flex flex-col items-end justify-center">
          {/* Chevron icon to show it's clickable */}
          <svg 
            className="w-8 h-8 text-black/50" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2.5} 
              d="M9 5l7 7-7 7" 
            />
          </svg>
          {hasSubmitted && (
            <span className="text-xs text-green-700 font-bold mt-1">Tap to change</span>
          )}
        </div>
      </div>
      
      {/* Submitted indicator */}
      {hasSubmitted && (
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-green-700 text-center">
          Tap to change your answer
        </p>
      )}
    </button>
  );
}

export default PhaseCardButton;

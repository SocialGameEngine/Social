import type { Interaction } from '../../../../shared/types';

interface InteractionCardProps {
  interaction: Interaction;
  isHost: boolean;
  hasResponded: boolean;
  memberCount: number;
  onRespond: () => void;
  onViewResponses: () => void;
  onClose: () => void;
}

export function InteractionCard({
  interaction,
  isHost,
  hasResponded,
  memberCount,
  onRespond,
  onViewResponses,
  onClose,
}: InteractionCardProps) {
  const handleClick = () => {
    if (isHost) {
      onViewResponses();
    } else if (!hasResponded) {
      onRespond();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isHost && hasResponded}
      className="w-full chaos-interaction-card px-3 py-6 sm:py-8 shadow-xl border-2 border-black/80 transform transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 min-h-[100px] sm:min-h-[120px] text-left"
    >
      {/* 3-Column Layout — matches PhaseCardButton */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Label + Response count */}
        <div className="flex-shrink-0 w-16 sm:w-20">
          <span className="text-sm sm:text-base font-black uppercase tracking-wider text-black/70">
            Prompt
          </span>
          <div className="mt-1">
            <span className="text-cyan-700 font-black text-sm sm:text-base">
              {interaction.responseCount}/{memberCount}
            </span>
          </div>
          {hasResponded && (
            <span className="block text-xs text-green-700 font-bold mt-1">✓ Done</span>
          )}
        </div>

        {/* Middle: Question */}
        <div className="flex-1 min-w-0 text-center px-2">
          <p className="text-xl sm:text-2xl font-black tracking-tight text-black leading-tight">
            {interaction.question}
          </p>
          {interaction.description && (
            <p className="text-xs text-black/50 mt-1">{interaction.description}</p>
          )}
        </div>

        {/* Right: Chevron or status */}
        <div className="flex-shrink-0 w-12 sm:w-16 text-right flex flex-col items-end justify-center">
          <svg className="w-8 h-8 text-black/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
          {hasResponded && (
            <span className="text-xs text-green-700 font-bold mt-1">Tap to edit</span>
          )}
        </div>
      </div>

      {/* Host: Close button */}
      {isHost && (
        <div className="mt-3 text-center">
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-xs font-bold uppercase tracking-wider text-black/40 hover:text-red-700 transition-colors"
          >
            Close Prompt
          </span>
        </div>
      )}
    </button>
  );
}

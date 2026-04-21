// =============================================================================
// SOCIALE PROGRESS COMPONENTS
// =============================================================================
// Progress indicators for Sociale rounds and phases

import { ProgressBar } from '@social/ui';
import { useTheme } from '../../../../shared/providers/ThemeProvider';
import { clsx } from 'clsx';

interface SocialePhaseProgressProps {
  phaseEndsAt?: string | null;
  phaseDuration?: number;
  isPaused?: boolean;
  pausedSeconds?: number;
  showLabel?: boolean;
}

export function SocialePhaseProgress({
  phaseEndsAt,
  phaseDuration = 30,
  isPaused = false,
  pausedSeconds,
  showLabel = true
}: SocialePhaseProgressProps) {
  const { isDark } = useTheme();

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className={clsx(
          'text-xs font-medium',
          isDark ? 'text-cyan-300' : 'text-slate-600'
        )}>
          Phase Progress
        </div>
      )}
      <ProgressBar
        endTime={phaseEndsAt || undefined}
        totalSeconds={phaseDuration}
        variant="brand"
        isDark={isDark}
        paused={isPaused}
        pausedSeconds={pausedSeconds}
      />
    </div>
  );
}

interface SocialeRoundProgressProps {
  currentRound: number;
  totalRounds: number;
  showLabel?: boolean;
}

export function SocialeRoundProgress({
  currentRound,
  totalRounds,
  showLabel = true
}: SocialeRoundProgressProps) {
  const { isDark } = useTheme();
  const progress = totalRounds > 0 ? (currentRound / totalRounds) * 100 : 0;

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className={clsx(
          'text-xs font-medium',
          isDark ? 'text-cyan-300' : 'text-slate-600'
        )}>
          Round {currentRound + 1} of {totalRounds}
        </div>
      )}
      <div className={clsx(
        'h-2 w-full rounded-full',
        isDark ? 'bg-slate-800/70 shadow-cyan-400/25' : 'bg-slate-200'
      )}>
        <div
          className={clsx(
            'progress-width-var h-full rounded-full transition-all duration-300',
            isDark 
              ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 shadow-lg shadow-cyan-400/50'
              : 'bg-brand-primary'
          )}
          style={{ '--progress-width': `${progress}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

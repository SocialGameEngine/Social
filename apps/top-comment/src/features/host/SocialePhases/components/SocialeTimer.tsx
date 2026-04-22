// =============================================================================
// SOCIALE TIMER COMPONENT
// =============================================================================
// Wrapper around the base Timer component for Sociale phases

import { Timer } from '@social/ui';
import { useTheme } from '../../../../shared/providers/ThemeProvider';

interface SocialeTimerProps {
  phaseEndsAt?: string | null;
  phase?: string;
  isPaused?: boolean;
  pausedSeconds?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  position?: 'fixed' | 'inline';
}

export function SocialeTimer({
  phaseEndsAt,
  phase,
  isPaused = false,
  pausedSeconds,
  size = 'lg',
  showLabel = true,
  position = 'inline'
}: SocialeTimerProps) {
  const { isDark } = useTheme();

  return (
    <Timer
      endTime={phaseEndsAt || undefined}
      label={showLabel ? phase : undefined}
      size={size}
      isDark={isDark}
      paused={isPaused}
      pausedSeconds={pausedSeconds}
      position={position}
      showCriticalBar={false}
    />
  );
}

// =============================================================================
// SCORE ANIMATION COMPONENT
// =============================================================================
// Animated score change display for Sociale

import { useState, useEffect } from 'react';
import { useTheme } from '../../../../shared/providers/ThemeProvider';
import { clsx } from 'clsx';

interface ScoreAnimationProps {
  points: number;
  reason?: string;
  socialiteName?: string;
  duration?: number;
  onComplete?: () => void;
  isDark?: boolean;
}

export function ScoreAnimation({
  points,
  reason,
  socialiteName,
  duration = 2000,
  onComplete,
  isDark: propIsDark
}: ScoreAnimationProps) {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark ?? themeIsDark;
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!isVisible) return null;

  const isPositive = points > 0;
  const isNegative = points < 0;
  const isZero = points === 0;

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
      <div
        className={clsx(
          'animate-bounce text-6xl font-bold transition-all duration-500',
          isPositive && 'text-green-400 drop-shadow-lg drop-shadow-green-400/50',
          isNegative && 'text-red-400 drop-shadow-lg drop-shadow-red-400/50',
          isZero && 'text-slate-400'
        )}
      >
        {isPositive && '+'}{points}
      </div>
      
      {socialiteName && (
        <div className={clsx(
          'absolute mt-20 text-lg font-medium',
          isDark ? 'text-white' : 'text-slate-900'
        )}>
          {socialiteName}
        </div>
      )}
      
      {reason && (
        <div className={clsx(
          'absolute mt-32 text-sm',
          isDark ? 'text-slate-300' : 'text-slate-600'
        )}>
          {reason}
        </div>
      )}
    </div>
  );
}

interface ScoreChangeIndicatorProps {
  oldScore: number;
  newScore: number;
  isDark?: boolean;
}

export function ScoreChangeIndicator({
  oldScore,
  newScore,
  isDark: _isDark
}: ScoreChangeIndicatorProps) {
  const change = newScore - oldScore;

  if (change === 0) return null;

  const isPositive = change > 0;

  return (
    <div className={clsx(
      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold',
      isPositive
        ? 'bg-green-500/20 text-green-400 border border-green-400/30'
        : 'bg-red-500/20 text-red-400 border border-red-400/30'
    )}>
      <span>{isPositive ? '↑' : '↓'}</span>
      <span>{Math.abs(change)}</span>
    </div>
  );
}

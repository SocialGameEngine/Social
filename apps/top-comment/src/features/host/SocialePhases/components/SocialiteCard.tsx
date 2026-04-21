// =============================================================================
// SOCIALE CARD COMPONENT
// =============================================================================
// Display component for a participant in a Sociale

import { useTheme } from '../../../../shared/providers/ThemeProvider';
import type { Socialite } from '../../../../domain/types/sociale.types';
import { clsx } from 'clsx';

interface SocialiteCardProps {
  socialite: Socialite;
  isCurrentPlayer?: boolean;
  isHighlighted?: boolean;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isDark?: boolean;
}

export function SocialiteCard({
  socialite,
  isCurrentPlayer = false,
  isHighlighted = false,
  showScore = true,
  size = 'md',
  isDark: propIsDark
}: SocialiteCardProps) {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark ?? themeIsDark;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const avatarSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  return (
    <div
      className={clsx(
        'flex items-center gap-2 rounded-lg border transition-all',
        sizeClasses[size],
        isCurrentPlayer && 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900',
        isHighlighted && !isCurrentPlayer && 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900',
        isDark
          ? 'bg-slate-800 border-slate-700'
          : 'bg-white border-slate-300',
        isHighlighted && 'shadow-lg'
      )}
    >
      {/* Avatar */}
      <div className={clsx(
        'rounded-full flex items-center justify-center text-white font-bold',
        avatarSizes[size],
        isCurrentPlayer
          ? 'bg-gradient-to-br from-cyan-400 to-cyan-600'
          : isHighlighted
            ? 'bg-gradient-to-br from-amber-400 to-amber-600'
            : isDark
              ? 'bg-slate-600'
              : 'bg-slate-400'
      )}>
        {socialite.displayName.charAt(0).toUpperCase()}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className={clsx(
          'font-medium truncate',
          isDark ? 'text-white' : 'text-slate-900'
        )}>
          {socialite.displayName}
        </div>
        {socialite.isHost && (
          <div className={clsx(
            'text-xs',
            isDark ? 'text-cyan-400' : 'text-cyan-600'
          )}>
            Host
          </div>
        )}
      </div>

      {/* Score */}
      {showScore && (
        <div className={clsx(
          'font-bold',
          isDark ? 'text-cyan-300' : 'text-cyan-600'
        )}>
          {socialite.score}
        </div>
      )}

      {/* Status indicators */}
      {!socialite.isActive && (
        <div className={clsx(
          'text-xs',
          isDark ? 'text-slate-500' : 'text-slate-400'
        )}>
          Inactive
        </div>
      )}
    </div>
  );
}

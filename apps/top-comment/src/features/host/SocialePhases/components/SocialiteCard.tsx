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
  /**
   * P1-5 — live submission indicator.
   *   'idle'      → grey dot (hasn't started)
   *   'typing'    → yellow dot (in-progress)
   *   'submitted' → green dot (answer submitted)
   */
  typingState?: 'idle' | 'typing' | 'submitted';
}

export function SocialiteCard({
  socialite,
  isCurrentPlayer = false,
  isHighlighted = false,
  showScore = true,
  size = 'md',
  isDark: propIsDark,
  typingState,
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

      {/* P1-5: typing/submission dot */}
      {typingState && (
        <span
          aria-label={
            typingState === 'submitted'
              ? 'Submitted'
              : typingState === 'typing'
                ? 'Typing'
                : 'Waiting'
          }
          title={
            typingState === 'submitted'
              ? 'Submitted'
              : typingState === 'typing'
                ? 'Typing'
                : 'Waiting'
          }
          className={clsx(
            'inline-block w-2.5 h-2.5 rounded-full',
            typingState === 'submitted' && 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]',
            typingState === 'typing' && 'bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.8)]',
            typingState === 'idle' && (isDark ? 'bg-slate-600' : 'bg-slate-300'),
          )}
        />
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

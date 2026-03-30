// =============================================================================
// RESPONSE CARD COMPONENT
// =============================================================================
// Display component for a response in a Sociale round

import { useTheme } from '../../../../shared/providers/ThemeProvider';
import type { SocialeResponse, Socialite, SocialeVote } from '../../../../domain/types/sociale.types';
import { clsx } from 'clsx';

interface ResponseCardProps {
  response: SocialeResponse;
  socialite: Socialite;
  votes: SocialeVote[];
  isWinner?: boolean;
  isVotedByCurrentUser?: boolean;
  showVotes?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isDark?: boolean;
  onClick?: () => void;
}

export function ResponseCard({
  response,
  socialite,
  votes,
  isWinner = false,
  isVotedByCurrentUser = false,
  showVotes = true,
  size = 'md',
  isDark: propIsDark,
  onClick
}: ResponseCardProps) {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark ?? themeIsDark;

  const voteCount = votes.filter(v => v.targetResponseId === response.id).length;
  const responseType = typeof response.value;

  const sizeClasses = {
    sm: 'p-2 text-sm',
    md: 'p-3 text-base',
    lg: 'p-4 text-lg'
  };

  const getResponseText = () => {
    if (responseType === 'string') return response.value;
    if (responseType === 'number') return response.value.toString();
    if (responseType === 'boolean') return response.value ? 'True' : 'False';
    if (responseType === 'object' && response.value !== null) {
      // Handle multiple choice or other structured responses
      const obj = response.value as Record<string, unknown>;
      if (obj.text && typeof obj.text === 'string') return obj.text;
      if (obj.option && typeof obj.option === 'string') return obj.option;
      return JSON.stringify(obj);
    }
    return 'No response';
  };

  return (
    <div
      className={clsx(
        'border rounded-lg transition-all cursor-pointer',
        sizeClasses[size],
        isWinner && 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 shadow-lg',
        isVotedByCurrentUser && 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900',
        !isWinner && !isVotedByCurrentUser && (
          isDark 
            ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' 
            : 'bg-white border-slate-300 hover:bg-slate-50'
        ),
        onClick && 'hover:scale-[1.02]'
      )}
      onClick={onClick}
    >
      {/* Header with author and votes */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={clsx(
            'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold',
            isDark ? 'bg-slate-600' : 'bg-slate-400'
          )}>
            {socialite.displayName.charAt(0).toUpperCase()}
          </div>
          <span className={clsx(
            'text-sm font-medium',
            isDark ? 'text-white' : 'text-slate-900'
          )}>
            {socialite.displayName}
          </span>
          {isWinner && (
            <span className="text-amber-400 text-sm">👑</span>
          )}
        </div>
        
        {showVotes && (
          <div className={clsx(
            'flex items-center gap-1 text-sm font-bold',
            isDark ? 'text-cyan-300' : 'text-cyan-600'
          )}>
            <span>❤️</span>
            <span>{voteCount}</span>
          </div>
        )}
      </div>

      {/* Response content */}
      <div className={clsx(
        'break-words',
        isDark ? 'text-white' : 'text-slate-900'
      )}>
        {String(getResponseText())}
      </div>

      {/* Footer with metadata */}
      {(response.isCorrect !== undefined || response.scoreAwarded !== undefined) && (
        <div className="mt-2 pt-2 border-t border-slate-700 flex items-center gap-4 text-xs">
          {response.isCorrect !== undefined && (
            <span className={clsx(
              response.isCorrect 
                ? 'text-green-400' 
                : 'text-red-400'
            )}>
              {response.isCorrect ? '✓ Correct' : '✗ Incorrect'}
            </span>
          )}
          {response.scoreAwarded !== undefined && response.scoreAwarded > 0 && (
            <span className={clsx(
              'font-bold',
              isDark ? 'text-cyan-300' : 'text-cyan-600'
            )}>
              +{response.scoreAwarded} pts
            </span>
          )}
        </div>
      )}
    </div>
  );
}

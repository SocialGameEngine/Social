import { useState, useCallback } from 'react';
import { REACTION_EMOJIS, type ReactionEmoji } from '../../../shared/constants/reactions';

interface ReactionBarProps {
  onReact: (emoji: ReactionEmoji) => void;
  reactionCounts: Record<ReactionEmoji, number>;
}

export function ReactionBar({ onReact, reactionCounts }: ReactionBarProps) {
  const [tappedEmoji, setTappedEmoji] = useState<ReactionEmoji | null>(null);

  const handleTap = useCallback((emoji: ReactionEmoji) => {
    onReact(emoji);
    setTappedEmoji(emoji);
    setTimeout(() => setTappedEmoji(null), 200);
  }, [onReact]);

  return (
    <div className="flex items-center justify-center gap-2 px-3 py-2">
      {REACTION_EMOJIS.map((emoji) => {
        const count = reactionCounts[emoji] || 0;
        const isTapped = tappedEmoji === emoji;

        return (
          <button
            key={emoji}
            type="button"
            onClick={() => handleTap(emoji)}
            className={`
              relative flex flex-col items-center justify-center
              rounded-xl px-2.5 py-1.5
              bg-slate-800/60 hover:bg-slate-700/80
              border border-slate-700/50 hover:border-cyan-400/30
              transition-all duration-150 active:scale-90
              ${isTapped ? 'scale-110 border-cyan-400/60 bg-cyan-900/40' : ''}
            `}
            aria-label={`React with ${emoji}`}
          >
            <span className={`text-xl transition-transform duration-150 ${isTapped ? 'scale-125' : ''}`}>
              {emoji}
            </span>
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold text-white">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

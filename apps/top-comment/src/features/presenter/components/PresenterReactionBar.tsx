import { REACTION_EMOJIS, type ReactionEmoji } from '../../../shared/constants/reactions';

interface PresenterReactionBarProps {
  reactionCounts: Record<ReactionEmoji, number>;
}

export function PresenterReactionBar({ reactionCounts }: PresenterReactionBarProps) {
  const total = Object.values(reactionCounts).reduce((sum, c) => sum + c, 0);
  if (total === 0) return null;

  const maxCount = Math.max(...Object.values(reactionCounts), 1);

  return (
    <div className="flex items-end justify-center gap-3 px-4 py-3">
      {REACTION_EMOJIS.map((emoji) => {
        const count = reactionCounts[emoji] || 0;
        const height = count > 0 ? Math.max(8, (count / maxCount) * 48) : 0;

        return (
          <div key={emoji} className="flex flex-col items-center gap-1">
            {count > 0 && (
              <div
                className="w-8 rounded-t-md bg-gradient-to-t from-pink-500 to-cyan-400 transition-all duration-500 height-var"
                style={{ '--height-px': `${height}px` } as React.CSSProperties}
              />
            )}
            <span className="text-2xl">{emoji}</span>
            {count > 0 && (
              <span className="text-xs font-bold text-cyan-300">{count}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

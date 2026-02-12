import { useEffect, useState, useRef } from 'react';
import type { RoomReaction } from '../../../services/reactionService';
import type { ReactionBurst } from '../../../hooks/useReactions';

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number; // percentage from left
  delay: number; // animation delay in ms
  size: number; // font size in rem
}

interface ReactionOverlayProps {
  reactions: RoomReaction[];
  bursts: ReactionBurst[];
}

export function ReactionOverlay({ reactions, bursts }: ReactionOverlayProps) {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const processedRef = useRef<Set<string>>(new Set());

  // Add new floating emojis when reactions come in
  useEffect(() => {
    const newReactions = reactions.filter(r => !processedRef.current.has(r.id));
    if (newReactions.length === 0) return;

    const newFloating: FloatingEmoji[] = newReactions.map(r => {
      processedRef.current.add(r.id);
      return {
        id: r.id,
        emoji: r.emoji,
        x: 10 + Math.random() * 80, // 10-90% from left
        delay: Math.random() * 300,
        size: 1.2 + Math.random() * 0.8, // 1.2-2rem
      };
    });

    setFloatingEmojis(prev => [...prev, ...newFloating]);

    // Clean up after animation completes (3s)
    const timeout = setTimeout(() => {
      const ids = new Set(newFloating.map(f => f.id));
      setFloatingEmojis(prev => prev.filter(f => !ids.has(f.id)));
    }, 3500);

    return () => clearTimeout(timeout);
  }, [reactions]);

  // Clean up processed IDs periodically to prevent memory leak
  useEffect(() => {
    const interval = setInterval(() => {
      const activeIds = new Set(reactions.map(r => r.id));
      for (const id of processedRef.current) {
        if (!activeIds.has(id)) {
          processedRef.current.delete(id);
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [reactions]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {/* Floating emoji animations */}
      {floatingEmojis.map(f => (
        <span
          key={f.id}
          className="absolute animate-reaction-float"
          style={{
            left: `${f.x}%`,
            bottom: '80px',
            fontSize: `${f.size}rem`,
            animationDelay: `${f.delay}ms`,
          }}
        >
          {f.emoji}
        </span>
      ))}

      {/* Burst effects */}
      {bursts.map((burst, i) => (
        <div
          key={`burst-${burst.timestamp}-${i}`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-reaction-burst"
        >
          <span className="text-6xl">{burst.emoji}</span>
          <span className="absolute -top-2 -right-2 rounded-full bg-pink-500 px-2 py-0.5 text-xs font-bold text-white">
            x{burst.count}
          </span>
        </div>
      ))}
    </div>
  );
}

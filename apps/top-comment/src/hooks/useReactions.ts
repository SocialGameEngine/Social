import { useState, useEffect, useCallback, useRef } from 'react';
import { reactionService, type RoomReaction } from '../services/reactionService';
import {
  REACTION_EMOJIS,
  REACTION_THROTTLE_MS,
  REACTION_WINDOW_MS,
  type ReactionEmoji,
} from '../shared/constants/reactions';

interface UseReactionsOptions {
  roomId: string | undefined;
  membershipId: string | undefined;
}

export interface ReactionBurst {
  emoji: ReactionEmoji;
  count: number;
  timestamp: number;
}

/**
 * Legacy emoji reaction rail (PresenterReactionBar). Server `room_reactions`
 * was removed; subscription is a no-op and sends fail silently. Collective
 * hype uses `useHypeMeter` (P1-2) instead.
 */
export function useReactions({ roomId, membershipId }: UseReactionsOptions) {
  const [reactions, setReactions] = useState<RoomReaction[]>([]);
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionEmoji, number>>(
    () => Object.fromEntries(REACTION_EMOJIS.map((e) => [e, 0])) as Record<ReactionEmoji, number>
  );
  const [bursts, setBursts] = useState<ReactionBurst[]>([]);
  const lastSentRef = useRef<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - REACTION_WINDOW_MS;
      setReactions((prev) => {
        const filtered = prev.filter((r) => new Date(r.createdAt).getTime() > cutoff);
        if (filtered.length !== prev.length) {
          const counts = Object.fromEntries(REACTION_EMOJIS.map((e) => [e, 0])) as Record<
            ReactionEmoji,
            number
          >;
          for (const r of filtered) {
            if (counts[r.emoji] !== undefined) {
              counts[r.emoji]++;
            }
          }
          setReactionCounts(counts);
        }
        return filtered;
      });

      setBursts((prev) => prev.filter((b) => b.timestamp > cutoff));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const sendReaction = useCallback(
    async (emoji: ReactionEmoji) => {
      if (!roomId || !membershipId) return;

      const now = Date.now();
      if (now - lastSentRef.current < REACTION_THROTTLE_MS) return;
      lastSentRef.current = now;

      try {
        await reactionService.submitReaction(roomId, membershipId, emoji);
      } catch {
        // Silently fail — reaction is non-critical
      }
    },
    [roomId, membershipId]
  );

  return { reactions, reactionCounts, bursts, sendReaction };
}

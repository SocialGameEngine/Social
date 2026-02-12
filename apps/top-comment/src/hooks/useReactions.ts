import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';
import { reactionService, type RoomReaction } from '../services/reactionService';
import {
  REACTION_EMOJIS,
  REACTION_THROTTLE_MS,
  REACTION_WINDOW_MS,
  REACTION_BURST_THRESHOLD,
  REACTION_BURST_WINDOW_MS,
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

export function useReactions({ roomId, membershipId }: UseReactionsOptions) {
  const [reactions, setReactions] = useState<RoomReaction[]>([]);
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionEmoji, number>>(
    () => Object.fromEntries(REACTION_EMOJIS.map(e => [e, 0])) as Record<ReactionEmoji, number>
  );
  const [bursts, setBursts] = useState<ReactionBurst[]>([]);
  const lastSentRef = useRef<number>(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Clean up old reactions from the rolling window
  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - REACTION_WINDOW_MS;
      setReactions(prev => {
        const filtered = prev.filter(r => new Date(r.createdAt).getTime() > cutoff);
        if (filtered.length !== prev.length) {
          // Recalculate counts
          const counts = Object.fromEntries(REACTION_EMOJIS.map(e => [e, 0])) as Record<ReactionEmoji, number>;
          for (const r of filtered) {
            if (counts[r.emoji] !== undefined) {
              counts[r.emoji]++;
            }
          }
          setReactionCounts(counts);
        }
        return filtered;
      });

      // Clean up old bursts
      setBursts(prev => prev.filter(b => b.timestamp > cutoff));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Subscribe to realtime INSERT events
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room_reactions:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_reactions',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const raw = payload.new as Record<string, any>;
          const reaction: RoomReaction = {
            id: raw.id,
            roomId: raw.room_id,
            membershipId: raw.membership_id,
            emoji: raw.emoji as ReactionEmoji,
            contextType: raw.context_type,
            contextId: raw.context_id ?? null,
            createdAt: raw.created_at,
          };

          setReactions(prev => {
            const next = [...prev, reaction];
            // Update counts
            setReactionCounts(counts => ({
              ...counts,
              [reaction.emoji]: (counts[reaction.emoji] || 0) + 1,
            }));
            return next;
          });

          // Check for burst
          checkBurst(reaction.emoji);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId]);

  // Check if a burst should be triggered
  const checkBurst = useCallback((emoji: ReactionEmoji) => {
    setReactions(current => {
      const now = Date.now();
      const burstWindow = now - REACTION_BURST_WINDOW_MS;
      const recentCount = current.filter(
        r => r.emoji === emoji && new Date(r.createdAt).getTime() > burstWindow
      ).length;

      if (recentCount >= REACTION_BURST_THRESHOLD) {
        setBursts(prev => [...prev, { emoji, count: recentCount, timestamp: now }]);
      }
      return current;
    });
  }, []);

  // Send a reaction with client-side throttle
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

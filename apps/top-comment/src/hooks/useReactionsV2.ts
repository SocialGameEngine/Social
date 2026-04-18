/**
 * Enhanced Reactions Hook with Async State Architecture (V2)
 * 
 * REPLACES: useReactions.ts (deprecated)
 * 
 * Features:
 * - AsyncSubscriptionResult contract
 * - Connection status tracking
 * - Subscription guards
 * - Throttling and burst detection
 */

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
import type { AsyncSubscriptionResult, ConnectionStatus } from './async/types';
import { useAuth } from '../shared/providers/AuthContext';

interface UseReactionsOptions {
  roomId: string | undefined;
  membershipId: string | undefined;
}

export interface ReactionBurst {
  emoji: ReactionEmoji;
  count: number;
  timestamp: number;
}

interface ReactionData {
  reactions: RoomReaction[];
  reactionCounts: Record<ReactionEmoji, number>;
  bursts: ReactionBurst[];
}

export function useReactionsV2({ roomId, membershipId }: UseReactionsOptions): AsyncSubscriptionResult<ReactionData> & {
  sendReaction: (emoji: ReactionEmoji) => Promise<void>;
} {
  const { loading: authLoading } = useAuth();
  const [reactions, setReactions] = useState<RoomReaction[]>([]);
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionEmoji, number>>(
    () => Object.fromEntries(REACTION_EMOJIS.map(e => [e, 0])) as Record<ReactionEmoji, number>
  );
  const [bursts, setBursts] = useState<ReactionBurst[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [error] = useState<Error | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  
  const lastSentRef = useRef<number>(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Clean up old reactions from the rolling window
  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - REACTION_WINDOW_MS;
      setReactions(prev => {
        const filtered = prev.filter(r => new Date(r.createdAt).getTime() > cutoff);
        if (filtered.length !== prev.length) {
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

      setBursts(prev => prev.filter(b => b.timestamp > cutoff));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  // Subscribe to realtime INSERT events - GUARDED by auth
  useEffect(() => {
    if (authLoading) return;
    if (!roomId) {
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");

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
            setReactionCounts(counts => ({
              ...counts,
              [reaction.emoji]: (counts[reaction.emoji] || 0) + 1,
            }));
            setLastUpdatedAt(Date.now());
            return next;
          });

          checkBurst(reaction.emoji);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error');
          setSubscriptionError(new Error('Reactions subscription error'));
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      channelRef.current = null;
      setConnectionStatus("disconnected");
    };
  }, [roomId, authLoading, checkBurst]);

  // Send a reaction with client-side throttle
  const sendReaction = useCallback(
    async (emoji: ReactionEmoji) => {
      if (!roomId || !membershipId) return;

      const now = Date.now();
      if (now - lastSentRef.current < REACTION_THROTTLE_MS) return;
      lastSentRef.current = now;

      try {
        await reactionService.submitReaction(roomId, membershipId, emoji);
      } catch (err) {
        // Silently fail — reaction is non-critical
        console.warn('Failed to send reaction:', err);
      }
    },
    [roomId, membershipId]
  );

  const data: ReactionData = {
    reactions,
    reactionCounts,
    bursts,
  };

  const getStatus = () => {
    if (authLoading) return "booting" as const;
    if (connectionStatus === "connecting") return "loading" as const;
    if (connectionStatus === "reconnecting") return "reconnecting" as const;
    if (connectionStatus === "error") return "error" as const;
    if (connectionStatus === "disconnected") return "degraded" as const;
    
    const isStale = lastUpdatedAt ? Date.now() - lastUpdatedAt > 30000 : false;
    if (isStale) return "stale" as const;
    
    return "ready" as const;
  };

  const isStale = lastUpdatedAt ? Date.now() - lastUpdatedAt > 30000 : false;
  const canInteract = connectionStatus === "connected" || reactions.length > 0;

  return {
    status: getStatus(),
    data,
    error,
    retry: () => {},
    lastUpdatedAt,
    isStale,
    canInteract,
    connectionStatus,
    reconnect: () => {},
    subscriptionError,
    sendReaction,
  };
}

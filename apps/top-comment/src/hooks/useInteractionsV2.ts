/**
 * Enhanced Interactions Hook with Async State Architecture (V2)
 * 
 * REPLACES: useInteractions.ts (deprecated)
 * 
 * Features:
 * - AsyncSubscriptionResult contract
 * - Connection status tracking
 * - Subscription guards
 * - Optimistic mutations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';
import { interactionService } from '../services/interactionService';
import type { Interaction } from '../shared/types';
import type { AsyncSubscriptionResult, ConnectionStatus } from './async/types';
import { useAuth } from '../shared/providers/AuthContext';

interface UseInteractionsOptions {
  roomId?: string;
}

export function useInteractionsV2({ roomId }: UseInteractionsOptions): AsyncSubscriptionResult<Interaction[]> & {
  createInteraction: (question: string, description?: string) => Promise<Interaction>;
  closeInteraction: (interactionId: string) => Promise<void>;
  refresh: () => Promise<void>;
} {
  const { loading: authLoading } = useAuth();
  const [data, setData] = useState<Interaction[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<Error | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const refresh = useCallback(async () => {
    if (!roomId) return;
    try {
      const interactions = await interactionService.getAllInteractions(roomId);
      const activeInteractions = interactions.filter(i => i.status !== 'closed');
      setData(activeInteractions);
      setLastUpdatedAt(Date.now());
      setError(null);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to load interactions');
      setError(errorObj);
      setSubscriptionError(errorObj);
    }
  }, [roomId]);

  // Initial load - GUARDED by auth
  useEffect(() => {
    if (authLoading) return;
    if (!roomId) {
      setData([]);
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");
    refresh().then(() => setConnectionStatus("connected"));
  }, [roomId, authLoading, refresh]);

  // Real-time subscription - GUARDED by auth
  useEffect(() => {
    if (authLoading) return;
    if (!roomId) return;

    const channel = supabase
      .channel(`interactions:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interactions',
          filter: `room_id=eq.${roomId}`,
        },
        () => refresh()
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'responses',
        },
        () => refresh()
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error');
          setSubscriptionError(new Error('Interactions subscription error'));
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setConnectionStatus("disconnected");
    };
  }, [roomId, authLoading, refresh]);

  // Optimistic create interaction
  const createInteraction = useCallback(
    async (question: string, description?: string) => {
      if (!roomId) throw new Error('No room ID');
      
      try {
        const interaction = await interactionService.createInteraction(roomId, question, description);
        // Optimistic: add to list immediately
        setData((prev) => [interaction, ...prev]);
        setLastUpdatedAt(Date.now());
        return interaction;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Failed to create interaction');
        setError(errorObj);
        throw errorObj;
      }
    },
    [roomId]
  );

  // Optimistic close interaction
  const closeInteraction = useCallback(async (interactionId: string) => {
    try {
      await interactionService.closeInteraction(interactionId);
      // Optimistic: remove from active list
      setData((prev) => prev.filter((i) => i.id !== interactionId));
      setLastUpdatedAt(Date.now());
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to close interaction');
      setError(errorObj);
      throw errorObj;
    }
  }, []);

  const getStatus = () => {
    if (authLoading) return "booting" as const;
    if (connectionStatus === "connecting") return "loading" as const;
    if (connectionStatus === "reconnecting") return "reconnecting" as const;
    if (connectionStatus === "error") return "error" as const;
    if (connectionStatus === "disconnected") return "degraded" as const;
    if (data.length === 0) return "empty" as const;
    
    const isStale = lastUpdatedAt ? Date.now() - lastUpdatedAt > 30000 : false;
    if (isStale) return "stale" as const;
    
    return "ready" as const;
  };

  const isStale = lastUpdatedAt ? Date.now() - lastUpdatedAt > 30000 : false;
  const canInteract = connectionStatus === "connected" || data.length > 0;

  return {
    status: getStatus(),
    data,
    error,
    retry: refresh,
    lastUpdatedAt,
    isStale,
    canInteract,
    connectionStatus,
    reconnect: refresh,
    subscriptionError,
    createInteraction,
    closeInteraction,
    refresh,
  };
}

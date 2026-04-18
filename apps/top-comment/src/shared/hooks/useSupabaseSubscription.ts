// =============================================================================
// UNIFIED SUPABASE SUBSCRIPTION HOOK
// =============================================================================
// Standardized hook for Supabase realtime subscriptions with proper cleanup.

import { useEffect, useRef } from 'react';
import { supabase } from '../../supabase/client';
import { logger } from '../utils/logger';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface UseSupabaseSubscriptionOptions<T> {
  /** Unique channel name */
  channelName: string;
  /** Event type (default: '*') */
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  /** Schema name (default: 'public') */
  schema?: string;
  /** Table name to subscribe to */
  table?: string;
  /** Filter expression (e.g., 'room_id=eq.123') */
  filter?: string;
  /** Callback when payload is received */
  onPayload: (payload: T) => void;
  /** Callback when subscription error occurs */
  onError?: (error: Error) => void;
  /** Whether subscription is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Unified hook for Supabase realtime subscriptions
 * 
 * Features:
 * - Automatic cleanup with unsubscribe + removeChannel
 * - Connection status logging
 * - Error handling
 * - Conditional subscription via enabled flag
 * 
 * @example
 * ```ts
 * useSupabaseSubscription({
 *   channelName: 'room-updates',
 *   table: 'rooms',
 *   filter: `id=eq.${roomId}`,
 *   onPayload: (payload) => {
 *     console.log('Room updated:', payload.new);
 *   },
 * });
 * ```
 */
export function useSupabaseSubscription<T = unknown>(
  options: UseSupabaseSubscriptionOptions<T>
): void {
  const {
    channelName,
    event = '*',
    schema = 'public',
    table,
    filter,
    onPayload,
    onError,
    enabled = true,
  } = options;
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !table) {
      return;
    }

    const channel = supabase.channel(channelName);
    channelRef.current = channel;
    
    // Subscribe to postgres changes
    channel.on(
      'postgres_changes' as any,
      { event, schema, table, filter },
      (payload: any) => {
        try {
          onPayload(payload.new as T);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error(`[${channelName}] Payload handler error`, { error: err });
          onError?.(err);
        }
      }
    );
    
    // Subscribe and handle status
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        logger.info(`[${channelName}] Subscribed to ${table}`);
      } else if (status === 'CHANNEL_ERROR') {
        const error = new Error(`Subscription error for ${channelName}`);
        logger.error(`[${channelName}] Subscription error`, { error });
        onError?.(error);
      } else if (status === 'TIMED_OUT') {
        logger.warn(`[${channelName}] Subscription timed out`);
      }
    });
    
    // Cleanup: MUST unsubscribe before removeChannel to prevent memory leaks
    return () => {
      channel.unsubscribe();
      void supabase.removeChannel(channel);
      channelRef.current = null;
      logger.debug(`[${channelName}] Cleaned up subscription`);
    };
  }, [channelName, event, schema, table, filter, enabled, onPayload, onError]);
}

/**
 * Hook for broadcast-only channels (no postgres changes)
 */
export function useSupabaseBroadcast<T = unknown>(options: {
  channelName: string;
  event: string;
  onPayload: (payload: T) => void;
  enabled?: boolean;
}): {
  broadcast: (event: string, payload: T) => void;
} {
  const { channelName, event, onPayload, enabled = true } = options;
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const channel = supabase.channel(channelName);
    channelRef.current = channel;
    
    channel.on('broadcast', { event }, (payload) => {
      onPayload(payload.payload as T);
    });
    
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        logger.info(`[${channelName}] Broadcast channel ready`);
      }
    });
    
    return () => {
      channel.unsubscribe();
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [channelName, event, enabled, onPayload]);

  const broadcast = (broadcastEvent: string, payload: T) => {
    if (channelRef.current) {
      void channelRef.current.send({
        type: 'broadcast',
        event: broadcastEvent,
        payload,
      });
    }
  };

  return { broadcast };
}

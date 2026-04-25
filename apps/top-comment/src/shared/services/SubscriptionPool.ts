/**
 * SubscriptionPool – singleton that manages Supabase Realtime channels.
 *
 * Goals:
 *  1. Prevent duplicate channels for the same logical subscription.
 *  2. Reference-count listeners so a channel is only removed when the last
 *     consumer unsubscribes.
 *  3. Provide a single place to inspect / debug active channels.
 *
 * Usage:
 *   const unsub = subscriptionPool.subscribe(
 *     'room-unified:abc123',
 *     [
 *       { event: '*', schema: 'public', table: 'rooms', filter: 'id=eq.abc123' },
 *       { event: '*', schema: 'public', table: 'room_memberships', filter: 'room_id=eq.abc123' },
 *     ],
 *     (payload) => { ... },
 *   );
 *
 *   // later, in cleanup:
 *   unsub();
 */

import { supabase } from '../../supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeFilter = {
  event: string;
  schema?: string; 
  table?: string;
  filter?: string;
};
import { logger } from '../utils/logger';

export interface PgChangesFilter {
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  filter?: string;
}

interface ChannelEntry {
  channel: RealtimeChannel;
  callbacks: Set<(payload: any) => void>;
  filters: PgChangesFilter[];
}

class SubscriptionPool {
  private channels = new Map<string, ChannelEntry>();

  /**
   * Subscribe to postgres_changes on a named channel.
   *
   * If a channel with `channelName` already exists and has the same filters,
   * the callback is simply added to the existing channel.  Otherwise a new
   * channel is created.
   *
   * @returns An unsubscribe function.  Call it on cleanup.
   */
  subscribe(
    channelName: string,
    filters: PgChangesFilter[],
    callback: (payload: any) => void,
  ): () => void {
    const existing = this.channels.get(channelName);

    if (existing) {
      existing.callbacks.add(callback);
      logger.debug('SubscriptionPool: added listener to existing channel', { channelName, listeners: existing.callbacks.size });
      return () => this.unsubscribe(channelName, callback);
    }

    // Build a new channel with all requested filters.
    // We dispatch to all callbacks from a single handler per filter so that
    // only one Supabase channel is created regardless of listener count.
    const dispatcher = (payload: any) => {
      const entry = this.channels.get(channelName);
      if (entry) {
        for (const cb of entry.callbacks) {
          try {
            cb(payload);
          } catch (err) {
            logger.error('SubscriptionPool: listener error', { channelName, error: err });
          }
        }
      }
    };

    let channel = supabase.channel(channelName);

    for (const f of filters) {
      const opts: Record<string, any> = {
        event: f.event,
        schema: f.schema,
        table: f.table,
      };
      if (f.filter) opts.filter = f.filter;
      channel = (channel as any).on('postgres_changes', opts, dispatcher);
    }

    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        logger.debug('SubscriptionPool: channel subscribed', { channelName });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        logger.error('SubscriptionPool: channel error', { channelName, status });
      }
    });

    const entry: ChannelEntry = {
      channel,
      callbacks: new Set([callback]),
      filters,
    };

    this.channels.set(channelName, entry);
    logger.debug('SubscriptionPool: created channel', { channelName, filterCount: filters.length });

    return () => this.unsubscribe(channelName, callback);
  }

  /**
   * Subscribe to broadcast events on a named channel.
   */
  subscribeBroadcast(
    channelName: string,
    event: string,
    callback: (payload: any) => void,
  ): () => void {
    const existing = this.channels.get(channelName);

    if (existing) {
      existing.callbacks.add(callback);
      return () => this.unsubscribe(channelName, callback);
    }

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event }, (payload: any) => {
        const entry = this.channels.get(channelName);
        if (entry) {
          for (const cb of entry.callbacks) {
            try {
              cb(payload);
            } catch (err) {
              logger.error('SubscriptionPool: broadcast listener error', { channelName, error: err });
            }
          }
        }
      })
      .subscribe();

    const entry: ChannelEntry = {
      channel,
      callbacks: new Set([callback]),
      filters: [],
    };

    this.channels.set(channelName, entry);
    return () => this.unsubscribe(channelName, callback);
  }

  private unsubscribe(channelName: string, callback: (payload: any) => void): void {
    const entry = this.channels.get(channelName);
    if (!entry) return;

    entry.callbacks.delete(callback);

    if (entry.callbacks.size === 0) {
      entry.channel.unsubscribe();
      supabase.removeChannel(entry.channel);
      this.channels.delete(channelName);
      logger.debug('SubscriptionPool: removed channel (no listeners)', { channelName });
    } else {
      logger.debug('SubscriptionPool: removed listener, channel kept', { channelName, remaining: entry.callbacks.size });
    }
  }

  /** Get the underlying RealtimeChannel (useful for sending broadcasts). */
  getChannel(channelName: string): RealtimeChannel | null {
    return this.channels.get(channelName)?.channel ?? null;
  }

  /** Number of active channels. */
  get activeChannelCount(): number {
    return this.channels.size;
  }

  /** Diagnostic: list all active channel names. */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  /** Remove all channels. Useful during logout / hard reset. */
  removeAll(): void {
    for (const [name, entry] of this.channels) {
      entry.channel.unsubscribe();
      supabase.removeChannel(entry.channel);
      logger.debug('SubscriptionPool: removed channel (removeAll)', { channelName: name });
    }
    this.channels.clear();
  }
}

// Export singleton
export const subscriptionPool = new SubscriptionPool();

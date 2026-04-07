/**
 * Debounced Broadcast utility for Supabase Realtime.
 *
 * Batches broadcast sends so that only the latest payload for a given
 * channel+event pair is sent per interval. This dramatically reduces
 * egress for high-frequency broadcasts like vibox-current-track which
 * was previously sending every second.
 */

import { supabase } from '../../supabase/client';
import { logger } from './logger';

interface PendingBroadcast {
  channelName: string;
  event: string;
  payload: any;
}

const pendingBroadcasts = new Map<string, PendingBroadcast>();
let flushTimer: ReturnType<typeof setInterval> | null = null;

const BROADCAST_INTERVAL_MS = 3000; // Send at most once every 3 seconds

function getKey(channelName: string, event: string): string {
  return `${channelName}::${event}`;
}

function flush() {
  if (pendingBroadcasts.size === 0) return;

  for (const [_key, { channelName, event, payload }] of pendingBroadcasts) {
    try {
      supabase.channel(channelName).send({
        type: 'broadcast',
        event,
        payload,
      });
    } catch (err) {
      logger.error('debouncedBroadcast: send failed', { channelName, event, error: err });
    }
  }

  pendingBroadcasts.clear();
}

function ensureTimer() {
  if (!flushTimer) {
    flushTimer = setInterval(flush, BROADCAST_INTERVAL_MS);
  }
}

/**
 * Queue a broadcast message. Only the latest payload for a given
 * channel+event combination will actually be sent, at most once per
 * BROADCAST_INTERVAL_MS.
 */
export function debouncedBroadcast(channelName: string, event: string, payload: any): void {
  const key = getKey(channelName, event);
  pendingBroadcasts.set(key, { channelName, event, payload });
  ensureTimer();
}

/**
 * Send a broadcast immediately AND cancel any pending debounced send
 * for the same channel+event. Use for critical one-off events
 * (e.g. play/pause toggle, track change) that need instant delivery.
 */
export function immediateBroadcast(channelName: string, event: string, payload: any): void {
  const key = getKey(channelName, event);
  pendingBroadcasts.delete(key);

  try {
    supabase.channel(channelName).send({
      type: 'broadcast',
      event,
      payload,
    });
  } catch (err) {
    logger.error('immediateBroadcast: send failed', { channelName, event, error: err });
  }
}

/**
 * Flush all pending broadcasts immediately and stop the timer.
 * Call on component unmount or cleanup.
 */
export function flushAndStop(): void {
  flush();
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}

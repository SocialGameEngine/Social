import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../../../supabase/client";

/**
 * P1-2: collective hype meter — tap-to-fill broadcast channel.
 *
 * Pattern follows `useHostSignals`: ephemeral supabase broadcast, keyed per
 * room, no persistence. Each tap from a phone fires `hype:tap`; the meter
 * aggregates taps within a rolling `windowMs` window and emits a level +
 * progress snapshot. When the meter crosses a level threshold, `onLevelUp`
 * fires so the TV can play a swell animation/audio.
 *
 *   level thresholds: 50, 120, 220 (roughly ~5s burst, ~15s burst, sustained).
 *
 * Intentionally a bit noisy — the whole point is to capture pub energy, not
 * to de-dup. If a single player spams, their taps still count (throttled at
 * `throttleMs` client-side).
 */

const WINDOW_MS = 5000;
const BASE_LEVELS = [50, 120, 220];

/** Scale thresholds down for smaller rooms so solo play is still fun. */
function getScaledThresholds(playerCount: number): number[] {
  return BASE_LEVELS.map(t => Math.round(t / Math.max(1, playerCount / 4)));
}

export interface HypeSnapshot {
  /** Taps within the current rolling window. */
  tapsInWindow: number;
  /** Highest level reached this window. 0 = below level 1. */
  level: number;
  /** Progress towards the next level threshold (0-1). */
  progress: number;
  /** Timestamp of last tap, for TV pulse animation. */
  lastTapAt: number | null;
  /**
   * Highest level ever reached since the hook was mounted (or since the
   * caller last reset it). Does NOT drop back when the meter drains — used
   * by TVPage to decide whether to fire the hype-bonus edge function at the
   * end of a topic round.
   */
  peakLevel: number;
}

const DEFAULT_SNAPSHOT: HypeSnapshot = {
  tapsInWindow: 0,
  level: 0,
  progress: 0,
  lastTapAt: null,
  peakLevel: 0,
};

interface UseHypeMeterOptions {
  roomId: string | null | undefined;
  /** If false, taps are ignored (used to gate to post-reveal phases). */
  enabled?: boolean;
  /** Throttle sender to avoid flooding. */
  throttleMs?: number;
  /** Called once per new level crossed. */
  onLevelUp?: (level: number) => void;
  /** Player count for scaling difficulty thresholds. Defaults to 4. */
  playerCount?: number;
}

export function useHypeMeter({
  roomId,
  enabled = true,
  throttleMs = 80,
  onLevelUp,
  playerCount,
}: UseHypeMeterOptions) {
  const [snapshot, setSnapshot] = useState<HypeSnapshot>(DEFAULT_SNAPSHOT);
  const tapsRef = useRef<number[]>([]);
  const lastLevelRef = useRef<number>(0);
  const peakLevelRef = useRef<number>(0);
  const lastSendRef = useRef<number>(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingTapsRef = useRef<number>(0);
  const batchTimerRef = useRef<number | null>(null);

  const recomputeSnapshot = useCallback(() => {
    const LEVELS = getScaledThresholds(playerCount ?? 4);
    const now = Date.now();
    const cutoff = now - WINDOW_MS;
    tapsRef.current = tapsRef.current.filter((t) => t > cutoff);
    const tapsInWindow = tapsRef.current.length;
    let level = 0;
    for (let i = 0; i < LEVELS.length; i++) {
      if (tapsInWindow >= LEVELS[i]) level = i + 1;
    }
    const nextThreshold = LEVELS[Math.min(level, LEVELS.length - 1)];
    const prevThreshold = level === 0 ? 0 : LEVELS[level - 1];
    const denominator = Math.max(1, nextThreshold - prevThreshold);
    const progress = Math.min(
      1,
      Math.max(0, (tapsInWindow - prevThreshold) / denominator)
    );
    const lastTapAt = tapsRef.current.length > 0
      ? tapsRef.current[tapsRef.current.length - 1]
      : null;

    // peakLevel only ever goes up — survives meter drains so TVPage can
    // read it after the round ends to decide the bonus tier.
    if (level > peakLevelRef.current) peakLevelRef.current = level;

    setSnapshot({ tapsInWindow, level, progress, lastTapAt, peakLevel: peakLevelRef.current });

    if (level > lastLevelRef.current) {
      lastLevelRef.current = level;
      onLevelUp?.(level);
    } else if (tapsInWindow === 0) {
      // Drop level back to 0 when meter fully drains so the next surge
      // re-triggers animations.
      lastLevelRef.current = 0;
    }
  }, [onLevelUp, playerCount]);

  useEffect(() => {
    if (!roomId) return;
    const channel = supabase.channel(`hype:${roomId}`, {
      config: { broadcast: { self: true } },
    });
    channel
      .on("broadcast", { event: "hype:tap" }, ({ payload }) => {
        // Support both legacy single-tap ({}) and batched ({count: N}) payloads
        const count = Math.min(Number((payload as any)?.count ?? 1), 10);
        const now = Date.now();
        // Spread timestamps evenly across the batch window for meter realism
        for (let i = 0; i < count; i++) {
          tapsRef.current.push(now - Math.round((count - 1 - i) * (500 / count)));
        }
        recomputeSnapshot();
      })
      .subscribe();
    channelRef.current = channel;

    const interval = window.setInterval(recomputeSnapshot, 500);
    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      channelRef.current = null;
      window.clearInterval(interval);
      // Clean up any pending batch timer
      if (batchTimerRef.current !== null) {
        window.clearTimeout(batchTimerRef.current);
        batchTimerRef.current = null;
      }
    };
  }, [roomId, recomputeSnapshot]);

  const tap = useCallback(() => {
    if (!enabled) return;
    const channel = channelRef.current;
    if (!channel) return;
    const now = Date.now();
    if (now - lastSendRef.current < throttleMs) return;
    lastSendRef.current = now;
    // Accumulate tap into the pending batch
    pendingTapsRef.current = Math.min(pendingTapsRef.current + 1, 10);
    // Schedule a batch flush in 500ms if not already scheduled
    if (batchTimerRef.current === null) {
      batchTimerRef.current = window.setTimeout(() => {
        const count = pendingTapsRef.current;
        pendingTapsRef.current = 0;
        batchTimerRef.current = null;
        if (count > 0 && channelRef.current) {
          void channelRef.current.send({
            type: "broadcast",
            event: "hype:tap",
            payload: { count },
          });
        }
      }, 500);
    }
  }, [enabled, throttleMs]);

  return { snapshot, tap };
}

export default useHypeMeter;

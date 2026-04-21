/**
 * Throttle and debounce utilities for Supabase Realtime optimization.
 *
 * - throttle: ensures a callback runs at most once per `delayMs`.
 * - debounce: delays execution until `delayMs` of silence.
 * - debouncedBroadcast: batches broadcast sends so only the latest payload
 *   for a given channel+event pair is sent per interval.
 */

/**
 * Returns a throttled version of `fn` that executes at most once per `delayMs`.
 * Uses trailing-edge: the last call within a window is guaranteed to fire.
 */
export function throttle<T extends (...args: any[]) => void>(fn: T, delayMs: number): T & { cancel: () => void } {
  let lastRun = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = ((...args: Parameters<T>) => {
    lastArgs = args;
    const now = Date.now();
    const remaining = delayMs - (now - lastRun);

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastRun = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        lastRun = Date.now();
        timer = null;
        if (lastArgs) fn(...lastArgs);
      }, remaining);
    }
  }) as T & { cancel: () => void };

  throttled.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    lastArgs = null;
  };

  return throttled;
}

/**
 * Returns a debounced version of `fn` that only fires after `delayMs`
 * of inactivity.
 */
export function debounce<T extends (...args: any[]) => void>(fn: T, delayMs: number): T & { cancel: () => void; flush: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delayMs);
  }) as T & { cancel: () => void; flush: () => void };

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    lastArgs = null;
  };

  debounced.flush = () => {
    if (timer && lastArgs) {
      clearTimeout(timer);
      timer = null;
      fn(...lastArgs);
      lastArgs = null;
    }
  };

  return debounced;
}

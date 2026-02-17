/**
 * Client-side rate limiter using a sliding window approach.
 * Tracks timestamps of recent actions and rejects new ones
 * if the count exceeds maxActions within windowMs.
 */
export interface RateLimiter {
  canAct(): boolean;
  reset(): void;
  remaining(): number;
}

export function createRateLimiter(maxActions: number, windowMs: number): RateLimiter {
  const timestamps: number[] = [];

  function prune() {
    const cutoff = Date.now() - windowMs;
    while (timestamps.length > 0 && timestamps[0] < cutoff) {
      timestamps.shift();
    }
  }

  return {
    canAct(): boolean {
      prune();
      if (timestamps.length >= maxActions) {
        return false;
      }
      timestamps.push(Date.now());
      return true;
    },

    reset(): void {
      timestamps.length = 0;
    },

    remaining(): number {
      prune();
      return Math.max(0, maxActions - timestamps.length);
    },
  };
}

import { useEffect, useMemo, useState } from "react";

const DEFAULT_TICK_MS = 100;

export interface CountdownState {
  seconds: number;
  milliseconds: number;
  isExpired: boolean;
}

const computeState = (endTime?: string): CountdownState => {
  if (!endTime) {
    return { seconds: 0, milliseconds: 0, isExpired: true };
  }
  const end = new Date(endTime).getTime();
  const now = Date.now();
  const diff = Math.max(end - now, 0);
  return {
    seconds: Math.floor(diff / 1000),
    milliseconds: diff,
    isExpired: diff <= 0,
  };
};

export function useCountdown(endTime?: string, tickMs = DEFAULT_TICK_MS) {
  const [state, setState] = useState<CountdownState>(() =>
    computeState(endTime),
  );

  useEffect(() => {
    setState(computeState(endTime));
    if (!endTime) return;
    const interval = window.setInterval(() => {
      setState((prev) => {
        const next = computeState(endTime);
        if (next.isExpired && prev.isExpired) {
          window.clearInterval(interval);
        }
        return next;
      });
    }, tickMs);
    return () => window.clearInterval(interval);
  }, [endTime, tickMs]);

  return useMemo(() => state, [state]);
}

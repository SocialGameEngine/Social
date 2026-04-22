import { useEffect, useRef, useState } from "react";
import { useCountdown } from "@social/ui";

export interface UseTimerWarningOptions {
  /** Seconds-remaining threshold at which to enter the "warning" state. Default 10. */
  warnAtSeconds?: number;
  /** Fire a vibration buzz once on entering the warning state. Default true. */
  vibrate?: boolean;
  /** ms for the vibrate pulse. */
  vibrateMs?: number;
}

export interface UseTimerWarningResult {
  /** True while `secondsLeft <= warnAtSeconds` and the timer is still active. */
  isWarning: boolean;
  /** True during the final 5 seconds — callers can escalate styling (e.g. faster pulse). */
  isUrgent: boolean;
  /** Seconds remaining (float, 1-decimal precision). 0 when inactive. */
  secondsLeft: number;
}

/**
 * Drives the shared "time is running out" UX cue: an integer-seconds window
 * where RoomPage borders pulse red, TV flashes an urgency tint, and one haptic
 * buzz fires when the warning first triggers. Consumes a server-authoritative
 * ISO `phaseEndsAt` string so every client stays in sync.
 */
export function useTimerWarning(
  endTime: string | null | undefined,
  { warnAtSeconds = 10, vibrate = true, vibrateMs = 200 }: UseTimerWarningOptions = {},
): UseTimerWarningResult {
  const countdown = useCountdown(endTime ?? undefined);
  const secondsLeft = Math.max(0, countdown.milliseconds / 1000);
  const isActive = Boolean(endTime) && secondsLeft > 0;

  const isWarning = isActive && secondsLeft <= warnAtSeconds;
  const isUrgent = isActive && secondsLeft <= 5;

  const [latched, setLatched] = useState(false);
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const key = endTime ?? "";
    if (lastKeyRef.current !== key) {
      lastKeyRef.current = key;
      setLatched(false);
    }
  }, [endTime]);

  useEffect(() => {
    if (!isWarning || latched) return;
    setLatched(true);
    if (vibrate && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(vibrateMs);
      } catch {
        // navigator.vibrate throws in some browsers on denied permission — ignore.
      }
    }
  }, [isWarning, latched, vibrate, vibrateMs]);

  return { isWarning, isUrgent, secondsLeft };
}

export default useTimerWarning;

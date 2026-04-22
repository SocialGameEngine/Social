import { useMemo } from "react";
import { motion } from "framer-motion";
import { useCountdown } from "@social/ui";

export interface CountdownRingProps {
  /** ISO timestamp when the current phase ends (server-authoritative). */
  endTime?: string | null;
  /** Total seconds the phase runs for (needed so we know what 100% looks like). */
  totalSeconds: number;
  /** Outer diameter in px. Stroke scales proportionally. */
  size?: number;
  /** Minimum stroke width in px. */
  strokeWidth?: number;
  /** Hide everything when not actively ticking. */
  hideWhenIdle?: boolean;
  /** Optional className for the outer wrapper. */
  className?: string;
}

const CLOCK_MIN_STROKE = 12;

export function CountdownRing({
  endTime,
  totalSeconds,
  size = 320,
  strokeWidth,
  hideWhenIdle = true,
  className,
}: CountdownRingProps) {
  const countdown = useCountdown(endTime ?? undefined);
  const secondsLeft = Math.max(0, countdown.milliseconds / 1000);
  const isActive = Boolean(endTime) && totalSeconds > 0 && secondsLeft > 0;

  const stroke = Math.max(strokeWidth ?? Math.round(size * 0.06), CLOCK_MIN_STROKE);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useMemo(() => {
    if (!isActive) return 0;
    return Math.min(1, Math.max(0, secondsLeft / totalSeconds));
  }, [isActive, secondsLeft, totalSeconds]);

  // Color ramp: calm cyan/white (>10s) -> amber (5-10s) -> urgent red (<=5s)
  const urgencyTier: "calm" | "warn" | "urgent" = secondsLeft > 10 ? "calm" : secondsLeft > 5 ? "warn" : "urgent";
  const ringColor = urgencyTier === "urgent" ? "#ff3b3b" : urgencyTier === "warn" ? "#ff9f0a" : "#67e8f9";
  const glowRgb = urgencyTier === "urgent" ? "255,59,59" : urgencyTier === "warn" ? "255,159,10" : "103,232,249";

  // Pulse rate (seconds per cycle): slower when calm, faster as urgency climbs.
  const pulseDuration = urgencyTier === "urgent" ? 0.4 : urgencyTier === "warn" ? 0.9 : 1.8;

  const showDigits = isActive && secondsLeft <= 5;

  if (hideWhenIdle && !isActive) return null;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      role="timer"
      aria-live="assertive"
      aria-label={`Time remaining ${Math.ceil(secondsLeft)} seconds`}
      data-urgency={urgencyTier}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)", overflow: "visible" }}
        animate={{ filter: [`drop-shadow(0 0 10px rgba(${glowRgb},0.35))`, `drop-shadow(0 0 22px rgba(${glowRgb},0.7))`, `drop-shadow(0 0 10px rgba(${glowRgb},0.35))`] }}
        transition={{ duration: pulseDuration, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </motion.svg>

      {showDigits && (
        <motion.span
          key={Math.ceil(secondsLeft)}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            position: "absolute",
            fontSize: Math.round(size * 0.55),
            fontWeight: 900,
            lineHeight: 1,
            color: ringColor,
            textShadow: `0 0 24px rgba(${glowRgb},0.8)`,
            fontVariantNumeric: "tabular-nums",
            filter: "saturate(1.2)",
          }}
        >
          {Math.ceil(secondsLeft)}
        </motion.span>
      )}
    </div>
  );
}

export default CountdownRing;

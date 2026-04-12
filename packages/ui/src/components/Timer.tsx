import { useCountdown } from "../shared/hooks/useCountdown";
import { clsx } from "clsx";
import type { ReactNode } from "react";

interface TimerProps {
  endTime?: string;
  label?: ReactNode;
  size?: "sm" | "md" | "lg";
  isDark?: boolean;
  paused?: boolean;
  pausedSeconds?: number;
  position?: "fixed" | "inline";
  showCriticalBar?: boolean;
}

export function Timer({
  endTime,
  label,
  size = "lg",
  isDark: _isDark = false,
  paused = false,
  pausedSeconds,
  position = "fixed",
  showCriticalBar = true,
}: TimerProps) {
  const countdown = useCountdown(paused ? undefined : endTime);
  // When paused, ALWAYS use pausedSeconds to prevent background countdown
  const secondsLeft = paused
    ? (pausedSeconds ?? 0)
    : Math.max(0, Math.ceil(countdown.milliseconds / 1000));
  // Only show "Paused" if explicitly paused AND we have valid pausedSeconds
  const secondsDisplay = paused && pausedSeconds != null ? "Paused" : secondsLeft;
  const isCritical = !paused && secondsLeft > 0 && secondsLeft <= 10;
  const shouldShowCriticalBar =
    showCriticalBar && !paused && secondsLeft > 0 && secondsLeft <= 30;
  const criticalBarProgress = Math.min(1, Math.max(0, secondsLeft / 30));
  const isFinalSeconds = !paused && secondsLeft > 0 && secondsLeft <= 5;
  const isDone = !paused && secondsLeft <= 0;

  const sizeClass = clsx(
    size === "sm" && "text-xs",
    size === "md" && "text-sm",
    size === "lg" && "text-base",
  );

  const labelSizeClass = clsx(
    size === "sm" && "text-[0.65rem]",
    size === "md" && "text-[0.7rem]",
    size === "lg" && "text-[0.75rem]",
  );

  return (
    <>
      <style>{`
        @keyframes social-timer-tick {
          0%, 100% { transform: scale(1.4); }
          50% { transform: scale(1.55); }
        }
        @keyframes social-critical-bar-pulse {
          0%, 100% { box-shadow: 0 0 18px rgba(255, 59, 59, 0.45); opacity: 0.9; }
          50% { box-shadow: 0 0 30px rgba(255, 115, 0, 0.6); opacity: 1; }
        }
        @keyframes social-critical-bar-flicker {
          0% { opacity: 1; }
          50% { opacity: 0.65; }
          100% { opacity: 1; }
        }
      `}</style>
      {shouldShowCriticalBar ? (
        <div className="fixed left-0 right-0 top-0 z-50 pointer-events-none">
          <div
            className="h-2 w-full overflow-hidden rounded-full"
            style={{
              background: "rgba(0,0,0,0.2)",
            }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${criticalBarProgress * 100}%`,
                background: "linear-gradient(90deg, #ff3b3b 0%, #ff7a00 100%)",
                boxShadow: "0 0 20px rgba(255, 59, 59, 0.5)",
                animation: `${isFinalSeconds ? "social-critical-bar-flicker 0.3s infinite" : "social-critical-bar-pulse 1s ease-in-out infinite"}`,
                transition: "width 1s linear",
              }}
            />
          </div>
        </div>
      ) : null}
      <div
        className={clsx(
          position === "fixed"
            ? "fixed right-5 top-4 z-50 flex flex-col items-end gap-1 text-right uppercase tracking-[0.08em] pointer-events-none transition-opacity duration-150"
            : "flex flex-col items-center gap-1 text-center uppercase tracking-[0.08em] transition-opacity duration-150",
          sizeClass,
          isCritical
            ? "opacity-100 text-red-500 animate-[social-timer-tick_1s_steps(1)_infinite]"
            : "opacity-60 text-white",
          isDone && "opacity-40",
          paused && "opacity-60",
        )}
        role="timer"
        aria-live="assertive"
      >
        {label ? (
          <span className={clsx("font-extrabold", labelSizeClass)}>
            {label}
          </span>
        ) : null}
        <span
          className="font-black leading-none"
          style={{
            fontVariantNumeric: "tabular-nums",
            minWidth: "3ch",
            display: "inline-block",
            textAlign: "right",
          }}
        >
          {typeof secondsDisplay === "string" ? secondsDisplay : `${secondsDisplay}s`}
        </span>
      </div>
    </>
  );
}

export default Timer;

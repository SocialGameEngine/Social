import { useCountdown } from "../shared/hooks/useCountdown";
import { clsx } from "clsx";
import type { ReactNode } from "react";

interface TimerProps {
  endTime?: string;
  label?: ReactNode;
  size?: "sm" | "md" | "lg";
  isDark?: boolean;
  paused?: boolean;
}

export function Timer({
  endTime,
  label,
  size = "lg",
  isDark = false,
  paused = false,
}: TimerProps) {
  const countdown = useCountdown(paused ? undefined : endTime);
  const secondsLeft = Math.max(0, Math.ceil(countdown.milliseconds / 1000));
  const secondsDisplay = paused ? "Paused" : secondsLeft;
  const isLowTime = !paused && secondsLeft > 0 && secondsLeft <= 15;

  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center px-6 py-4 text-center transition-all duration-200 rounded-2xl relative",
        size === "sm" && "px-4 py-3 text-lg",
        size === "md" && "px-5 py-4 text-2xl",
        size === "lg" && "px-6 py-5 text-4xl",
        isLowTime 
          ? "animate-pulse bg-red-500/20 border-2 border-red-500/50 shadow-lg shadow-red-500/30"
          : isDark 
            ? "bg-slate-800/90 border border-cyan-400/30 shadow-lg shadow-cyan-400/20"
            : "bg-white border border-slate-200 shadow-md",
      )}
      role="timer"
      aria-live="assertive"
    >
      {label ? (
        <span className={`text-xs font-semibold uppercase tracking-wide ${
          !isDark 
            ? (isLowTime ? 'text-red-600' : 'text-slate-500')
            : (isLowTime ? 'text-red-400' : 'text-cyan-300 neon-glow-cyan-light')
        }`}>
          {label}
        </span>
      ) : null}
      <span 
        className={`font-black leading-none transition-all duration-200 ${
          !isDark 
            ? (isLowTime ? 'font-bold' : 'text-slate-900')
            : (isLowTime ? 'drop-shadow-lg font-bold' : 'text-pink-400 pulse-neon')
        } ${isLowTime ? 'animate-pulse' : ''}`}
        style={isLowTime ? { color: !isDark ? '#dc2626' : '#f87171', fontWeight: 'bold' } : {}}
      >
        {typeof secondsDisplay === 'string' ? secondsDisplay : `${secondsDisplay}s`}
      </span>
    </div>
  );
}

export default Timer;

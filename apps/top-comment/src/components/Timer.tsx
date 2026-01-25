import { useCountdown } from "../shared/hooks/useCountdown";
import { clsx } from "clsx";
import type { ReactNode } from "react";

interface TimerProps {
  endTime?: string;
  label?: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
}

export function Timer({
  endTime,
  label,
  size = "lg",
  variant = "dark",
}: TimerProps) {
  const countdown = useCountdown(endTime);
  const secondsDisplay = Math.max(0, Math.ceil(countdown.milliseconds / 1000));

  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center rounded-3xl px-6 py-4 text-center shadow-inner transition-colors",
        variant === "dark"
          ? "bg-slate-900 text-white"
          : "bg-white text-slate-900",
        size === "sm" && "px-4 py-3 text-lg",
        size === "md" && "px-5 py-4 text-2xl",
        size === "lg" && "px-6 py-5 text-4xl",
      )}
      role="timer"
      aria-live="assertive"
    >
      {label ? (
        <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
          {label}
        </span>
      ) : null}
      <span className="font-black leading-none">{secondsDisplay}s</span>
    </div>
  );
}

export default Timer;

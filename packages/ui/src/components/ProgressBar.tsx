import { useCountdown } from "../shared/hooks/useCountdown";

interface ProgressBarProps {
  endTime?: string;
  totalSeconds: number;
  variant?: "brand" | "neutral";
  isDark?: boolean;
  paused?: boolean;
}

export function ProgressBar({
  endTime,
  totalSeconds,
  variant = "brand",
  isDark = false,
  paused = false,
}: ProgressBarProps) {
  const { milliseconds } = useCountdown(paused ? undefined : endTime, 200);
  const totalMs = totalSeconds * 1000;
  const percentage = paused
    ? 100 // Show full bar when paused
    : totalMs === 0 ? 0 : Math.min(100, (milliseconds / totalMs) * 100);
  const secondsLeft = Math.max(0, Math.ceil(milliseconds / 1000));
  const isLowTime = !paused && secondsLeft > 0 && secondsLeft <= 15;

  return (
    <div className={`h-2 w-full rounded-full ${
      !isDark 
        ? (isLowTime ? 'bg-red-200' : 'bg-slate-200') 
        : (isLowTime ? 'bg-red-900/50' : 'bg-slate-800/70 shadow-cyan-400/25')
    }`}>
      <div
        className={`h-full rounded-full transition-all duration-200 ${
          paused
            ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-lg shadow-amber-400/50'
            : isLowTime
              ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/50 animate-pulse'
              : !isDark
                ? (variant === "brand" ? "bg-brand-primary" : "bg-slate-900")
                : "bg-gradient-to-r from-cyan-400 to-cyan-500 shadow-lg shadow-cyan-400/50"
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export default ProgressBar;

import { useCountdown } from "../shared/hooks/useCountdown";

interface ProgressBarProps {
  endTime?: string;
  totalSeconds: number;
  variant?: "brand" | "neutral";
}

export function ProgressBar({
  endTime,
  totalSeconds,
  variant = "brand",
}: ProgressBarProps) {
  const { milliseconds } = useCountdown(endTime, 200);
  const totalMs = totalSeconds * 1000;
  const percentage =
    totalMs === 0 ? 0 : Math.min(100, (milliseconds / totalMs) * 100);

  return (
    <div className="h-2 w-full rounded-full bg-slate-200">
      <div
        className={`h-full rounded-full transition-all duration-200 ${
          variant === "brand" ? "bg-brand-primary" : "bg-slate-900"
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export default ProgressBar;

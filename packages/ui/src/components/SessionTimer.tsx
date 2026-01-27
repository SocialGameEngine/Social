import { Timer } from "./Timer";
import { ProgressBar } from "./ProgressBar";

interface SessionTimerProps {
  endTime?: string;
  totalSeconds: number;
  paused?: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
  showProgressBar?: boolean;
  variant?: "brand" | "neutral";
  isDark?: boolean;
  position?: "fixed" | "inline";
  showCriticalBar?: boolean;
}

export function SessionTimer({
  endTime,
  totalSeconds,
  paused = false,
  label,
  size = "lg",
  showProgressBar = false,
  variant = "brand",
  isDark = false,
  position = "fixed",
  showCriticalBar = true,
}: SessionTimerProps) {

  return (
    <div className="space-y-2">
      <Timer
        endTime={endTime}
        label={label}
        size={size}
        isDark={isDark}
        paused={paused}
        position={position}
        showCriticalBar={showCriticalBar}
      />
      {showProgressBar && (
        <ProgressBar
          endTime={endTime}
          totalSeconds={totalSeconds}
          variant={variant}
          isDark={isDark}
          paused={paused}
        />
      )}
    </div>
  );
}

export default SessionTimer;
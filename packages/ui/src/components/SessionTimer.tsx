import { Timer } from "./Timer";
import { ProgressBar } from "./ProgressBar";
import type { ReactNode } from "react";

interface SessionTimerProps {
  endTime?: string;
  totalSeconds: number;
  paused?: boolean;
  pausedSeconds?: number;
  label?: ReactNode;
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
  pausedSeconds,
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
        pausedSeconds={pausedSeconds}
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
          pausedSeconds={pausedSeconds}
        />
      )}
    </div>
  );
}

export default SessionTimer;
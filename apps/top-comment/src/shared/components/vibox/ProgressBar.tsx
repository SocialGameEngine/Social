import React from "react";

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (clientX: number, targetElement: HTMLElement) => void;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  className?: string;
  showTime?: boolean;
}

export const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  onSeek,
  onMouseDown,
  onTouchStart,
  className = "",
  showTime = true,
}) => {
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`w-full ${className}`}>
      <div 
        className="relative w-full h-2 bg-[var(--color-player-background)]/50 rounded-full cursor-pointer overflow-hidden"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onClick={(e) => onSeek(e.clientX, e.currentTarget)}
      >
        <div 
          className={`h-full rounded-full transition-all relative [--tw-bg-opacity:1] bg-[var(--color-button-primary)]`}
          style={{ width: `${progressPercentage}%` }}
        >
          <div className={`absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full shadow-lg [--tw-bg-opacity:1] bg-[var(--color-button-primary)]`} />
        </div>
      </div>
      
      {showTime && (
        <div className={`flex justify-between text-xs mt-1 [--tw-text-opacity:0.8] text-[var(--color-text-secondary)]`}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
};

import React from "react";
import { PlayIcon, PauseIcon } from "../icons/VIBoxIcons";

interface PlayerControlsProps {
  isPlaying: boolean;
  isDark: boolean;
  tracks: any[];
  onTogglePlayPause: () => void;
  onPlayNext: () => void;
  onPlayPrevious: () => void;
  size?: "small" | "medium" | "large";
  showSkipButtons?: boolean;
  className?: string;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  isDark,
  tracks,
  onTogglePlayPause,
  onPlayNext,
  onPlayPrevious,
  size = "medium",
  showSkipButtons = true,
  className = "",
}) => {
  const getButtonSizes = () => {
    switch (size) {
      case "small":
        return { play: "w-5 h-5", skip: "w-4 h-4", container: "w-8 h-8" };
      case "large":
        return { play: "w-6 h-6", skip: "w-6 h-6", container: "w-16 h-16" };
      default:
        return { play: "w-6 h-6", skip: "w-5 h-5", container: "w-12 h-12" };
    }
  };

  const sizes = getButtonSizes();

  const playButtonClass = size === "large" 
    ? `w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 transition-transform [--tw-bg-opacity:1] bg-[var(--color-button-primary)] text-[var(--color-vibox-button-play-text)] svg-glow-primary`
    : `${sizes.container} rounded-full flex items-center justify-center [--tw-text-opacity:1] text-[var(--color-button-primary)] hover:[--tw-text-opacity:0.8] transition-opacity svg-glow-primary`;

  const skipButtonClass = `${sizes.container} rounded-full flex items-center justify-center bg-[var(--color-card-background)] [--tw-text-opacity:1] text-[var(--color-button-primary)] opacity-70 hover:opacity-100 disabled:opacity-30 transition-all svg-glow-primary`;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showSkipButtons && (
        <button
          onClick={onPlayPrevious}
          disabled={tracks.length <= 1}
          className={skipButtonClass}
        >
          <svg className={sizes.skip} viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
          </svg>
        </button>
      )}
      
      <button
        onClick={onTogglePlayPause}
        className={playButtonClass}
      >
        {isPlaying ? (
          <PauseIcon className={sizes.play} />
        ) : (
          <PlayIcon className={sizes.play} />
        )}
      </button>
      
      {showSkipButtons && (
        <button
          onClick={onPlayNext}
          disabled={tracks.length <= 1}
          className={skipButtonClass}
        >
          <svg className={sizes.skip} viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
          </svg>
        </button>
      )}
    </div>
  );
};

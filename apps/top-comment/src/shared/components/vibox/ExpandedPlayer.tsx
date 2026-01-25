import React from "react";
import { ChevronDownIcon } from "../icons/VIBoxIcons";
import { PlayerControls } from "./PlayerControls";
import { ProgressBar } from "./ProgressBar";
import type { Track } from "../../types/vibox";

interface ExpandedPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isDark: boolean;
  tracks: Track[];
  queue: any[];
  currentTime: number;
  onTogglePlayPause: () => void;
  onPlayNext: () => void;
  onPlayPrevious: () => void;
  onSeek: (clientX: number, targetElement: HTMLElement) => void;
  onProgressMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onProgressTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  onClose: () => void;
}

export const ExpandedPlayer: React.FC<ExpandedPlayerProps> = ({
  currentTrack,
  isPlaying,
  isDark,
  tracks,
  queue,
  currentTime,
  onTogglePlayPause,
  onPlayNext,
  onPlayPrevious,
  onSeek,
  onProgressMouseDown,
  onProgressTouchStart,
  onClose,
}) => {
  return (
    <div className="flex flex-col min-h-[100dvh] md:min-h-[700px]">
      {/* Expanded Player Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center [--tw-text-opacity:0.8] text-[var(--color-vibox-button-primary)] opacity-70 hover:opacity-100 transition-opacity svg-glow-primary ml-12"
          aria-label="Collapse"
        >
          <div className="flex items-center svg-glow-primary">
            <ChevronDownIcon className="w-8 h-8 mr-1 text-[var(--color-vibox-button-primary)]" />
            <span className="text-sm font-medium">Collapse</span>
          </div>
        </button>
      </div>

      {/* Track Info and Queue */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-4 sm:px-6 max-w-screen-md mx-auto w-full py-4">
          {currentTrack && (
            <div className="mb-8">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-[var(--color-vibox-card-background)] to-[var(--color-vibox-card-background)]/50 flex items-center justify-center mb-6 shadow-2xl">
                  <div className="w-24 h-24 rounded-full [--tw-bg-opacity:0.2] bg-[var(--color-vibox-button-primary)] flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full [--tw-bg-opacity:0.8] bg-[var(--color-vibox-button-primary)] animate-pulse" />
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold [--tw-text-opacity:1] text-[var(--color-vibox-text-primary)] mb-2">
                  {currentTrack.title}
                </h2>
                <p className="text-lg [--tw-text-opacity:0.8] text-[var(--color-vibox-text-secondary)]">
                  {currentTrack.artist}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <ProgressBar
                  currentTime={currentTime}
                  duration={0} // Will be updated with actual duration
                  onSeek={onSeek}
                  onMouseDown={onProgressMouseDown}
                  onTouchStart={onProgressTouchStart}
                  showTime={true}
                />
              </div>

              {/* Expanded Controls */}
              <div className="flex items-center justify-center gap-6 mb-8">
                <PlayerControls
                  isPlaying={isPlaying}
                  isDark={isDark}
                  tracks={tracks}
                  onTogglePlayPause={onTogglePlayPause}
                  onPlayNext={onPlayNext}
                  onPlayPrevious={onPlayPrevious}
                  size="large"
                  showSkipButtons={true}
                />
              </div>
            </div>
          )}

          {/* Queue Section */}
          {queue.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold [--tw-text-opacity:1] text-[var(--color-vibox-text-primary)] mb-4">
                Up Next ({queue.length})
              </h3>
              <div className="space-y-2">
                {queue.slice(0, 10).map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-[var(--color-vibox-card-background)]/50 backdrop-blur-sm border border-[var(--color-vibox-card-border)]/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full [--tw-bg-opacity:0.1] bg-[var(--color-vibox-button-primary)] flex items-center justify-center text-sm [--tw-text-opacity:0.8] text-[var(--color-vibox-button-primary)]">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="[--tw-text-opacity:1] text-[var(--color-vibox-text-primary)] font-medium truncate">
                          {item.track_title}
                        </div>
                        <div className="[--tw-text-opacity:0.7] text-[var(--color-vibox-text-secondary)] text-sm truncate">
                          {item.track_artist}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className={`bg-[var(--color-vibox-player-background)]/85 backdrop-blur-2xl pb-[env(safe-area-inset-bottom)]`}>
        <div className={`h-16 flex items-center justify-end px-4`}>
          <span className="[--tw-text-opacity:0.6] text-[var(--color-vibox-text-secondary)] text-xs">
            VIBox powered by Söcial
          </span>
        </div>
      </div>
    </div>
  );
};

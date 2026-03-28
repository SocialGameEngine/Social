import React from "react";
import { PlayIcon, PauseIcon, TrashIcon, ListIcon } from "../icons/VIBoxIcons";
import type { Track, ViboxQueueItem } from "../../types/vibox";

interface TrackListProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: ViboxQueueItem[];
  onPlayTrack: (track: Track) => void;
  onTogglePlayPause: () => void;
  onAddToQueue: (track: Track) => void;
  onRemoveFromQueue: (itemId: string) => void;
  onRemoveTrack: (trackId: string) => void;
  mode: "host" | "team";
  className?: string;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  queue,
  onPlayTrack,
  onTogglePlayPause,
  onAddToQueue,
  onRemoveFromQueue,
  onRemoveTrack,
  mode,
  className = "",
}) => {
  const renderTrackItem = (track: Track) => (
    <div
      key={track.id}
      className={`p-3 rounded-lg bg-[var(--color-card-background)]/50 backdrop-blur-sm border border-[var(--color-card-border)]/20 hover:bg-[var(--color-card-hover)] transition-all ${
        currentTrack?.id === track.id ? 'ring-2 ring-[var(--color-button-primary)]/50' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={currentTrack?.id === track.id ? onTogglePlayPause : () => onPlayTrack(track)}
          className="[--tw-text-opacity:1] text-[var(--color-button-primary)] hover:[--tw-text-opacity:0.8] transition-opacity svg-glow-primary"
        >
          {currentTrack?.id === track.id && isPlaying ? (
            <PauseIcon className="w-5 h-5" />
          ) : (
            <PlayIcon className="w-5 h-5" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="[--tw-text-opacity:1] text-[var(--color-text-primary)] font-medium truncate">
            {track.title}
          </div>
          <div className="[--tw-text-opacity:0.7] text-[var(--color-text-secondary)] text-sm truncate">
            {track.artist}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddToQueue(track)}
            className="[--tw-text-opacity:1] text-[var(--color-button-primary)] hover:[--tw-text-opacity:0.8] transition-opacity svg-glow-primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="13" y2="6" />
              <line x1="3" y1="10" x2="13" y2="10" />
              <line x1="3" y1="14" x2="9" y2="14" />
              <line x1="17" y1="11" x2="17" y2="17" />
              <line x1="14" y1="14" x2="20" y2="14" />
            </svg>
          </button>
          
          {track.isPreloaded && (
            <button
              onClick={() => onRemoveTrack(track.id)}
              className="[--tw-text-opacity:0.6] text-[var(--color-text-secondary)] hover:[--tw-text-opacity:1] hover:text-[var(--color-vibox-button-danger)] transition-opacity"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderQueueItem = (item: ViboxQueueItem) => (
    <div
      key={item.id}
      className="p-3 rounded-lg bg-[var(--color-card-background)]/50 backdrop-blur-sm border border-[var(--color-card-border)]/20"
    >
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full [--tw-bg-opacity:1] bg-[var(--color-button-primary)]" />
        
        <div className="flex-1 min-w-0">
          <div className="[--tw-text-opacity:1] text-[var(--color-text-primary)] font-medium truncate">
            {item.track_title}
          </div>
          <div className="[--tw-text-opacity:0.7] text-[var(--color-text-secondary)] text-sm truncate">
            {item.track_artist} • Added by {item.added_by}
          </div>
        </div>

        {mode === "host" && (
          <button
            onClick={() => onRemoveFromQueue(item.id)}
            className="[--tw-text-opacity:0.6] text-[var(--color-text-secondary)] hover:[--tw-text-opacity:1] hover:text-[var(--color-vibox-button-danger)] transition-opacity"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {queue.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <ListIcon className="w-4 h-4 [--tw-text-opacity:0.8] text-[var(--color-text-primary)]" />
            <span className="[--tw-text-opacity:0.8] text-[var(--color-text-primary)] font-medium">
              Queue ({queue.length})
            </span>
          </div>
          <div className="space-y-2">
            {queue.map(renderQueueItem)}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {tracks.map(renderTrackItem)}
      </div>
    </div>
  );
};

/**
 * Vibe-based navigation utilities for VIBox jukebox
 * Handles complex logic for navigating tracks based on vibe hierarchy
 */

import type { Track, VibeHierarchy } from '../types/vibox';

/**
 * Find the next track based on vibe hierarchy
 * @param currentTrack - Currently playing track
 * @param tracks - All available tracks
 * @param vibeHierarchy - Vibe hierarchy structure
 * @returns Next track or null if not found
 */
export function getNextTrackByVibe(
  currentTrack: Track,
  tracks: Track[],
  vibeHierarchy: VibeHierarchy
): Track | null {
  const currentTrackFile = currentTrack.url.split('/').pop();
  
  // Find which vibe category the current track is in
  for (const [primaryVibe, primaryData] of Object.entries(vibeHierarchy.vibes)) {
    for (const [secondaryVibe, songs] of Object.entries(primaryData.secondaryVibes)) {
      const songIndex = songs.findIndex(s => s.file === currentTrackFile);
      
      if (songIndex !== -1) {
        // Found the current track, find the next one
        const nextSongIndex = songIndex + 1;
        
        if (nextSongIndex < songs.length) {
          // Next song in same secondary vibe
          const nextSong = songs[nextSongIndex];
          const nextTrack = tracks.find(t => t.url.includes(nextSong.file));
          if (nextTrack) return nextTrack;
        } else {
          // Move to next secondary vibe
          const secondaryVibes = Object.entries(primaryData.secondaryVibes);
          const currentSecondaryIndex = secondaryVibes.findIndex(([sv]) => sv === secondaryVibe);
          const nextSecondaryIndex = currentSecondaryIndex + 1;
          
          if (nextSecondaryIndex < secondaryVibes.length) {
            // Next secondary vibe, first song
            const nextSecondary = secondaryVibes[nextSecondaryIndex][1];
            if (nextSecondary.length > 0) {
              const nextSong = nextSecondary[0];
              const nextTrack = tracks.find(t => t.url.includes(nextSong.file));
              if (nextTrack) return nextTrack;
            }
          } else {
            // Move to next primary vibe
            const primaryVibes = Object.entries(vibeHierarchy.vibes);
            const currentPrimaryIndex = primaryVibes.findIndex(([pv]) => pv === primaryVibe);
            const nextPrimaryIndex = (currentPrimaryIndex + 1) % primaryVibes.length;
            const nextPrimary = primaryVibes[nextPrimaryIndex][1];
            
            // First secondary vibe, first song
            const firstSecondary = Object.entries(nextPrimary.secondaryVibes)[0][1];
            if (firstSecondary.length > 0) {
              const nextSong = firstSecondary[0];
              const nextTrack = tracks.find(t => t.url.includes(nextSong.file));
              if (nextTrack) return nextTrack;
            }
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * Find the previous track based on vibe hierarchy
 * @param currentTrack - Currently playing track
 * @param tracks - All available tracks
 * @param vibeHierarchy - Vibe hierarchy structure
 * @returns Previous track or null if not found
 */
export function getPreviousTrackByVibe(
  currentTrack: Track,
  tracks: Track[],
  vibeHierarchy: VibeHierarchy
): Track | null {
  const currentTrackFile = currentTrack.url.split('/').pop();
  
  // Find which vibe category the current track is in
  for (const [primaryVibe, primaryData] of Object.entries(vibeHierarchy.vibes)) {
    for (const [secondaryVibe, songs] of Object.entries(primaryData.secondaryVibes)) {
      const songIndex = songs.findIndex(s => s.file === currentTrackFile);
      
      if (songIndex !== -1) {
        // Found the current track, find the previous one
        const prevSongIndex = songIndex - 1;
        
        if (prevSongIndex >= 0) {
          // Previous song in same secondary vibe
          const prevSong = songs[prevSongIndex];
          const prevTrack = tracks.find(t => t.url.includes(prevSong.file));
          if (prevTrack) return prevTrack;
        } else {
          // Move to previous secondary vibe
          const secondaryVibes = Object.entries(primaryData.secondaryVibes);
          const currentSecondaryIndex = secondaryVibes.findIndex(([sv]) => sv === secondaryVibe);
          const prevSecondaryIndex = currentSecondaryIndex - 1;
          
          if (prevSecondaryIndex >= 0) {
            // Previous secondary vibe, last song
            const prevSecondary = secondaryVibes[prevSecondaryIndex][1];
            if (prevSecondary.length > 0) {
              const prevSong = prevSecondary[prevSecondary.length - 1];
              const prevTrack = tracks.find(t => t.url.includes(prevSong.file));
              if (prevTrack) return prevTrack;
            }
          } else {
            // Move to previous primary vibe
            const primaryVibes = Object.entries(vibeHierarchy.vibes);
            const currentPrimaryIndex = primaryVibes.findIndex(([pv]) => pv === primaryVibe);
            const prevPrimaryIndex = currentPrimaryIndex === 0 ? primaryVibes.length - 1 : currentPrimaryIndex - 1;
            const prevPrimary = primaryVibes[prevPrimaryIndex][1];
            
            // Last secondary vibe, last song
            const secondaryVibes = Object.entries(prevPrimary.secondaryVibes);
            const lastSecondary = secondaryVibes[secondaryVibes.length - 1][1];
            if (lastSecondary.length > 0) {
              const prevSong = lastSecondary[lastSecondary.length - 1];
              const prevTrack = tracks.find(t => t.url.includes(prevSong.file));
              if (prevTrack) return prevTrack;
            }
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * Get fallback next track (linear order)
 * @param currentTrack - Currently playing track
 * @param tracks - All available tracks
 * @returns Next track
 */
export function getNextTrackLinear(currentTrack: Track, tracks: Track[]): Track {
  const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
  const nextIndex = (currentIndex + 1) % tracks.length;
  return tracks[nextIndex];
}

/**
 * Get fallback previous track (linear order)
 * @param currentTrack - Currently playing track
 * @param tracks - All available tracks
 * @returns Previous track
 */
export function getPreviousTrackLinear(currentTrack: Track, tracks: Track[]): Track {
  const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
  const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1;
  return tracks[prevIndex];
}

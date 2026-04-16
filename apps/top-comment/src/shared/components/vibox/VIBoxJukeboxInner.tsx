import { useState, useRef, useEffect, useCallback } from "react";
import { Modal } from "@social/ui";
import { useVIBoxTheme } from "./ThemeProvider";
import { supabase } from "../../../supabase/client";
import { debouncedBroadcast, immediateBroadcast, flushAndStop } from "../../utils/debouncedBroadcast";
import type { ViboxQueueItem, ViboxQueueInsert, Track, TrackMetadata, VibeHierarchy } from "../../types/vibox";
import { viboxApi } from "../../api/vibox";
import {
  PlayIcon,
  PauseIcon,
  MusicIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  TrashIcon,
  ListIcon,
  SparklesIcon
} from "../icons/VIBoxIcons";
import { log } from "../../utils/logger";
import { getNextTrackByVibe, getPreviousTrackByVibe, getNextTrackLinear, getPreviousTrackLinear } from "../../utils/vibeNavigation";
import { handleQueueError, handleQueueSuccess, handleQueueInfo } from "../../utils/errorHandlers";
import { useVoting } from '../../contexts/ViboxVotingContext';
import { useRealtimeQueue } from '../../hooks/vibox/useRealtimeQueue';

interface VIBoxJukeboxProps {
  isOpen: boolean;
  onClose: () => void;
  toast: (options: { title: string; variant: "success" | "error" | "info" }) => void;
  mode?: "host" | "team";
  allowUploads?: boolean;
  room?: any;
  memberships?: any[];
}

export function VIBoxJukeboxInner({ 
  isOpen, 
  onClose, 
  toast, 
  mode = "host",
  allowUploads = true,
  room,
  memberships
}: VIBoxJukeboxProps) {
  const { isDark } = useVIBoxTheme();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [vibeHierarchy, setVibeHierarchy] = useState<VibeHierarchy | null>(null);
  const [trackMetadata, setTrackMetadata] = useState<Map<string, TrackMetadata>>(new Map());
  const [expandedPrimaryVibes, setExpandedPrimaryVibes] = useState<Set<string>>(new Set());
    const [selectedPrimaryVibe, setSelectedPrimaryVibe] = useState<string | null>(null);
  const [expandedPlayer, setExpandedPlayer] = useState(false);
  const [viewMode, setViewMode] = useState<'vibes' | 'all'>('vibes');
  const [queue, setQueue] = useState<ViboxQueueItem[]>([]);
    const [currentTrackInfo, setCurrentTrackInfo] = useState<{
    track_id: string;
    track_title: string;
    track_artist: string;
    track_url: string;
    track_duration?: number;
    track_genre?: string;
    primary_vibe?: string;
    secondary_vibe?: string;
    is_playing: boolean;
    current_time: number;
    started_at: string;
  } | null>(null);
  
  // Use voting context
  const { handleVote, getVoteCount, getUserVote } = useVoting();
  
  // Get room context from props
  const roomId = room?.id;
  const membership = memberships?.find(m => room?.moderatorIds.includes(m.userId) || room?.creatorId === m.userId);
  const membershipId = membership?.id;
  
  const [windowWidth, setWindowWidth] = useState(0);
  const [_bottomPlayerHeight, setBottomPlayerHeight] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomPlayerRef = useRef<HTMLDivElement>(null);
  

  
  // Window resize effect for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Set initial width
    setWindowWidth(window.innerWidth);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  
  useEffect(() => {
    const el = bottomPlayerRef.current;
    if (!el) return;

    const update = () => {
      setBottomPlayerHeight(el.offsetHeight);
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      ro.disconnect();
    };
  }, [expandedPlayer, isOpen]);

  // Use the working realtime queue hook
  const { queue: realtimeQueue } = useRealtimeQueue(roomId);
  
  // Update local queue state when realtime queue changes
  useEffect(() => {
    setQueue(realtimeQueue);
  }, [realtimeQueue]);

  // Load pre-loaded tracks and metadata from public directory on mount
  useEffect(() => {
    const loadPreloadedTracks = async () => {
      try {
        // Load track metadata first
        const metadataResponse = await fetch('/tracks-metadata.json');
        let metadataMap = new Map<string, TrackMetadata>();
        
        log.info('Metadata response', { 
          status: metadataResponse.status, 
          statusText: metadataResponse.statusText,
          url: metadataResponse.url,
          ok: metadataResponse.ok
        });
        
        if (metadataResponse.ok) {
          const responseText = await metadataResponse.text();
          log.info('Metadata response text (first 100 chars)', { text: responseText.substring(0, 100) });
          
          try {
            const metadata = JSON.parse(responseText);
            metadata.tracks.forEach((track: TrackMetadata) => {
              metadataMap.set(track.file, track);
            });
            setTrackMetadata(metadataMap);
            log.info('Loaded metadata', { trackCount: metadataMap.size });
          } catch (parseError) {
            log.error('JSON parse error', { error: parseError, responseText: responseText.substring(0, 200) });
            throw parseError;
          }
        }

        // Load hierarchical vibe structure
        const vibeResponse = await fetch('/vibes-hierarchical.json');
        if (vibeResponse.ok) {
          const vibeData = await vibeResponse.json();
          setVibeHierarchy(vibeData);
          log.info('Loaded vibe hierarchy', { vibeKeys: Object.keys(vibeData.vibes) });
        }

        // Try to fetch the track list from a JSON file
        const response = await fetch('/vibox/data/tracks.json');
        if (response.ok) {
          const audioFiles = await response.json();
          log.info('Loading audio files', { count: audioFiles.length });
          
          const preloadedTracks: Track[] = audioFiles.map((filename: string) => {
            const metadata = trackMetadata.get(filename);
            // Use metadata title if available, otherwise fall back to cleaned filename
            const displayTitle = metadata?.title || filename.replace(/\.[^/.]+$/, "").replace(/_/g, ' ');

            return {
              id: `preloaded-${filename}`,
              title: displayTitle,
              artist: metadata?.artist || 'Söcial',
              duration: 0,
              url: `/vibox/audio/${filename}`,
              isPreloaded: true,
              genre: metadata?.genre,
              primaryVibe: metadata?.primaryVibe,
              secondaryVibe: metadata?.secondaryVibe
            };
          });

          log.info('Created track objects', { count: preloadedTracks.length });
          log.debug('Sample track', { track: preloadedTracks[0] });

          if (preloadedTracks.length > 0) {
            setTracks(prev => [...preloadedTracks, ...prev]);
            toast({ 
              title: `Loaded ${preloadedTracks.length} tracks with vibe metadata`, 
              variant: "info" 
            });
          }
        }
      } catch (error) {
        log.error('Error loading tracks', { 
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    };

    if (isOpen && tracks.length === 0) {
      loadPreloadedTracks();
    }
  }, [isOpen, tracks.length, toast]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      // If there are songs in the queue, play the next one from queue
      if (queue.length > 0) {
        playNextInQueue();
      } else {
        // Otherwise, use vibe-based navigation
        playNext();
      }
    };

    const handleLoadedMetadata = () => {
      // Broadcast actual duration when audio metadata loads
      if (mode === "host" && currentTrackInfo && audio.duration) {
        const updatedTrackInfo = {
          ...currentTrackInfo,
          track_duration: audio.duration,
        };
        
        setCurrentTrackInfo(updatedTrackInfo);
        
        // Broadcast metadata update (non-critical, debounced)
        debouncedBroadcast('vibox-current-track', 'current_track_update', updatedTrackInfo);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [currentTrack, queue]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!allowUploads) return;
    
    const files = event.target.files;
    if (!files) return;
    processFiles(files);
  };

  
  const processFiles = (files: FileList) => {
    const audioFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3')
    );

    if (audioFiles.length === 0) {
      toast({ title: 'No audio files found', variant: 'error' });
      return;
    }

    const newTracks: Track[] = audioFiles.map((file, index) => {
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      const parts = fileName.split(' - ');
      const title = parts[1] || parts[0] || fileName;
      const artist = parts[1] ? parts[0] : 'Unknown Artist';

      return {
        id: `track-${Date.now()}-${index}`,
        title: title.trim(),
        artist: artist.trim(),
        duration: 0, // Will be updated when loaded
        file,
        url: URL.createObjectURL(file),
        isPreloaded: false
      };
    });

    setTracks(prev => [...prev, ...newTracks]);
    toast({ title: `Added ${newTracks.length} track${newTracks.length !== 1 ? 's' : ''}`, variant: "success" });
  };

  // Progress bar drag handling
  const handleProgressSeek = useCallback((clientX: number, targetElement: HTMLElement) => {
    if (!audioRef.current || !currentTrack) return;
    
    const rect = targetElement.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    const newTime = percentage * (audioRef.current.duration || 0);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [audioRef, currentTrack]);

  const handleProgressMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!audioRef.current || !currentTrack) return;
    
    // Initial seek
    handleProgressSeek(e.clientX, e.currentTarget);
    
    // Setup drag listeners
    const handleMouseMove = (moveEvent: MouseEvent) => {
      handleProgressSeek(moveEvent.clientX, e.currentTarget);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleProgressSeek]);

  const handleProgressTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!audioRef.current || !currentTrack) return;
    
    // Initial seek
    handleProgressSeek(e.touches[0].clientX, e.currentTarget);
    
    // Setup drag listeners
    const handleTouchMove = (moveEvent: TouchEvent) => {
      handleProgressSeek(moveEvent.touches[0].clientX, e.currentTarget);
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }, [handleProgressSeek]);

  const togglePrimaryVibe = useCallback((primaryVibe: string) => {
    setSelectedPrimaryVibe(prev => 
      prev === primaryVibe ? null : primaryVibe
    );
    // Also expand the vibe when selected
    setExpandedPrimaryVibes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(primaryVibe)) {
        newSet.delete(primaryVibe);
      } else {
        newSet.add(primaryVibe);
      }
      return newSet;
    });
  }, []);

  const addToQueue = async (track: Track) => {
    try {
      // Validate room context exists
      if (!roomId) {
        toast({ 
          title: 'VIBox requires a room context', 
          variant: 'error' 
        });
        return;
      }
      
      const queueInsert: ViboxQueueInsert = {
        track_id: track.id,
        track_title: track.title,
        track_artist: track.artist,
        track_album: track.album || undefined,
        track_duration_ms: track.duration ? track.duration * 1000 : undefined,
        track_artwork_url: track.artwork || undefined,
        room_id: roomId,
        membership_id: membershipId || undefined,
      };

      const response = await viboxApi.addToQueue(queueInsert);

      if (!response.success) {
        throw new Error(response.error || 'Failed to add to queue');
      }

      handleQueueSuccess(response.message || `Added "${track.title}" to queue`, toast);
    } catch (error) {
      handleQueueError(error, 'add to queue', toast);
    }
  };

  const removeFromQueue = async (queueItemId: string) => {
    try {
      const response = await viboxApi.removeFromQueue(queueItemId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to remove from queue');
      }
    } catch (error) {
      handleQueueError(error, 'remove from queue', toast);
    }
  };

  const clearQueue = async () => {
    try {
      const response = await viboxApi.clearQueue();
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to clear queue');
      }

      handleQueueInfo(response.message || "Queue cleared", toast);
    } catch (error) {
      handleQueueError(error, 'clear queue', toast);
    }
  };

  const playNextInQueue = async () => {
    if (queue.length > 0) {
      const nextItem = queue[0];
      
      // Create a Track object from the queue item
      const track: Track = {
        id: nextItem.track_id,
        title: nextItem.track_title,
        artist: nextItem.track_artist,
        url: nextItem.track_url,
        duration: nextItem.track_duration || 0,
        genre: nextItem.track_genre || undefined,
        primaryVibe: nextItem.primary_vibe || undefined,
        secondaryVibe: nextItem.secondary_vibe || undefined,
        isPreloaded: true,
      };
      
      playTrack(track);
      
      // Mark as played instead of removing
      try {
        const response = await viboxApi.markPlayed(nextItem.id);
        
        if (!response.success) {
          handleQueueError(response.error, 'mark track as played', toast);
        }
      } catch (error) {
        handleQueueError(error, 'mark track as played', toast);
      }
    }
  };

  const playTrack = (track: Track) => {
    if (audioRef.current && track.url) {
      audioRef.current.src = track.url;
      audioRef.current.play();
      setCurrentTrack(track);
      setIsPlaying(true);
      
      // Broadcast current track information to all users
      if (mode === "host") {
        const trackInfo = {
          track_id: track.id,
          track_title: track.title,
          track_artist: track.artist,
          track_url: track.url,
          track_duration: track.duration,
          track_genre: track.genre,
          primary_vibe: track.primaryVibe,
          secondary_vibe: track.secondaryVibe,
          is_playing: true,
          current_time: 0,
          started_at: new Date().toISOString(),
        };
        
        // Update local state for immediate feedback
        setCurrentTrackInfo(trackInfo);
        
        // Broadcast track change immediately (critical user action)
        immediateBroadcast('vibox-current-track', 'current_track_update', trackInfo);
      }
    }
  };

  // Disable body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save original overflow style
      const originalOverflow = document.body.style.overflow;
      
      // Disable scrolling
      document.body.style.overflow = 'hidden';
      
      // Cleanup function to restore scrolling when modal closes
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Listen for current track updates from other users
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase
      .channel('vibox-current-track')
      .on('broadcast', { event: 'current_track_update' }, (payload) => {
        const trackInfo = payload.payload as typeof currentTrackInfo;
        
        if (!trackInfo) return;
        
        // Update current track info for all users
        setCurrentTrackInfo(trackInfo);
        
        // For players (non-hosts), update their local state to match host (but don't play audio)
        if (mode !== "host") {
          // Find the track in the local tracks array
          const track = tracks.find(t => t.id === trackInfo.track_id);
          if (track) {
            setCurrentTrack(track);
            setIsPlaying(trackInfo.is_playing);
            setCurrentTime(trackInfo.current_time);
            
            // Don't play audio on player devices - only sync the visual state
            // Players can see what's playing but audio only plays on host
          }
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [isOpen, mode, tracks]);

  // Broadcast current time regularly from host for real-time progress updates.
  // Uses debouncedBroadcast so actual sends happen at most every 3 seconds
  // instead of every 1 second, reducing egress by ~67% for progress updates.
  useEffect(() => {
    if (!isOpen || mode !== "host" || !currentTrackInfo || !isPlaying) return;

    const interval = setInterval(() => {
      if (audioRef.current && currentTrackInfo) {
        const updatedTrackInfo = {
          ...currentTrackInfo,
          current_time: audioRef.current.currentTime,
          is_playing: isPlaying,
          track_duration: audioRef.current.duration || currentTrackInfo.track_duration,
        };
        
        setCurrentTrackInfo(updatedTrackInfo);
        
        // Debounced: batches sends to reduce egress
        debouncedBroadcast('vibox-current-track', 'current_track_update', updatedTrackInfo);
      }
    }, 1000); // Local state updates every second, broadcasts debounced to 3s

    return () => {
      clearInterval(interval);
      flushAndStop();
    };
  }, [isOpen, mode, currentTrackInfo, isPlaying]);

  
  // Helper function to check if vibe contains current track
  const isVibeActive = (primaryVibe: string, secondaryVibe?: string) => {
    if (!currentTrack) return false;
    
    if (secondaryVibe) {
      return currentTrack.primaryVibe === primaryVibe && currentTrack.secondaryVibe === secondaryVibe;
    }
    
    return currentTrack.primaryVibe === primaryVibe;
  };

  
  const togglePlayPause = () => {
    if (!audioRef.current || !currentTrack) return;

    const newIsPlaying = !isPlaying;
    
    if (newIsPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    
    // Broadcast play/pause state to all users
    if (mode === "host" && currentTrackInfo) {
      const updatedTrackInfo = {
        ...currentTrackInfo,
        is_playing: newIsPlaying,
        current_time: audioRef.current.currentTime,
        track_duration: audioRef.current.duration || currentTrackInfo.track_duration,
      };
      
      // Update local state for immediate feedback
      setCurrentTrackInfo(updatedTrackInfo);
      
      // Immediate broadcast for play/pause (critical user action)
      immediateBroadcast('vibox-current-track', 'current_track_update', updatedTrackInfo);
    }
  };

  const playNext = () => {
    if (!currentTrack || tracks.length === 0) return;
    
    // If we're in vibe mode, follow the vibe order
    if (viewMode === 'vibes' && vibeHierarchy) {
      const nextTrack = getNextTrackByVibe(currentTrack, tracks, vibeHierarchy);
      if (nextTrack) {
        playTrack(nextTrack);
        return;
      }
    }
    
    // Fallback to linear behavior
    const nextTrack = getNextTrackLinear(currentTrack, tracks);
    playTrack(nextTrack);
  };

  
  const playPrevious = () => {
    if (!currentTrack || tracks.length === 0) return;
    
    // If we're in vibe mode, follow the vibe order in reverse
    if (viewMode === 'vibes' && vibeHierarchy) {
      const prevTrack = getPreviousTrackByVibe(currentTrack, tracks, vibeHierarchy);
      if (prevTrack) {
        playTrack(prevTrack);
        return;
      }
    }
    
    // Fallback to linear behavior
    const prevTrack = getPreviousTrackLinear(currentTrack, tracks);
    playTrack(prevTrack);
  };

  const removeTrack = (trackId: string) => {
    if (!allowUploads) return;
    
    const track = tracks.find(t => t.id === trackId);
    
    // Clean up object URL for uploaded files
    if (track?.url && !track.isPreloaded && track.url.startsWith('blob:')) {
      URL.revokeObjectURL(track.url);
    }
    
    setTracks(prev => prev.filter(t => t.id !== trackId));
    if (currentTrack?.id === trackId) {
      setCurrentTrack(null);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    }
  };

  const clearAll = () => {
    if (!allowUploads) return;
    
    // Clean up object URLs for uploaded files
    tracks.forEach(track => {
      if (track.url && !track.isPreloaded && track.url.startsWith('blob:')) {
        URL.revokeObjectURL(track.url);
      }
    });
    
    setTracks(tracks.filter(t => t.isPreloaded));
    setCurrentTrack(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (clientX: number, targetElement: HTMLElement) => {
    const rect = targetElement.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    setVolume(percentage);
  };

  const handleVolumeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Initial volume change
    handleVolumeChange(e.clientX, e.currentTarget);
    
    // Setup drag listeners
    const handleMouseMove = (moveEvent: MouseEvent) => {
      handleVolumeChange(moveEvent.clientX, e.currentTarget);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleVolumeTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Initial volume change
    handleVolumeChange(e.touches[0].clientX, e.currentTarget);
    
    // Setup drag listeners
    const handleTouchMove = (moveEvent: TouchEvent) => {
      handleVolumeChange(moveEvent.touches[0].clientX, e.currentTarget);
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }, []);

  
  return (
    <>
      <audio ref={audioRef} />
      
      <Modal
        open={isOpen}
        onClose={onClose}
        title=""
        isDark={isDark}
      >
        <style>{`
          .flex.items-start.justify-between.gap-4 {
            display: none !important;
          }
          .modal-header {
            display: none !important;
          }
          .modal-title {
            display: none !important;
          }
          .modal-body {
            padding: 0 !important;
            margin: 0 !important;
            margin-top: 0 !important;
          }
          /* Desktop ONLY modal styling */
          @media (min-width: 769px) {
            .ReactModal__Content {
              position: fixed !important;
              top: 50% !important;
              left: 50% !important;
              transform: translate(-50%, -50%) !important;
              padding: 1rem !important;
              max-height: 90vh !important;
              overflow: hidden !important;
              border-radius: 1rem !important;
              margin: 0 !important;
              inset: auto !important;
              right: auto !important;
              bottom: auto !important;
            }
          }
          
          /* Mobile ONLY modal styling - iOS sheet approach */
          @media screen and (max-width: 768px) {
            .ReactModal__Overlay {
              position: fixed !important;
              inset: 0 !important;
              overflow-y: auto !important;
              -webkit-overflow-scrolling: touch !important;
            }
            
            .ReactModal__Content {
              position: relative !important;
              min-height: 100dvh !important;
              height: auto !important;
              max-height: none !important;
              transform: none !important;
              border-radius: 0 !important;
              padding: 0 !important;
              margin: 0 !important;
              top: auto !important;
              left: auto !important;
              right: auto !important;
              bottom: auto !important;
            }
            
            /* Make bottom player sticky instead of absolute */
            .absolute.bottom-0 {
              position: sticky !important;
              bottom: 0 !important;
              top: auto !important;
              left: 0 !important;
              right: 0 !important;
            }
          }
          
          /* iOS-specific: Use relative positioning, not fixed */
          @supports (-webkit-touch-callout: none) {
            @media screen and (max-width: 768px) {
              .ReactModal__Content {
                position: relative !important;
                min-height: 100dvh !important;
              }
            }
          }
          .modal-content {
            padding: 0 !important;
            margin: 0 !important;
          }
          div[class*="modal-content"] {
            padding: 0 !important;
            margin: 0 !important;
          }
          div[class*="modal-content-dark"] {
            padding: 0 !important;
            margin: 0 !important;
          }
          .modal-content-dark {
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            border-radius: 1rem !important;
          }
          .modal-content {
            background: transparent !important;
            border-radius: 1rem !important;
          }
          .modal-body {
            background: transparent !important;
            border-radius: 1rem !important;
          }
          .modal-wrapper {
            padding: 0 !important;
            margin: 0 !important;
            border-radius: 1rem !important;
          }
          .modal-overlay {
            padding: 0 !important;
            margin: 0 !important;
            border-radius: 1rem !important;
          }
          .modal-content {
            background: var(--color-player-background) !important;
          }
          .modal-body {
            background: var(--color-player-background) !important;
          }
          .space-y-2 {
            margin-bottom: 0 !important;
          }
          .space-y-2 > *:last-child {
            margin-bottom: 0 !important;
          }
          .space-y-1 > *:last-child {
            margin-bottom: 0 !important;
          }
          .space-y-2 > * {
            margin-bottom: 0 !important;
          }
          .space-y-1 > * {
            margin-bottom: 0 !important;
          }
          .space-y-2 {
            margin-bottom: 0 !important;
          }
          .space-y-1 {
            margin-bottom: 0 !important;
          }
          .max-h-\[45vh\] {
            margin-bottom: 0 !important;
          }
          .flex-1 {
            margin-bottom: 0 !important;
          }
          .overflow-y-auto {
            margin-bottom: 0 !important;
          }
          .mb-8 {
            margin-bottom: 0 !important;
          }
          .mb-4 {
            margin-bottom: 0 !important;
          }
          .h-full {
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* iOS Safari viewport fix */
          @supports (-webkit-touch-callout: none) {
            .modal-content {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              width: 100vw;
              height: 100vh;
              -webkit-overflow-scrolling: touch;
              overflow-scrolling: touch;
              padding-bottom: 0 !important;
              margin-bottom: 0 !important;
            }
            .modal-body {
              -webkit-overflow-scrolling: touch;
              overflow-scrolling: touch;
              padding-bottom: 0 !important;
              margin-bottom: 0 !important;
            }
            /* Target the main phone container */
            .min-h-\[700px\] {
              margin-bottom: 0 !important;
              padding-bottom: 0 !important;
            }
            .bg-gradient-to-br {
              margin-bottom: 0 !important;
              padding-bottom: 0 !important;
            }
            .overflow-hidden {
              margin-bottom: 0 !important;
              padding-bottom: 0 !important;
            }
            .relative {
              margin-bottom: 0 !important;
              padding-bottom: 0 !important;
            }
            .rounded-lg {
              margin-bottom: 0 !important;
              padding-bottom: 0 !important;
            }
            /* Target the specific track list container */
            .mb-8 {
              margin-bottom: 0 !important;
            }
            .mb-4 {
              margin-bottom: 0 !important;
            }
            .flex-1.overflow-y-auto {
              margin-bottom: 0 !important;
              padding-bottom: 0 !important;
            }
            /* Remove all bottom margins from track list containers */
            .space-y-2 {
              margin-bottom: 0 !important;
            }
            .space-y-1 {
              margin-bottom: 0 !important;
            }
            .max-h-\[45vh\] {
              margin-bottom: 0 !important;
            }
            /* Remove any remaining bottom spacing */
            [class*="mb-"] {
              margin-bottom: 0 !important;
            }
            [class*="space-y"] {
              margin-bottom: 0 !important;
            }
            /* Fix border spacing issue */
            .border-t {
              margin-top: 0 !important;
              padding-top: 0 !important;
            }
          }
                    /* Remove modal card bottom spacing */
          .ReactModal__Content {
            padding-bottom: 0 !important;
            margin-bottom: 0 !important;
          }
          .ReactModal__Overlay {
            padding-bottom: 0 !important;
            margin-bottom: 0 !important;
          }
          /* Remove bottom spacing from main containers */
          .h-full.min-h-\[700px\] {
            padding-bottom: 0 !important;
            margin-bottom: 0 !important;
          }
          .h-full.flex.flex-col {
            padding-bottom: 0 !important;
            margin-bottom: 0 !important;
          }
          div[class*="h-full"] {
            padding: 0 !important;
            margin: 0 !important;
          }
          div[class*="min-h-"] {
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Expanded Player Slide-up/Slide-down Animation */
          .expanded-player {
            transform: translateY(100vh);
            transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease-out;
            opacity: 0;
            pointer-events: none;
            height: 100% !important;
            min-height: 100% !important;
            will-change: transform, opacity;
          }
          .expanded-player.show {
            transform: translateY(0);
            opacity: 1;
            pointer-events: auto;
          }
          .expanded-player.collapsing {
            transform: translateY(100vh);
            opacity: 0;
            pointer-events: none;
          }
          
          /* Force consistent heights */
          .px-4.flex.flex-col.gap-2 {
            max-height: 500px !important;
            height: 500px !important;
          }
          /* Force list heights */
          .space-y-2.max-h-\[800px\] {
            max-height: 200px !important;
            height: 200px !important;
            padding-bottom: 0 !important;
          }
          .space-y-2.max-h-\[600px\] {
            max-height: 200px !important;
            height: 200px !important;
            padding-bottom: 0 !important;
          }
          /* Add space below last element */
          .space-y-2.max-h-\[800px\] .space-y-1:last-child {
            margin-bottom: 200px !important;
          }
          .space-y-2.max-h-\[600px\] .space-y-1:last-child {
            margin-bottom: 200px !important;
          }
          .space-y-2.max-h-\[800px\] button:last-child {
            margin-bottom: 200px !important;
          }
          .space-y-2.max-h-\[600px\] button:last-child {
            margin-bottom: 200px !important;
          }
          /* Add spacer after lists */
          .space-y-2.max-h-\[800px\]:after {
            content: '';
            display: block;
            height: 200px;
          }
          .space-y-2.max-h-\[600px\]:after {
            content: '';
            display: block;
            height: 200px;
          }
          .q-umlaut {
            filter: drop-shadow(0 0 8px var(--color-button-primary));
          }
          .svg-glow-primary {
            filter: drop-shadow(0 0 8px var(--color-button-primary));
          }
          .svg-glow-secondary {
            filter: drop-shadow(0 0 8px var(--color-text-secondary));
          }

          /* VIBox UI Animations */
          
          /* Button animations */
          .vibox-button {
            transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            transform-origin: center;
          }
          .vibox-button:hover {
            transform: scale(1.05);
          }
          .vibox-button:active {
            transform: scale(0.95);
            transition-duration: 0.1s;
          }
          
          /* Track item animations */
          .track-item {
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            transform-origin: center;
          }
          .track-item:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          }
          .track-item.playing {
            animation: playingPulse 2s ease-in-out infinite;
          }
          
          /* Queue item animations */
          .queue-item {
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            transform-origin: left center;
          }
          .queue-item:hover {
            transform: translateX(4px);
            background-color: var(--color-vibox-card-hover) !important;
          }
          .queue-item.entering {
            animation: slideInRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          .queue-item.removing {
            animation: slideOutRight 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          }
          
          /* Vibe category animations */
          .vibe-category {
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          .vibe-category:hover {
            transform: translateX(8px);
          }
          .vibe-category.expanded {
            animation: expandDown 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          /* Player controls animations */
          .player-control {
            transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          .player-control:hover {
            transform: scale(1.1);
            filter: brightness(1.2);
          }
          .player-control:active {
            transform: scale(0.9);
            transition-duration: 0.1s;
          }
          .player-control.playing {
            animation: controlPulse 1s ease-in-out infinite;
          }
          
          /* Progress bar animations */
          .progress-bar {
            transition: width 0.1s linear;
          }
          .progress-bar:hover {
            filter: brightness(1.1);
          }
          
          /* Modal animations */
          .vibox-modal {
            animation: modalFadeIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          .vibox-modal.closing {
            animation: modalFadeOut 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          }
          
          /* Tab animations */
          .vibox-tab {
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          .vibox-tab:hover {
            transform: translateY(-2px);
          }
          .vibox-tab.active {
            animation: tabActivate 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          /* Volume slider animations */
          .volume-slider {
            transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          .volume-slider:hover {
            transform: scale(1.05);
          }
          
          /* Keyframe animations */
          @keyframes playingPulse {
            0%, 100% { 
              opacity: 1; 
              transform: scale(1);
            }
            50% { 
              opacity: 0.8; 
              transform: scale(1.01);
            }
          }
          
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(100px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes slideOutRight {
            from {
              opacity: 1;
              transform: translateX(0);
            }
            to {
              opacity: 0;
              transform: translateX(100px);
            }
          }
          
          @keyframes expandDown {
            from {
              opacity: 0;
              max-height: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              max-height: 500px;
              transform: translateY(0);
            }
          }
          
          @keyframes vibeExpand {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.05);
              opacity: 0.9;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          
          @keyframes vibeCollapse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            100% {
              transform: scale(0.98);
              opacity: 0.8;
            }
          }
          
          @keyframes dropdownOpen {
            from {
              opacity: 0;
              transform: scaleY(0) translateY(-20px);
              max-height: 0;
            }
            to {
              opacity: 1;
              transform: scaleY(1) translateY(0);
              max-height: 1000px;
            }
          }
          
          @keyframes dropdownClose {
            from {
              opacity: 1;
              transform: scaleY(1) translateY(0);
              max-height: 1000px;
            }
            to {
              opacity: 0;
              transform: scaleY(0) translateY(-10px);
              max-height: 0;
            }
          }
          
          @keyframes controlPulse {
            0%, 100% { 
              transform: scale(1); 
            }
            50% { 
              transform: scale(1.05); 
            }
          }
          
          @keyframes modalFadeIn {
            from {
              opacity: 0;
              transform: scale(0.9) translateY(20px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          
          @keyframes modalFadeOut {
            from {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
            to {
              opacity: 0;
              transform: scale(0.9) translateY(20px);
            }
          }
          
          @keyframes tabActivate {
            0% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-4px);
            }
            100% {
              transform: translateY(-2px);
            }
          }
          /* Vibe selection colors */
          .vibe-selected-text {
            color: var(--color-vibox-background-gradient-via);
          }
          .vibe-selected-text-alt {
            color: var(--color-vibox-background-gradient-to);
          }
        `}</style>
        {/* File Input */}
        {allowUploads && (
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/mp3,audio/wav,audio/flac,audio/aac"
            onChange={handleFileUpload}
            className="hidden"
          />
        )}

        {/* Phone Layout */}
        <div className={`vibox-modal h-[90vh] max-h-[700px] min-h-[500px] md:h-[700px] md:max-h-[700px] md:min-h-[700px] flex flex-col bg-gradient-to-br from-[var(--color-vibox-background-gradient-from)] via-[var(--color-vibox-background-gradient-via)] to-[var(--color-vibox-background-gradient-to)] overflow-hidden relative rounded-2xl`}>
          {/* Header Bar */}
          <div className="bg-[var(--color-player-background)]/85 backdrop-blur-xl">
            <div className="flex items-center justify-between px-6 py-2 text-sm [--tw-text-opacity:1] text-[var(--color-text-primary)]">
              <div className="w-8"></div>
              <button
                onClick={onClose}
                className="w-6 h-6 flex items-center justify-center [--tw-text-opacity:1] text-[var(--color-text-primary)] opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Header */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8"></div>
              <div className="flex items-center gap-2">
                {/* VIBox Logo */}
                <img 
                  src="/viboxLogo.png" 
                  alt="VIBox Logo" 
                  className="w-8 h-8"
                />
                <img 
                  src="/viboxLong2.png" 
                  alt="Vibox Jukebox" 
                  className="h-8 w-auto"
                />
              </div>
              <div className="w-8"></div>
            </div>
            <div className="flex items-center justify-center gap-2 w-full">
              {vibeHierarchy && (
                <div className="flex gap-1 rounded-2xl">
                  <button
                    onClick={() => setViewMode('vibes')}
                    className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                      viewMode === 'vibes'
                        ? '[--tw-text-opacity:1] text-[var(--color-button-primary)]'
                        : '[--tw-text-opacity:0.8] text-[var(--color-text-secondary)] hover:[--tw-text-opacity:1] text-[var(--color-text-primary)]'
                    }`}
                  >
                    <SparklesIcon className="w-3 h-3" />
                    <span>Vibes</span>
                  </button>
                  <button
                    onClick={() => setViewMode('all')}
                    className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                      viewMode === 'all'
                        ? '[--tw-text-opacity:1] text-[var(--color-button-primary)]'
                        : '[--tw-text-opacity:0.8] text-[var(--color-text-secondary)] hover:[--tw-text-opacity:1] text-[var(--color-text-primary)]'
                    }`}
                  >
                    <ListIcon className="w-3 h-3" />
                    <span>All</span>
                  </button>
                </div>
              )}
              {allowUploads && (
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-1 text-[var(--color-vibox-text-primary)] text-xs rounded-full hover:bg-[var(--color-vibox-add-button-hover)] transition-colors"
                  >
                    + Add
                  </button>
                  {mode === "host" && tracks.some(t => !t.isPreloaded) && (
                    <button
                      onClick={clearAll}
                      className="px-2 py-1 text-red-500 text-xs rounded-full hover:bg-red-500/10 transition-colors"
                      title="Clear all uploaded tracks"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="px-4 sm:px-6 max-w-screen-md mx-auto w-full">
              <div className="flex flex-col gap-2">

            {/* Track List */}
            <div>
              <h3 className="text-lg font-semibold [--tw-text-opacity:1] text-[var(--color-text-primary)] mb-2">Tracks ({tracks.length})</h3>
              
              {viewMode === 'vibes' && vibeHierarchy && vibeHierarchy.vibes ? (
                <div className="space-y-2">
                  {Object.entries(vibeHierarchy.vibes)
                    .sort((a, b) => {
                      const aCount = Array.isArray(a[1]) ? a[1].length : (a[1]?.total || 0);
                      const bCount = Array.isArray(b[1]) ? b[1].length : (b[1]?.total || 0);
                      return bCount - aCount;
                    })
                    // Hide other primary vibes if one is selected, unless it's the selected one
                    .filter(([primaryVibe]) => !selectedPrimaryVibe || selectedPrimaryVibe === primaryVibe)
                    .map(([primaryVibe, data]) => {
                      const isPrimaryExpanded = expandedPrimaryVibes.has(primaryVibe);
                      const isSelected = selectedPrimaryVibe === primaryVibe;
                      
                      return (
                        <div key={primaryVibe} className="space-y-1">
                          {/* Primary Vibe */}
                          <button
                            onClick={() => togglePrimaryVibe(primaryVibe)}
                            className={`w-full flex items-center justify-between p-2 rounded transition-colors ${
                              isSelected 
                                ? 'bg-[var(--color-vibox-button-primary)] bg-opacity-20 ring-1 ring-[var(--color-vibox-button-primary)] ring-opacity-50' 
                                : 'bg-[var(--color-card-background)] bg-opacity-50 hover:bg-opacity-70'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isPrimaryExpanded ? (
                                <ChevronDownIcon className={`w-4 h-4 [--tw-text-opacity:0.8] ${
                                  isSelected ? 'vibe-selected-text' : 'text-[var(--color-text-secondary)]'
                                }`} />
                              ) : (
                                <ChevronRightIcon className="w-4 h-4 [--tw-text-opacity:0.8] text-[var(--color-text-secondary)]" />
                              )}
                              <div className="text-left">
                                <p className={`text-sm font-semibold [--tw-text-opacity:1] ${
                                  isSelected ? 'vibe-selected-text' : 
                                  isVibeActive(primaryVibe) ? 'text-[var(--color-button-primary)]' : 
                                  'text-[var(--color-text-secondary)]'
                                }`}>
                                  {primaryVibe}
                                  {isSelected && (
                                    <span className="ml-2 text-xs [--tw-text-opacity:0.7] font-normal">(Selected)</span>
                                  )}
                                </p>
                                <p className={`text-xs [--tw-text-opacity:0.6] ${
                                  isSelected ? 'vibe-selected-text-alt' : 'text-[var(--color-text-secondary)]'
                                }`}>
                                  {Array.isArray(data) ? data.length : data.total || 0} tracks
                                </p>
                              </div>
                            </div>
                          </button>

                          {/* Songs for expanded primary vibe */}
                          {isPrimaryExpanded && Array.isArray(data) && (
                            <div className="ml-6 space-y-1">
                              {data.map((song) => {
                                const track = tracks.find(t => {
                                  const urlFilename = t.url.split('/').pop();
                                  return urlFilename === song.file || t.url.includes(song.file);
                                });
                                if (!track) {
                                  return null;
                                }

                                return (
                                  <div
                                    key={track.id}
                                    className={`flex items-center gap-3 p-2 rounded bg-[var(--color-vibox-card-background)] bg-opacity-30 hover:bg-opacity-50 transition-all ${
                                      windowWidth < 640 ? 'min-w-[280px]' : 'min-w-[320px]'
                                    } ${
                                      currentTrack?.id === track.id ? 'ring-1 ring-[var(--color-vibox-button-primary)]' : ''
                                    }`}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-xs font-medium [--tw-text-opacity:1] truncate ${
                                        currentTrack?.id === track.id ? 'text-[var(--color-button-primary)]' : 'text-[var(--color-text-primary)]'
                                      }`}>{track.title}</p>
                                      <p className="text-xs [--tw-text-opacity:0.8] text-[var(--color-text-secondary)] truncate">
                                        {song.genre} • {track.artist}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {mode === "host" && (
                                        <button
                                          onClick={currentTrack?.id === track.id ? togglePlayPause : () => playTrack(track)}
                                          className="player-control vibox-button [--tw-text-opacity:1] text-[var(--color-button-primary)] hover:[--tw-text-opacity:0.8] transition-opacity svg-glow-primary"
                                        >
                                          {currentTrack?.id === track.id && isPlaying ? (
                                            <PauseIcon className="w-5 h-5" />
                                          ) : (
                                            <PlayIcon className="w-5 h-5" />
                                          )}
                                        </button>
                                      )}
                                      <button
                                        onClick={() => addToQueue(track)}
                                        className="vibox-button [--tw-text-opacity:1] text-[var(--color-button-primary)] hover:[--tw-text-opacity:0.8] transition-opacity svg-glow-primary"
                                      >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <line x1="3" y1="6" x2="13" y2="6" />
                                          <line x1="3" y1="10" x2="13" y2="10" />
                                          <line x1="3" y1="14" x2="9" y2="14" />
                                          <line x1="17" y1="11" x2="17" y2="17" />
                                          <line x1="14" y1="14" x2="20" y2="14" />
                                        </svg>
                                      </button>
                                      {/* Net vote display */}
                                      <div className="flex items-center gap-1 border-l border-[var(--color-vibox-player-border)]/20 pl-2">
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                          (getVoteCount(track.id)?.net_votes || 0) > 0
                                            ? 'text-green-500 [--tw-text-opacity:0.8] bg-green-500/10'
                                            : (getVoteCount(track.id)?.net_votes || 0) < 0
                                            ? 'text-red-500 [--tw-text-opacity:0.8] bg-red-500/10'
                                            : 'text-[var(--color-text-secondary)] [--tw-text-opacity:0.6]'
                                        }`}>
                                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                          </svg>
                                          <span>{getVoteCount(track.id)?.net_votes || 0}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                                                  </div>
                      );
                    })}
                </div>
              ) : tracks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-2">
                    <MusicIcon className="w-12 h-12 [--tw-text-opacity:0.4] text-[var(--color-text-primary)]" />
                  </div>
                  <p className="text-sm [--tw-text-opacity:1] text-[var(--color-text-secondary)]">
                    No tracks loaded yet
                  </p>
                  <p className="text-xs [--tw-text-opacity:0.8] text-[var(--color-text-secondary)] mt-1">
                    {allowUploads 
                      ? "Tap 'Add Tracks' to upload music" 
                      : "Waiting for host to add tracks..."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tracks.map((track) => (
                    <div
                      key={track.id}
                      className={`track-item vibox-button flex items-center gap-3 p-3 [--tw-bg-opacity:0.5] bg-[var(--color-vibox-card-background)] rounded-2xl hover:bg-opacity-0.7 transition-all ${
                        windowWidth < 640 ? 'min-w-[280px]' : 'min-w-[320px]'
                      } ${
                        currentTrack?.id === track.id ? 'ring-2 ring-[var(--color-vibox-button-primary)] playing' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium [--tw-text-opacity:1] truncate ${
                          currentTrack?.id === track.id ? 'text-[var(--color-button-primary)]' : 'text-[var(--color-text-primary)]'
                        }`}>{track.title}</p>
                        <p className="text-xs [--tw-text-opacity:0.8] text-[var(--color-text-secondary)] truncate">
                          {track.artist}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {currentTrack?.id === track.id && isPlaying ? (
                          mode === "host" && (
                            <button
                              onClick={togglePlayPause}
                              className="player-control vibox-button [--tw-text-opacity:1] text-[var(--color-button-primary)] hover:[--tw-text-opacity:0.8] transition-opacity svg-glow-primary"
                            >
                              <PauseIcon className="w-6 h-6" />
                            </button>
                          )
                        ) : (
                          mode === "host" && (
                            <button
                              onClick={() => playTrack(track)}
                              className="[--tw-text-opacity:1] text-[var(--color-button-primary)] hover:[--tw-text-opacity:0.8] transition-opacity svg-glow-primary"
                            >
                              <PlayIcon className="w-6 h-6" />
                            </button>
                          )
                        )}
                        <button
                          onClick={() => addToQueue(track)}
                          className="vibox-button [--tw-text-opacity:1] text-[var(--color-button-primary)] hover:[--tw-text-opacity:0.8] transition-opacity svg-glow-primary"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="6" x2="13" y2="6" />
                            <line x1="3" y1="10" x2="13" y2="10" />
                            <line x1="3" y1="14" x2="9" y2="14" />
                            <line x1="17" y1="11" x2="17" y2="17" />
                            <line x1="14" y1="14" x2="20" y2="14" />
                          </svg>
                        </button>
                        {/* Net vote display */}
                        <div className="flex items-center gap-1 border-l border-[var(--color-vibox-player-border)]/20 pl-2">
                          <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            (getVoteCount(track.id)?.net_votes || 0) > 0
                              ? 'text-green-500 [--tw-text-opacity:0.8] bg-green-500/10'
                              : (getVoteCount(track.id)?.net_votes || 0) < 0
                              ? 'text-red-500 [--tw-text-opacity:0.8] bg-red-500/10'
                              : 'text-[var(--color-text-secondary)] [--tw-text-opacity:0.6]'
                          }`}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            <span>{getVoteCount(track.id)?.net_votes || 0}</span>
                          </div>
                          {/* Remove track button for uploaded tracks */}
                          {allowUploads && !track.isPreloaded && (
                            <button
                              onClick={() => removeTrack(track.id)}
                              className="vibox-button [--tw-text-opacity:1] text-red-500 hover:[--tw-text-opacity:0.8] transition-opacity p-1"
                              title="Remove track"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Player Bar - Right under the track list */}
            <div ref={bottomPlayerRef} className={`mt-4 bg-[var(--color-player-background)]/85 backdrop-blur-2xl rounded-xl ${expandedPlayer ? 'hidden' : ''}`}>
              {(currentTrack || currentTrackInfo) ? (
                <div className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setExpandedPlayer(true)}>
                      <div className="flex items-center justify-center w-10 h-10 group hover:scale-105 transition-transform">
                        <div className="flex items-center svg-glow-primary">
                          <ChevronUpIcon className="w-8 h-8 mr-1 text-[var(--color-button-primary)]" />
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="[--tw-text-opacity:0.8] text-[var(--color-button-primary)]">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                            <line x1="3" y1="14" x2="21" y2="14" />
                            <line x1="3" y1="18" x2="15" y2="18" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate [--tw-text-opacity:1] text-[var(--color-text-primary)]`}>
                          {currentTrack?.title || currentTrackInfo?.track_title || 'Unknown Track'}
                        </p>
                        <p className={`text-xs truncate [--tw-text-opacity:0.8] text-[var(--color-text-secondary)]`}>
                          {currentTrack?.artist || currentTrackInfo?.track_artist || 'Unknown Artist'}
                        </p>
                      </div>
                    </div>
                    {mode === "host" && (
                      <button
                        onClick={togglePlayPause}
                        className="player-control vibox-button hover:scale-105 transition-transform [--tw-text-opacity:1] text-[var(--color-button-primary)] flex-shrink-0 svg-glow-primary"
                      >
                        {isPlaying ? (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setExpandedPlayer(true)}>
                      <div className="flex items-center justify-center w-10 h-10 group hover:scale-105 transition-transform">
                        <div className="flex items-center svg-glow-primary">
                          <ChevronUpIcon className="w-8 h-8 mr-1 text-[var(--color-button-primary)]" />
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="[--tw-text-opacity:0.8] text-[var(--color-button-primary)]">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                            <line x1="3" y1="14" x2="21" y2="14" />
                            <line x1="3" y1="18" x2="15" y2="18" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate [--tw-text-opacity:0.6] text-[var(--color-text-secondary)]`}>No track playing</p>
                      </div>
                    </div>
                    <button
                      className={`hover:scale-105 transition-transform [--tw-text-opacity:0.5] text-[var(--color-button-primary)] flex-shrink-0`}
                      disabled
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Progress Bar */}
              <div 
                className={`w-full h-2 bg-[var(--color-vibox-progress-track)] relative ${
                  mode === "host" ? "cursor-pointer" : "cursor-default"
                }`}
                onMouseDown={mode === "host" ? handleProgressMouseDown : undefined}
                onTouchStart={mode === "host" ? handleProgressTouchStart : undefined}
              >
                {((currentTrack || currentTrackInfo) && (
                  <div 
                    className="h-full [--tw-bg-opacity:1] bg-[var(--color-vibox-button-primary)] absolute top-0 left-0 transition-all"
                    style={{ width: `${(currentTime / (audioRef.current?.duration || currentTrackInfo?.track_duration || 1)) * 100}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Footer - Right under the player */}
            <div className={`py-3 flex items-center justify-center`}>
              <span className="[--tw-text-opacity:0.6] text-[var(--color-text-secondary)] text-xs">
                VIBox powered by Söcial
              </span>
            </div>
              </div>
            </div>
          </div>

          {/* Expanded Player View - Covers Song List */}
          <div className={`absolute inset-x-0 inset-y-0 expanded-player ${expandedPlayer ? 'show' : ''} bg-gradient-to-br from-[var(--color-vibox-background-gradient-from)] via-[var(--color-vibox-background-gradient-via)] to-[var(--color-vibox-background-gradient-to)] z-50`}>
              <div className="flex flex-col min-h-[100dvh] md:min-h-[700px]">
                {/* Expanded Player Header */}
                <div className="flex items-center justify-between px-6 py-4">
                  <button 
                    onClick={() => setExpandedPlayer(false)}
                    className="w-10 h-10 flex items-center justify-center [--tw-text-opacity:0.8] text-[var(--color-button-primary)] opacity-70 hover:opacity-100 transition-opacity svg-glow-primary"
                    aria-label="Collapse"
                  >
                  {/* Collapse Queue Button */}
                  <div className="flex items-center svg-glow-primary">
                    <ChevronDownIcon className="w-8 h-8 text-[var(--color-button-primary)]" />
                  </div>
                  </button>
                  <div className="w-8 h-8" />
                </div>

                {/* Track Info and Queue */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  <div className="px-4 sm:px-6 max-w-screen-md mx-auto w-full py-4">
                  {/* Queue Section - Always Visible in Expanded Player */}
                  <div>
                    {mode === "host" && queue.length > 0 && (
                      <div className="flex justify-end gap-3 mb-3">
                        <button
                          onClick={() => playNextInQueue()}
                          className="text-sm [--tw-text-opacity:0.8] text-[var(--color-text-primary)] opacity-80 hover:opacity-100 transition-opacity"
                        >
                          Play Next
                        </button>
                        <button
                          onClick={clearQueue}
                          className="text-sm [--tw-text-opacity:0.8] text-red-500 opacity-80 hover:opacity-100 transition-opacity"
                        >
                          Clear Queue
                        </button>
                      </div>
                    )}
                    
                    {queue.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="flex justify-center mb-2">
                          <MusicIcon className="w-12 h-12 [--tw-text-opacity:0.4] text-[var(--color-text-primary)]" />
                        </div>
                        <p className="[--tw-text-opacity:0.6] text-[var(--color-text-primary)]">Queue is empty</p>
                        <p className="text-sm mt-1 [--tw-text-opacity:0.4] text-[var(--color-text-primary)]">
                          {mode === "host" ? "Songs will appear here when patrons add them" : "Browse songs and tap to add to queue"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {queue.map((item, index) => (
                          <div
                            key={item.id}
                            className={`queue-item flex items-center gap-2 p-2 [--tw-bg-opacity:0.5] bg-[var(--color-vibox-card-background)] rounded hover:bg-opacity-0.7 transition-colors`}
                          >
                            <span className={`text-sm font-medium w-6 [--tw-text-opacity:0.8] text-[var(--color-text-secondary)]`}>
                              {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium [--tw-text-opacity:0.8] text-[var(--color-text-secondary)] truncate">
                                {item.track_title}
                              </p>
                              <p className="text-xs [--tw-text-opacity:0.8] text-[var(--color-text-secondary)] truncate">
                                {item.track_artist} • {item.track_genre}
                              </p>
                            </div>
                            {mode === "host" && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const track: Track = {
                                      id: item.track_id,
                                      title: item.track_title,
                                      artist: item.track_artist,
                                      url: item.track_url,
                                      duration: item.track_duration || 0,
                                      genre: item.track_genre || undefined,
                                      primaryVibe: item.primary_vibe || undefined,
                                      secondaryVibe: item.secondary_vibe || undefined,
                                      isPreloaded: true,
                                    };
                                    playTrack(track);
                                  }}
                                  className="player-control vibox-button [--tw-text-opacity:1] text-[var(--color-button-primary)] hover:[--tw-text-opacity:0.8] transition-opacity p-2 svg-glow-primary"
                                >
                                  <PlayIcon className="w-6 h-6" />
                                </button>
                                <button
                                  onClick={() => removeFromQueue(item.id)}
                                  className="vibox-button [--tw-text-opacity:1] text-[var(--color-text-secondary)] hover:[--tw-text-opacity:0.8] transition-opacity p-2 svg-glow-secondary"
                                >
                                  <TrashIcon className="w-6 h-6" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Track Info and Action Buttons */}
                  <div className="mt-4 pt-8 border-t border-[var(--color-vibox-player-border)]/10">
                    {/* Now Playing Section */}
                    <div className="text-left mb-4">
                      <p className="[--tw-text-opacity:1] text-[var(--color-text-primary)] text-sm font-medium">Now Playing</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h2 className={`text-xl font-semibold [--tw-text-opacity:1] text-[var(--color-text-primary)] mb-1`}>
                          {currentTrack?.title || currentTrackInfo?.track_title || 'No track playing'}
                        </h2>
                        <p className={`text-sm [--tw-text-opacity:0.8] text-[var(--color-text-secondary)]`}>
                          {currentTrack?.artist || currentTrackInfo?.track_artist || 'No artist'}
                        </p>
                      </div>
                      
                      {/* Voting Section - Prominent for currently playing track */}
                      {(currentTrack || currentTrackInfo) && (
                        <div className="flex items-center gap-3 ml-6">
                          <div className="flex items-center gap-2 border-l border-[var(--color-vibox-player-border)]/20 pl-4">
                            <button
                              onClick={() => handleVote(currentTrack?.id || currentTrackInfo?.track_id || '', 'up')}
                              className={`vibox-button flex items-center gap-2 px-4 py-3 rounded-xl transition-all transform hover:scale-105 ${
                                getUserVote(currentTrack?.id || currentTrackInfo?.track_id || '') === 'up'
                                  ? 'text-green-500 [--tw-text-opacity:1] bg-green-500/20 border border-green-500/30 shadow-lg'
                                  : 'text-[var(--color-text-secondary)] hover:text-green-500 [--tw-text-opacity:0.8] hover:[--tw-text-opacity:1] bg-green-500/10 border border-transparent'
                              }`}
                            >
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 11v8h10v-8h-10zM5 11l7-7 7 7h-14z"/>
                              </svg>
                              <span className="text-base font-bold">{getVoteCount(currentTrack?.id || currentTrackInfo?.track_id || '')?.upvotes || 0}</span>
                            </button>
                            <button
                              onClick={() => handleVote(currentTrack?.id || currentTrackInfo?.track_id || '', 'down')}
                              className={`vibox-button flex items-center gap-2 px-4 py-3 rounded-xl transition-all transform hover:scale-105 ${
                                getUserVote(currentTrack?.id || currentTrackInfo?.track_id || '') === 'down'
                                  ? 'text-red-500 [--tw-text-opacity:1] bg-red-500/20 border border-red-500/30 shadow-lg'
                                  : 'text-[var(--color-text-secondary)] hover:text-red-500 [--tw-text-opacity:0.8] hover:[--tw-text-opacity:1] bg-red-500/10 border border-transparent'
                              }`}
                            >
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 13v-8h10v8h-10zM5 13l7 7 7 -7h-14z"/>
                              </svg>
                              <span className="text-base font-bold">{getVoteCount(currentTrack?.id || currentTrackInfo?.track_id || '')?.downvotes || 0}</span>
                            </button>
                          </div>
                          
                          {/* Action Buttons - Host Only */}
                          {mode === "host" && (
                            <div className="flex gap-2">
                              <button 
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-[var(--color-vibox-button-danger)]/50 text-[var(--color-vibox-button-danger)] hover:bg-[var(--color-vibox-button-danger)]/70' : 'bg-[var(--color-vibox-button-danger)]/50 text-[var(--color-vibox-button-danger)] hover:bg-[var(--color-vibox-button-danger)]/70'}`}
                                title="Hide Song"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                                </svg>
                              </button>
                              <button 
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-[var(--color-vibox-card-background)] [--tw-text-opacity:1] text-[var(--color-text-primary)] hover:bg-[var(--color-vibox-card-hover)]' : 'bg-[var(--color-vibox-card-background)] [--tw-text-opacity:1] text-[var(--color-text-primary)] hover:bg-[var(--color-vibox-card-hover)]'}`}
                                title="Add to Playlist"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 5v14M5 12h14"/>
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Progress Bar - Host Only Seeking */}
                <div className="px-6 pb-6">
                  <div className="mb-1">
                    <div 
                      className={`progress-bar w-full h-2 bg-[var(--color-vibox-progress-track)] rounded-full ${
                        mode === "host" ? "cursor-pointer" : "cursor-default"
                      }`}
                      onMouseDown={mode === "host" ? handleProgressMouseDown : undefined}
                      onTouchStart={mode === "host" ? handleProgressTouchStart : undefined}
                    >
                      <div 
                        className={`h-full rounded-full transition-all relative [--tw-bg-opacity:1] bg-[var(--color-vibox-button-primary)]`}
                        style={{ width: `${(currentTime / (mode === "host" ? (audioRef.current?.duration || currentTrackInfo?.track_duration || currentTrack?.duration || 1) : (currentTrackInfo?.track_duration || 1))) * 100}%` }}
                      >
                        <div className={`absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full shadow-lg [--tw-bg-opacity:1] bg-[var(--color-vibox-button-primary)]`} />
                      </div>
                    </div>
                    <div className={`flex justify-between text-xs mt-1 [--tw-text-opacity:0.8] text-[var(--color-text-secondary)]`}>
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(audioRef.current?.duration || currentTrackInfo?.track_duration || 0)}</span>
                    </div>
                  </div>

                  {/* Volume Control */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 [--tw-text-opacity:0.8] text-[var(--color-text-secondary)]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                      </svg>
                      <div 
                        className="flex-1 h-2 bg-[var(--color-vibox-progress-track)] rounded-full cursor-pointer"
                        onMouseDown={handleVolumeMouseDown}
                        onTouchStart={handleVolumeTouchStart}
                      >
                        <div 
                          className="h-full rounded-full transition-all [--tw-bg-opacity:1] bg-[var(--color-vibox-button-primary)]"
                          style={{ width: `${volume * 100}%` }}
                        />
                      </div>
                      <span className="text-xs [--tw-text-opacity:0.8] text-[var(--color-text-secondary)] w-10 text-right">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Expanded Controls - Host Only */}
                  <div className="flex items-center justify-center gap-6">
                    {mode === "host" ? (
                      <button
                        onClick={playPrevious}
                        disabled={tracks.length <= 1}
                        className={`player-control vibox-button w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-[var(--color-vibox-card-background)] [--tw-text-opacity:1] text-[var(--color-button-primary)]' : 'bg-[var(--color-vibox-card-background)] [--tw-text-opacity:1] text-[var(--color-button-primary)]'} opacity-70 hover:opacity-100 disabled:opacity-30 transition-all svg-glow-primary`}
                      >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11 17L6 12L11 7L11 17zM17 17L12 12L17 7L17 17z"/>
                        </svg>
                      </button>
                    ) : null}
                    {mode === "host" && (
                      <button
                        onClick={togglePlayPause}
                        className="player-control vibox-button w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 transition-transform [--tw-bg-opacity:1] bg-[var(--color-vibox-button-primary)] text-[var(--color-vibox-button-play-text)] svg-glow-primary"
                      >
                        {isPlaying ? (
                          <PauseIcon className="w-6 h-6" />
                        ) : (
                          <PlayIcon className="w-6 h-6" />
                        )}
                      </button>
                    )}
                    
                    {mode === "host" ? (
                      <button
                        onClick={playNext}
                        disabled={tracks.length <= 1}
                        className={`player-control vibox-button w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-[var(--color-vibox-card-background)] [--tw-text-opacity:1] text-[var(--color-button-primary)]' : 'bg-[var(--color-vibox-card-background)] [--tw-text-opacity:1] text-[var(--color-button-primary)]'} opacity-70 hover:opacity-100 disabled:opacity-30 transition-all svg-glow-primary`}
                      >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7 17L12 12L7 7L7 17zM13 17L18 12L13 7L13 17z"/>
                        </svg>
                      </button>
                    ) : null}
                  </div>
                  </div>
                </div>
                {/* Bottom Navigation Bar - Simple footer */}
                <div className={`bg-[var(--color-player-background)]/85 backdrop-blur-2xl pb-[env(safe-area-inset-bottom)]`}>
                  <div className={`py-3 flex items-center justify-center px-4`}>
                    <span className="[--tw-text-opacity:0.6] text-[var(--color-text-secondary)] text-xs">
                      VIBox powered by Söcial
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
    </>
  );
};

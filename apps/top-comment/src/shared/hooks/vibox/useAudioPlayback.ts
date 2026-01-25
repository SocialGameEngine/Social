import { useState, useRef, useEffect, useCallback } from "react";
import type { Track } from "../../types/vibox";

interface UseAudioPlaybackReturn {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  audioRef: React.RefObject<HTMLAudioElement>;
  playTrack: (track: Track) => void;
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
  handleProgressSeek: (clientX: number, targetElement: HTMLElement) => void;
  handleProgressMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleProgressTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  stopPlayback: () => void;
}

export const useAudioPlayback = (): UseAudioPlaybackReturn => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Update time and handle track end
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

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
  }, [currentTrack]);

  const handleProgressMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!audioRef.current || !currentTrack) return;
    
    const targetElement = e.currentTarget;
    handleProgressSeek(e.clientX, targetElement);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (e.target instanceof HTMLElement) {
        handleProgressSeek(e.clientX, targetElement);
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleProgressSeek, currentTrack]);

  const handleProgressTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!audioRef.current || !currentTrack) return;
    
    const targetElement = e.currentTarget;
    handleProgressSeek(e.touches[0].clientX, targetElement);
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.target instanceof HTMLElement) {
        handleProgressSeek(e.touches[0].clientX, targetElement);
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }, [handleProgressSeek, currentTrack]);

  const playTrack = useCallback((track: Track) => {
    if (audioRef.current && track.url) {
      audioRef.current.src = track.url;
      audioRef.current.play();
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, currentTrack]);

  const stopPlayback = useCallback(() => {
    setCurrentTrack(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  }, []);

  return {
    currentTrack,
    isPlaying,
    currentTime,
    volume,
    audioRef,
    playTrack,
    togglePlayPause,
    setVolume,
    handleProgressSeek,
    handleProgressMouseDown,
    handleProgressTouchStart,
    stopPlayback,
  };
};

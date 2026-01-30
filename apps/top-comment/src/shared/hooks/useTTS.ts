import { useCallback, useEffect, useRef, useState } from "react";
import { ttsService } from "../services/ttsService";
import type { TTSOptions, TTSMethod } from "../services/ttsService";
import type { VoiceProfile } from "../services/voiceProfiles";

interface UseTTSOptions {
  onError?: (error: Error) => void;
  onStart?: () => void;
  onEnd?: () => void;
  profile?: VoiceProfile;
}

interface UseTTSResult {
  play: (text: string, ttsOptions?: TTSOptions) => Promise<void>;
  stop: () => void;
  toggleMute: () => void;
  isPlaying: boolean;
  isLoading: boolean;
  isMuted: boolean;
  isAvailable: boolean;
  method: TTSMethod;
}

export function useTTS(options: UseTTSOptions = {}): UseTTSResult {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const method = ttsService.getAvailableMethod();
  const isAvailable = ttsService.isAvailable();

  const stop = useCallback((): void => {
    // Stop HTML5 audio if playing
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    
    // Cancel Web Speech API if active
    ttsService.cancel();
    
    setIsPlaying(false);
  }, []);

  const play = useCallback(
    async (text: string, ttsOptions?: TTSOptions): Promise<void> => {
      if (isMuted || !text.trim() || !isAvailable) {
        return;
      }

      setIsLoading(true);
      options.onStart?.();

      try {
        stop();
        
        // Merge profile options if available
        const finalOptions: TTSOptions = {
          voice: options.profile?.voice,
          audioConfig: options.profile?.audioConfig,
          ...ttsOptions,
        };

        const audioContent = await ttsService.synthesizeSpeech(text, finalOptions);
        
        // If using Web Speech API, audioContent will be undefined
        // The speech is already playing via the browser API
        if (audioContent === undefined) {
          setIsPlaying(true);
          setIsLoading(false);
          
          // Web Speech API doesn't have reliable end detection
          // Estimate duration based on text length (rough: 150 words per minute)
          const words = text.split(/\s+/).length;
          const estimatedDuration = (words / 150) * 60 * 1000; // Convert to ms
          
          setTimeout(() => {
            setIsPlaying(false);
            options.onEnd?.();
          }, estimatedDuration);
          
          return;
        }

        // Google Cloud TTS: create and play audio element
        const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
        audio.muted = isMuted;
        currentAudioRef.current = audio;

        audio.onplay = () => {
          setIsPlaying(true);
          setIsLoading(false);
        };
        
        audio.onended = () => {
          setIsPlaying(false);
          currentAudioRef.current = null;
          options.onEnd?.();
        };
        
        audio.onerror = () => {
          setIsPlaying(false);
          setIsLoading(false);
          currentAudioRef.current = null;
          options.onError?.(new Error("Audio playback failed."));
        };

        await audio.play();
      } catch (error) {
        setIsPlaying(false);
        setIsLoading(false);
        options.onError?.(error as Error);
      }
    },
    [isMuted, isAvailable, options, stop],
  );

  const toggleMute = useCallback((): void => {
    setIsMuted((prev) => {
      const next = !prev;
      if (currentAudioRef.current) {
        currentAudioRef.current.muted = next;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      ttsService.cancel();
    };
  }, []);

  return {
    play,
    stop,
    toggleMute,
    isPlaying,
    isLoading,
    isMuted,
    isAvailable,
    method,
  };
}

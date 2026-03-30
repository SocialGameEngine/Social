/**
 * useSessionTimer - Real-time countdown timer for session phases
 * 
 * Calculates remaining time based on:
 * - Session phase (answer, vote, etc.)
 * - Phase start time
 * - Phase duration from settings
 * - Pause state and total paused time
 */

import { useState, useEffect, useMemo } from 'react';
import type { Session } from '../../../shared/types';

interface UseSessionTimerOptions {
  session: Session | null;
  onTimerEnd?: () => void;
}

interface UseSessionTimerReturn {
  /** Remaining seconds in current phase */
  remainingSeconds: number;
  /** Formatted time string (MM:SS) */
  formattedTime: string;
  /** Whether timer is actively counting down */
  isRunning: boolean;
  /** Whether timer has reached zero */
  isExpired: boolean;
  /** Total duration for current phase */
  phaseDuration: number;
  /** Progress percentage (0-100) */
  progress: number;
}

// Default phase durations in seconds
const DEFAULT_PHASE_DURATIONS: Record<string, number> = {
  lobby: 0, // No timer in lobby
  answer: 60, // 60 seconds to answer
  vote: 30, // 30 seconds to vote
  results: 15, // 15 seconds to show results
  ended: 0, // No timer when ended
};

export function useSessionTimer({
  session,
  onTimerEnd,
}: UseSessionTimerOptions): UseSessionTimerReturn {
  const [now, setNow] = useState(() => Date.now());
  const [phaseStartMs, setPhaseStartMs] = useState<number | null>(null);
  const [pausedAtMs, setPausedAtMs] = useState<number | null>(null);
  const [totalPausedMs, setTotalPausedMs] = useState(0);
  const [lastUnpausedNow, setLastUnpausedNow] = useState<number | null>(null);

  // Get phase duration from session settings or defaults
  const phaseDuration = useMemo(() => {
    if (!session) return 0;
    
    const settings = session.settings;
    const phase = session.status;
    
        
    // Check session settings for custom durations (answerSecs, voteSecs, resultsSecs)
    if (phase === 'answer' && settings?.answerSecs) {
      return settings.answerSecs;
    }
    if (phase === 'vote' && settings?.voteSecs) {
      return settings.voteSecs;
    }
    if (phase === 'results' && settings?.resultsSecs) {
      return settings.resultsSecs;
    }
    
    return DEFAULT_PHASE_DURATIONS[phase] || 0;
  }, [session?.status, session?.settings]);

  // Track phase changes to reset timer
  useEffect(() => {
    if (session && phaseDuration > 0) {
      setPhaseStartMs(Date.now());
      setTotalPausedMs(0); // Reset pause tracking on phase change
      setPausedAtMs(null);
    }
  }, [session?.status, phaseDuration]);

  // Calculate phase start time
  const phaseStartTime = useMemo(() => {
    if (!session) return null;
    
    // Use startedAt for the session start, or createdAt as fallback
    // In a real implementation, you'd track phase transition times
    const startedAt = session.startedAt || session.createdAt;
    if (!startedAt) return null;
    
    return new Date(startedAt).getTime();
  }, [session?.startedAt, session?.createdAt]);

  
  // Check if currently paused
  const isPaused = session?.paused ?? false;

  // Handle pause state changes
  useEffect(() => {
    if (!session) return;

    const wasPaused = pausedAtMs !== null;
    const currentlyPaused = session.paused;

    if (!wasPaused && currentlyPaused) {
      // Just paused - stop updating now and record pause time
      setPausedAtMs(Date.now());
      // Don't update now anymore while paused
    } else if (wasPaused && !currentlyPaused && pausedAtMs) {
      // Just unpaused - adjust phase start time and update now simultaneously
      const unpauseTime = Date.now();
      const pauseDuration = unpauseTime - pausedAtMs;
      setPhaseStartMs(prev => prev ? prev + pauseDuration : null);
      setNow(unpauseTime); // Update now to prevent race condition
      setPausedAtMs(null);
    }
  }, [session?.paused, pausedAtMs]);

  // Update current time every second when timer is running
  useEffect(() => {
    if (!session || phaseDuration === 0 || isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [session, phaseDuration, isPaused]);

  // Sync timer every 30 seconds to prevent drift during long pauses
  useEffect(() => {
    if (!session || phaseDuration === 0) {
      return;
    }

    const syncInterval = setInterval(() => {
      if (!isPaused) {
        setNow(Date.now());
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(syncInterval);
  }, [session, phaseDuration, isPaused]);

  // Calculate remaining time
  const remainingSeconds = useMemo(() => {
    if (!session || phaseDuration === 0) {
      return 0;
    }

    // Use the tracked phase start time (already adjusted for pauses)
    if (!phaseStartMs) {
      return phaseDuration;
    }

    // For paused state, use the time when we paused to prevent drift
    const currentTime = isPaused && pausedAtMs ? pausedAtMs : now;
    
    // Calculate elapsed time from phase start
    const elapsedMs = currentTime - phaseStartMs;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    
    // Calculate remaining
    const remaining = phaseDuration - elapsedSeconds;
    const result = Math.max(0, remaining);
    
    return result;
  }, [now, phaseStartMs, phaseDuration, session, isPaused, pausedAtMs]);

  // Check if timer has expired
  const isExpired = remainingSeconds === 0 && phaseDuration > 0;

  // Call onTimerEnd when timer expires
  useEffect(() => {
    if (isExpired && onTimerEnd) {
      onTimerEnd();
    }
  }, [isExpired, onTimerEnd]);

  // Format time as MM:SS
  const formattedTime = useMemo(() => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [remainingSeconds]);

  // Calculate progress percentage
  const progress = useMemo(() => {
    if (phaseDuration === 0) return 100;
    return Math.round((remainingSeconds / phaseDuration) * 100);
  }, [remainingSeconds, phaseDuration]);

  return {
    remainingSeconds,
    formattedTime,
    isRunning: !isPaused && phaseDuration > 0 && remainingSeconds > 0,
    isExpired,
    phaseDuration,
    progress,
  };
}

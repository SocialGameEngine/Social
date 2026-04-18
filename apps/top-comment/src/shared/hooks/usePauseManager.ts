// =============================================================================
// UNIFIED PAUSE MANAGER HOOK
// =============================================================================
// Provides unified pause/resume logic for sessions and sociales.

import { useState, useCallback } from 'react';
import { pauseSession } from '../../features/session/sessionService';
import { pauseSociale } from '../../features/sociale/socialeService';
import { handleAsyncError, type Toast } from '../utils/error-handling';

export interface UsePauseManagerOptions {
  /** Unique ID of the session or sociale */
  id: string;
  /** Type of entity to pause/resume */
  type: 'session' | 'sociale';
  /** Callback when pause succeeds */
  onPause?: () => void;
  /** Callback when resume succeeds */
  onResume?: () => void;
  /** Toast function for user feedback */
  toast?: Toast;
}

export interface UsePauseManagerReturn {
  /** Function to toggle pause state */
  togglePause: (currentlyPaused: boolean) => Promise<void>;
  /** Whether a pause/resume operation is in progress */
  isPausing: boolean;
}

/**
 * Unified hook for managing pause/resume operations
 * 
 * @example
 * ```ts
 * const { togglePause, isPausing } = usePauseManager({
 *   id: sessionId,
 *   type: 'session',
 *   toast,
 *   onPause: () => console.log('Paused'),
 *   onResume: () => console.log('Resumed'),
 * });
 * 
 * await togglePause(session.isPaused);
 * ```
 */
export function usePauseManager(options: UsePauseManagerOptions): UsePauseManagerReturn {
  const { id, type, onPause, onResume, toast } = options;
  const [isPausing, setIsPausing] = useState(false);
  
  const togglePause = useCallback(async (currentlyPaused: boolean) => {
    if (!id) {
      console.warn('usePauseManager: No ID provided');
      return;
    }

    setIsPausing(true);
    const newPausedState = !currentlyPaused;
    
    try {
      if (type === 'session') {
        await pauseSession({ sessionId: id, pause: newPausedState });
      } else {
        await pauseSociale(id, newPausedState);
      }
      
      // Show success toast
      if (toast) {
        toast({
          title: newPausedState ? 'Paused' : 'Resumed',
          variant: 'success',
        });
      }
      
      // Call appropriate callback
      if (newPausedState) {
        onPause?.();
      } else {
        onResume?.();
      }
    } catch (error) {
      await handleAsyncError(error, {
        toast,
        context: `Pause ${type}`,
        userMessage: `Failed to ${newPausedState ? 'pause' : 'resume'} ${type}`,
      });
    } finally {
      setIsPausing(false);
    }
  }, [id, type, toast, onPause, onResume]);
  
  return { togglePause, isPausing };
}

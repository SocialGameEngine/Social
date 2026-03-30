/**
 * Session Utility Functions
 * 
 * Shared utilities for session state management across the app.
 */

import type { Session } from '../types';

/**
 * Determines if the timer should show as paused.
 * Uses explicit session.paused state, NOT derived from endsAt.
 * 
 * @param session - The current session object
 * @returns true if the session is explicitly paused
 */
export function getTimerPausedState(session: Session | null): boolean {
  if (!session) return false; // No session = not paused (loading state handled separately)
  if (session.status === 'ended') return false; // Ended = not paused, show ended state
  if (session.paused === true) return true; // Explicit pause from host
  return false;
}

/**
 * Determines the display state for a session.
 * Maps session status to UI-friendly display states.
 */
export function getSessionDisplayState(session: Session | null): 'loading' | 'lobby' | 'active' | 'paused' | 'ended' {
  if (!session) return 'loading';
  if (session.paused) return 'paused';
  if (session.status === 'ended') return 'ended';
  if (session.status === 'lobby') return 'lobby';
  return 'active';
}

/**
 * Triggers haptic feedback on supported devices.
 * Falls back gracefully on unsupported devices.
 * 
 * @param type - Type of haptic feedback: 'light', 'medium', 'heavy', 'success', 'error'
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light'): void {
  // Check for Vibration API support
  if (!('vibrate' in navigator)) return;
  
  try {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate(40);
        break;
      case 'success':
        // Double tap pattern for success
        navigator.vibrate([10, 50, 10]);
        break;
      case 'error':
        // Triple tap pattern for error
        navigator.vibrate([20, 30, 20, 30, 20]);
        break;
    }
  } catch {
    // Silently fail if vibration is not allowed
  }
}

/**
 * Checks if the current device likely supports haptic feedback.
 */
export function supportsHaptic(): boolean {
  return 'vibrate' in navigator;
}

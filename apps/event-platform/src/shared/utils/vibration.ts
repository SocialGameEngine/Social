/**
 * Utility function for haptic feedback (vibration)
 * Uses the Web Vibration API which is supported on most mobile browsers
 */

/**
 * Triggers a vibration pattern on supported devices
 * @param pattern - Vibration pattern in milliseconds (single number or array)
 * @returns true if vibration was triggered, false if not supported
 */
export function vibrate(pattern: number | number[]): boolean {
  // Check if Vibration API is available
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
      return true;
    } catch (error) {
      // Vibration failed (e.g., user denied permission)
      console.warn('Vibration failed:', error);
      return false;
    }
  }
  return false;
}

/**
 * Short vibration for button clicks
 */
export function vibrateShort(): boolean {
  return vibrate(50);
}

/**
 * Medium vibration for important actions
 */
export function vibrateMedium(): boolean {
  return vibrate(100);
}

/**
 * Long vibration for significant events
 */
export function vibrateLong(): boolean {
  return vibrate(200);
}

/**
 * Success pattern vibration (short-short)
 */
export function vibrateSuccess(): boolean {
  return vibrate([50, 30, 50]);
}

/**
 * Error pattern vibration (long)
 */
export function vibrateError(): boolean {
  return vibrate(200);
}

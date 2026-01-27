/**
 * Session management utilities
 */

/**
 * Get or create a unique session ID for VIBox tracking
 * @returns Session ID string
 */
export function getSessionId(): string {
  let sessionId = sessionStorage.getItem('vibox-session-id');
  
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('vibox-session-id', sessionId);
  }
  
  return sessionId;
}

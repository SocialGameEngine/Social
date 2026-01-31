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

/**
 * Get the next library in rotation for Mashup mode
 */
export const getNextLibraryInRotation = (
  selectedLibraries: string[],
  currentIndex: number
): { nextLibrary: string; nextIndex: number } => {
  const nextIndex = (currentIndex + 1) % selectedLibraries.length;
  return {
    nextLibrary: selectedLibraries[nextIndex],
    nextIndex
  };
};

/**
 * Get the current library in rotation for Mashup mode
 */
export const getCurrentLibrary = (
  selectedLibraries: string[],
  currentIndex: number
): string => selectedLibraries[currentIndex];

/**
 * Validate library selection for Mashup mode (2-6 libraries)
 */
export const validateLibrarySelection = (libraries: string[]): boolean => {
  return libraries.length >= 2 && libraries.length <= 6;
};
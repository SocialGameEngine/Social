// =============================================================================
// TIMING CONSTANTS
// =============================================================================
// Centralized timing constants for phase durations and data staleness.

/**
 * Phase durations in seconds
 */
export const PHASE_DURATIONS = {
  ANSWER: 60,
  VOTE: 30,
  RESULTS: 15,
  REVEAL: 10,
} as const;

/**
 * Data staleness thresholds in milliseconds
 */
export const DATA_STALENESS = {
  ROOM: 7 * 24 * 60 * 60 * 1000,      // 7 days
  SESSION: 24 * 60 * 60 * 1000,       // 24 hours
  SOCIALE: 24 * 60 * 60 * 1000,       // 24 hours
  MEMBERSHIP: 12 * 60 * 60 * 1000,    // 12 hours
  REALTIME: 5 * 60 * 1000,            // 5 minutes
} as const;

/**
 * Session/Sociale default settings
 */
export const DEFAULT_SESSION_SETTINGS = {
  answerSecs: 90,
  voteSecs: 30,
  resultsSecs: 12,
  revealSecs: 15,
} as const;

/**
 * Timeout durations in milliseconds
 */
export const TIMEOUTS = {
  DEBOUNCE: 300,
  THROTTLE: 1000,
  RETRY: 2000,
  LONG_POLL: 30000,
} as const;

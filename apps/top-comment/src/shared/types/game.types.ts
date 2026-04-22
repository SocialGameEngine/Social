// =============================================================================
// SHARED GAME TYPES
// =============================================================================
// Common types used across Session and Sociale game modes.

/**
 * Game phase enum - used by both Session and Sociale.
 *
 * Extended in the P1 backlog wave:
 * - `reveal`   — staggered reveal theater (P1-1). TV leads the room by 200–400ms.
 * - `break`    — first-class drinks-break intermission (P1-8).
 * - `intermission` — reserved for future between-round breathing room.
 */
export type GamePhase = 
  | 'lobby'
  | 'answer'
  | 'vote'
  | 'reveal'
  | 'results'
  | 'break'
  | 'intermission'
  | 'ended';

/**
 * Alias for backward compatibility with Session
 */
export type SessionStatus = GamePhase;

/**
 * Phase transition metadata
 */
export interface PhaseTransition {
  from: GamePhase;
  to: GamePhase;
  timestamp: number;
  triggeredBy?: 'auto' | 'manual' | 'timer';
}

/**
 * Phase timing configuration
 */
export interface PhaseTiming {
  phase: GamePhase;
  duration: number; // seconds
  startedAt?: number; // timestamp
  pausedAt?: number; // timestamp
  totalPausedMs?: number;
}

/**
 * Common game state properties
 */
export interface BaseGameState {
  currentPhase: GamePhase;
  isPaused: boolean;
  startedAt?: number;
  endedAt?: number;
}

// Application layer types
// These types bridge the domain layer with React components

import type { GameState, SessionStatus } from '../../domain/types/domain.types';

/**
 * Enhanced game state with additional computed properties for UI
 */
export interface ApplicationGameState extends GameState {
  // Computed UI state
  isLoading: boolean;
  error: string | null;
  
  // Phase-specific state
  canAdvancePhase: boolean;
  canPauseSession: boolean;
  canResumeSession: boolean;
  
  // Timer state
  timeRemaining: number | null;
  isTimedPhase: boolean;
  
  // Progress tracking
  roundProgress: number;
  votingProgress: number;
  
  // Team-specific state (for current user)
  userTeam: {
    id: string;
    name: string;
    score: number;
    rank: number | null;
    isInCurrentRound: boolean;
    hasAnswered: boolean;
    hasVoted: boolean;
  } | null;
}

/**
 * Session orchestration state
 */
export interface SessionOrchestrationState {
  isAutoAdvanceEnabled: boolean;
  isPaused: boolean;
  nextPhase: SessionStatus | null;
  canAutoAdvance: boolean;
  autoAdvanceIn: number | null;
  lastTransitionAt: string | null;
}

/**
 * Hook return types
 */
export interface UseGameStateReturn extends ApplicationGameState {
  // Actions
  refresh: () => void;
  clearError: () => void;
}

export interface UseSessionOrchestratorReturn extends SessionOrchestrationState {
  // Actions
  advancePhase: () => Promise<boolean>;
  pauseSession: () => Promise<boolean>;
  resumeSession: () => Promise<boolean>;
  toggleAutoAdvance: () => void;
  setAutoAdvanceEnabled: (enabled: boolean) => void;
}

/**
 * Configuration for hooks
 */
export interface GameStateConfig {
  sessionId?: string;
  userId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface SessionOrchestratorConfig {
  sessionId: string;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
  enablePauseResume?: boolean;
}

/**
 * Error types
 */
export interface GameStateError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Event types for orchestration
 */
export interface PhaseTransitionEvent {
  from: SessionStatus;
  to: SessionStatus;
  timestamp: string;
  autoAdvanced: boolean;
}

export interface SessionPauseEvent {
  paused: boolean;
  timestamp: string;
  reason?: string;
}

/**
 * Hook dependencies (for testing)
 */
export interface GameStateDependencies {
  useSession: (sessionId?: string) => any;
  useTeams: (sessionId?: string) => any;
  useAnswers: (sessionId?: string, roundIndex?: number) => any;
  useVotes: (sessionId?: string, roundIndex?: number) => any;
}

export interface SessionOrchestratorDependencies {
  advancePhase: (sessionId: string) => Promise<any>;
  pauseSession: (sessionId: string, pause: boolean) => Promise<any>;
}

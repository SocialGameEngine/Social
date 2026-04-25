// Application layer types
// These types bridge the domain layer with React components

import type { GameState, SessionStatus } from '../../domain/types/domain.types';
import type { SocialeGameState, SocialeStatus, Sociale, Socialite, SocialeRoundType } from '../../domain/types/sociale.types';

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

// =============================================================================
// SOCIALE TYPES
// =============================================================================

/**
 * Enhanced Sociale game state with additional computed properties for UI
 */
export interface ApplicationSocialeState {
  // Base Sociale game state
  sociale: Sociale | null;
  rounds: any[];
  currentRound: any;
  currentRoundState: any;
  socialites: Socialite[];
  responses: any[];
  votes: any[];
  scoreboard: any[];
  roundSummaries: any[];
  
  // Computed UI state
  isLoading: boolean;
  error: string | null;
  
  // Phase-specific state
  canAdvancePhase: boolean;
  canPauseSociale: boolean;
  canResumeSociale: boolean;
  
  // Timer state
  timeRemaining: number | null;
  isTimedPhase: boolean;
  
  // Progress tracking
  roundProgress: number;
  phaseProgress: number;
  
  // Socialite-specific state (for current user)
  currentSocialite: Socialite | null;
}

/**
 * Sociale orchestration state
 */
export interface SocialeOrchestrationState {
  isAutoAdvanceEnabled: boolean;
  isPaused: boolean;
  nextPhase: string | null;
  canAutoAdvance: boolean;
  autoAdvanceIn: number | null;
  lastTransitionAt: string | null;
}

/**
 * Hook return types for Sociale
 */
export interface UseSocialeStateReturn extends ApplicationSocialeState {
  // Actions
  refresh: () => void;
  clearError: () => void;
}

export interface UseSocialeOrchestratorReturn extends SocialeOrchestrationState {
  // Actions
  advancePhase: () => Promise<boolean>;
  pauseSociale: () => Promise<boolean>;
  resumeSociale: () => Promise<boolean>;
  startSociale: () => Promise<boolean>;
  skipRound: () => Promise<boolean>;
  skipPhase: () => Promise<boolean>;
  handleTieBreak: (scoreboard: Record<string, number>) => Promise<boolean>;
  toggleAutoAdvance: () => void;
  setAutoAdvanceEnabled: (enabled: boolean) => void;
  
  // Registry integration methods
  getPhaseDuration: (roundType: SocialeRoundType, phase: string, settings?: any) => number;
  
  // Internal method
  updateSociale: (sociale: Sociale) => void;
}

/**
 * Configuration for Sociale hooks
 */
export interface SocialeStateConfig {
  socialeId?: string;
  userId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface SocialeOrchestratorConfig {
  socialeId: string;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
  enablePauseResume?: boolean;
}

/**
 * Error types for Sociale
 */
export interface SocialeGameStateError {
  type: 'state_computation' | 'data_fetch' | 'validation';
  message: string;
  details?: any;
}

export interface SocialeStateError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Event types for Sociale orchestration
 */
export interface SocialePhaseTransitionEvent {
  from: string;
  to: string;
  timestamp: string;
  autoAdvanced: boolean;
  roundType: string;
}

export interface SocialePauseEvent {
  paused: boolean;
  timestamp: string;
  reason?: string;
}

/**
 * Hook dependencies for Sociale (for testing)
 */
export interface SocialeStateDependencies {
  useSociale: (socialeId?: string) => any;
  useSocialites: (socialeId?: string) => any;
  useSocialeResponses: (socialeId?: string, roundId?: string) => any;
  useSocialeVotes: (socialeId?: string, roundId?: string) => any;
}

export interface SocialeOrchestratorDependencies {
  advanceSocialePhase: (socialeId: string) => Promise<any>;
  pauseSociale: (socialeId: string, pause: boolean) => Promise<any>;
  startSociale: (socialeId: string) => Promise<any>;
}

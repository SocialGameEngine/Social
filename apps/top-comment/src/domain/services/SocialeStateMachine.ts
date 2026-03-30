// =============================================================================
// SOCIALE STATE MACHINE
// =============================================================================
// State machine for Sociale lifecycle management.
// Based on SessionStateMachine.ts but round-type-aware.

import type { 
  Sociale, 
  SocialeStatus, 
  SocialeRoundState,
  Socialite,
  SocialeRoundType,
  SocialeStateMachineContext,
  SocialeTransitionValidation,
} from '../types/sociale.types';
import { 
  getDefaultPhases, 
  getNextPhase, 
  isFinalPhase,
  getPhaseDuration 
} from '../sociale/roundRegistry';

/**
 * Pure service for managing Sociale state transitions and validation
 * Contains no React dependencies and no side effects
 */
export class SocialeStateMachine {
  // Define valid state transitions for Sociale lifecycle
  private static readonly VALID_TRANSITIONS: Record<SocialeStatus, SocialeStatus[]> = {
    draft: ['lobby', 'cancelled'],
    lobby: ['active', 'cancelled'],
    active: ['paused', 'completed', 'cancelled'],
    paused: ['active', 'cancelled'],
    completed: [], // No transitions from completed
    cancelled: [], // No transitions from cancelled
  };

  /**
   * Check if a transition from one state to another is valid
   */
  static canTransition(from: SocialeStatus, to: SocialeStatus): boolean {
    return this.VALID_TRANSITIONS[from]?.includes(to) ?? false;
  }

  /**
   * Get all possible next states from the current state
   */
  static getPossibleNextStates(current: SocialeStatus): SocialeStatus[] {
    return this.VALID_TRANSITIONS[current] ?? [];
  }

  /**
   * Determine the next logical phase based on round type and context
   */
  static getNextPhase(
    currentPhase: string, 
    roundType: SocialeRoundType, 
    context: SocialeStateMachineContext
  ): string | null {
    // Get the next phase from round registry
    const nextPhase = getNextPhase(roundType, currentPhase);
    
    if (!nextPhase) {
      return null;
    }

    // Business rule validations for specific phases
    switch (nextPhase) {
      case 'answer':
        // Need at least 2 socialites to start answering
        if (context.socialiteCount < 2) {
          return null;
        }
        break;

      case 'vote':
        // Need responses to vote on
        if (!context.hasResponses) {
          return null;
        }
        break;

      case 'results':
        // Need votes for voting rounds
        if (!context.hasVotes && this.roundTypeSupportsVoting(roundType)) {
          return null;
        }
        break;

      case 'active':
        // For topic rounds, need at least 1 socialite
        if (roundType === 'topic' && context.socialiteCount < 1) {
          return null;
        }
        break;
    }

    return nextPhase;
  }

  /**
   * Build context for state machine decisions
   */
  static buildContext(
    sociale: Sociale | null,
    socialites: Socialite[],
    responses: any[],
    votes: any[],
    currentRoundState: SocialeRoundState | null
  ): SocialeStateMachineContext {
    if (!sociale) {
      return {
        socialeId: '',
        currentRoundType: 'prompt',
        currentPhase: 'draft',
        socialiteCount: 0,
        hasResponses: false,
        hasVotes: false,
        currentRoundComplete: false,
        allRoundsComplete: false,
        isPaused: false,
        currentRoundIndex: null,
      };
    }

    const activeSocialites = socialites.filter(s => s.isActive && !s.isBanned);
    const currentPhase = currentRoundState?.phase ?? 'pending';
    const currentRoundType = (currentRoundState?.derivedState?.roundType as SocialeRoundType) ?? 'prompt';

    // Check if current round is complete
    const currentRoundComplete = this.isRoundComplete(currentPhase, currentRoundType, responses, votes);

    // Check if all rounds are complete
    const allRoundsComplete = sociale.currentRoundIndex !== null 
      ? sociale.currentRoundIndex >= sociale.totalRounds - 1 && currentRoundComplete
      : false;

    return {
      socialeId: sociale.id,
      currentRoundType,
      currentPhase,
      socialiteCount: activeSocialites.length,
      hasResponses: responses.length > 0,
      hasVotes: votes.length > 0,
      currentRoundComplete,
      allRoundsComplete,
      isPaused: sociale.status === 'paused',
      currentRoundIndex: sociale.currentRoundIndex,
    };
  }

  /**
   * Validate a Sociale transition with business rules
   */
  static validateTransition(
    sociale: Sociale | null,
    nextStatus: SocialeStatus,
    context: SocialeStateMachineContext
  ): SocialeTransitionValidation {
    if (!sociale) {
      return {
        canTransition: false,
        reason: 'No active Sociale',
      };
    }

    // Check if transition is fundamentally valid
    if (!this.canTransition(sociale.status, nextStatus)) {
      return {
        canTransition: false,
        reason: `Cannot transition from ${sociale.status} to ${nextStatus}`,
      };
    }

    // Business rule validations
    switch (nextStatus) {
      case 'lobby':
        // Can always move to lobby from draft
        break;

      case 'active':
        if (context.socialiteCount < 1) {
          return {
            canTransition: false,
            reason: 'Need at least 1 participant to start',
          };
        }
        if (sociale.currentRoundIndex === null || sociale.currentRoundIndex >= sociale.totalRounds) {
          return {
            canTransition: false,
            reason: 'No valid round to start',
          };
        }
        break;

      case 'paused':
        if (sociale.status !== 'active') {
          return {
            canTransition: false,
            reason: 'Can only pause an active Sociale',
          };
        }
        break;

      case 'completed':
        // Can always complete
        break;

      case 'cancelled':
        // Can always cancel
        break;

      default:
        return {
          canTransition: false,
          reason: `Unknown target status: ${nextStatus}`,
        };
    }

    return {
      canTransition: true,
    };
  }

  /**
   * Check if a Sociale can be advanced automatically
   */
  static canAutoAdvance(
    sociale: Sociale | null, 
    context: SocialeStateMachineContext
  ): boolean {
    if (!sociale || sociale.status !== 'active' || context.isPaused) {
      return false;
    }

    const nextPhase = this.getNextPhase(context.currentPhase, context.currentRoundType, context);
    if (!nextPhase) {
      return false;
    }

    // Check if we should advance to next round instead of next phase
    if (isFinalPhase(context.currentRoundType, context.currentPhase) && context.currentRoundComplete) {
      return (context.currentRoundIndex ?? 0) < sociale.totalRounds - 1;
    }

    return true;
  }

  /**
   * Get the duration for a phase in seconds
   */
  static getPhaseDuration(
    phase: string, 
    roundType: SocialeRoundType, 
    settings: any
  ): number {
    return getPhaseDuration(roundType, phase, settings);
  }

  /**
   * Check if a phase is timed (has a duration limit)
   */
  static isTimedPhase(phase: string, roundType: SocialeRoundType): boolean {
    const phases = getDefaultPhases(roundType);
    const timedPhases = ['answer', 'vote', 'results', 'active', 'reveal'];
    return phases.includes(phase) && timedPhases.includes(phase);
  }

  /**
   * Get human-readable name for a phase
   */
  static getPhaseName(phase: string): string {
    const names: Record<string, string> = {
      draft: 'Draft',
      lobby: 'Lobby',
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed',
      cancelled: 'Cancelled',
      // Round phases
      question: 'Question',
      answer: 'Answer Phase',
      vote: 'Voting Phase',
      results: 'Results',
      reveal: 'Reveal',
      discussion: 'Discussion',
    };
    return names[phase] || phase;
  }

  /**
   * Check if a Sociale is in a playable state
   */
  static isPlayable(sociale: Sociale | null): boolean {
    return sociale !== null && 
           ['lobby', 'active'].includes(sociale.status);
  }

  /**
   * Check if a Sociale is in a final state
   */
  static isFinalState(sociale: Sociale | null): boolean {
    return sociale?.status === 'completed' || sociale?.status === 'cancelled' || false;
  }

  /**
   * Check if a round type supports voting
   */
  static roundTypeSupportsVoting(roundType: SocialeRoundType): boolean {
    const phases = getDefaultPhases(roundType);
    return phases.includes('vote');
  }

  /**
   * Check if a round is complete based on its phase and type
   */
  private static isRoundComplete(
    phase: string, 
    roundType: SocialeRoundType, 
    responses: any[], 
    votes: any[]
  ): boolean {
    // For voting rounds, need votes
    if (this.roundTypeSupportsVoting(roundType)) {
      return phase === 'results' && votes.length > 0;
    }

    // For non-voting rounds, check if we have responses and are in results phase
    return phase === 'results' && responses.length > 0;
  }

  /**
   * Get the next round index
   */
  static getNextRoundIndex(
    currentRoundIndex: number | null, 
    totalRounds: number, 
    currentRoundComplete: boolean
  ): number | null {
    if (currentRoundIndex === null) return 0;
    if (currentRoundComplete && currentRoundIndex < totalRounds - 1) {
      return currentRoundIndex + 1;
    }
    return null;
  }

  /**
   * Check if we should advance to next round
   */
  static shouldAdvanceToNextRound(
    currentPhase: string,
    roundType: SocialeRoundType,
    currentRoundIndex: number | null,
    totalRounds: number,
    currentRoundComplete: boolean
  ): boolean {
    return isFinalPhase(roundType, currentPhase) && 
           currentRoundComplete && 
           currentRoundIndex !== null && 
           currentRoundIndex < totalRounds - 1;
  }
}

import type { Session, SessionStatus, StateMachineContext, TransitionValidation } from '../types/domain.types';

/**
 * Pure service for managing session state transitions and validation
 * Contains no React dependencies and no side effects
 */
export class SessionStateMachine {
  // Define valid state transitions
  private static readonly VALID_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
    lobby: ['category-select', 'answer', 'ended'],
    'category-select': ['answer', 'ended'],
    answer: ['vote', 'ended'],
    vote: ['results', 'ended'],
    results: ['answer', 'vote', 'ended'],
    ended: [] // No transitions from ended state
  };

  /**
   * Check if a transition from one state to another is valid
   * @param from - Current state
   * @param to - Target state
   * @returns Whether the transition is valid
   */
  static canTransition(from: SessionStatus, to: SessionStatus): boolean {
    return this.VALID_TRANSITIONS[from]?.includes(to) ?? false;
  }

  /**
   * Get all possible next states from the current state
   * @param current - Current state
   * @returns Array of possible next states
   */
  static getPossibleNextStates(current: SessionStatus): SessionStatus[] {
    return this.VALID_TRANSITIONS[current] ?? [];
  }

  /**
   * Determine the next logical phase based on context
   * @param current - Current state
   * @param context - State machine context
   * @returns Recommended next state
   */
  static getNextPhase(current: SessionStatus, context: StateMachineContext): SessionStatus | null {
    switch (current) {
      case 'lobby':
        // Need at least 2 teams to start
        return context.teamCount >= 2 ? 'answer' : null;

      case 'answer':
        // Move to vote if we have answers
        return context.hasAnswers ? 'vote' : null;

      case 'vote':
        // Move to results if we have votes
        return context.hasVotes ? 'results' : null;

      case 'results':
        // If current round is complete, move to next round
        if (context.currentRoundComplete) {
          // If all rounds are complete, end the session
          return context.allRoundsComplete ? 'ended' : 'answer';
        }
        // Otherwise, can go back to vote for next group
        return 'vote';

      case 'ended':
        return null; // No transitions from ended

      default:
        return null;
    }
  }

  /**
   * Build context for state machine decisions
   * @param session - Current session
   * @param teams - Array of teams
   * @param answers - Array of answers
   * @param votes - Array of votes
   * @returns State machine context
   */
  static buildContext(
    session: Session | null,
    teams: { id: string; isHost: boolean }[],
    answers: { roundIndex: number }[],
    votes: { roundIndex: number }[]
  ): StateMachineContext {
    if (!session) {
      return {
        teamCount: 0,
        hasAnswers: false,
        hasVotes: false,
        currentRoundComplete: false,
        allRoundsComplete: false
      };
    }

    const nonHostTeams = teams.filter(team => !team.isHost);
    const currentRoundAnswers = answers.filter(a => a.roundIndex === session.roundIndex);
    const currentRoundVotes = votes.filter(v => v.roundIndex === session.roundIndex);

    // Check if current round is complete (all groups have been voted on)
    const currentRoundComplete = session.voteGroupIndex !== null && 
      session.voteGroupIndex >= (session.rounds[session.roundIndex]?.groups.length ?? 0) - 1;

    // Check if all rounds are complete
    const allRoundsComplete = session.roundIndex >= session.rounds.length - 1 && currentRoundComplete;

    return {
      teamCount: nonHostTeams.length,
      hasAnswers: currentRoundAnswers.length > 0,
      hasVotes: currentRoundVotes.length > 0,
      currentRoundComplete,
      allRoundsComplete
    };
  }

  /**
   * Validate a session transition with business rules
   * @param session - Current session
   * @param nextPhase - Desired next phase
   * @param teamCount - Number of teams in session
   * @returns Transition validation result
   */
  static validateTransition(
    session: Session | null,
    nextPhase: SessionStatus,
    teamCount: number
  ): TransitionValidation {
    if (!session) {
      return {
        canTransition: false,
        reason: 'No active session'
      };
    }

    // Check if transition is fundamentally valid
    if (!this.canTransition(session.status, nextPhase)) {
      return {
        canTransition: false,
        reason: `Cannot transition from ${session.status} to ${nextPhase}`
      };
    }

    // Business rule validations
    switch (nextPhase) {
      case 'answer':
        if (teamCount < 2) {
          return {
            canTransition: false,
            reason: 'Need at least 2 teams to start answering'
          };
        }
        if (session.roundIndex >= session.rounds.length) {
          return {
            canTransition: false,
            reason: 'No more rounds available'
          };
        }
        break;

      case 'vote':
        if (session.roundIndex >= session.rounds.length) {
          return {
            canTransition: false,
            reason: 'No active round for voting'
          };
        }
        if (session.voteGroupIndex !== null && 
            session.voteGroupIndex >= (session.rounds[session.roundIndex]?.groups.length ?? 0)) {
          return {
            canTransition: false,
            reason: 'No more groups to vote on in current round'
          };
        }
        break;

      case 'results':
        if (session.voteGroupIndex === null) {
          return {
            canTransition: false,
            reason: 'No voting group selected for results'
          };
        }
        break;

      case 'ended':
        // Can always end a session
        break;

      default:
        return {
          canTransition: false,
          reason: `Unknown target phase: ${nextPhase}`
        };
    }

    return {
      canTransition: true
    };
  }

  /**
   * Check if a session can be advanced automatically
   * @param session - Current session
   * @param context - State machine context
   * @returns Whether auto-advance is possible
   */
  static canAutoAdvance(session: Session | null, context: StateMachineContext): boolean {
    if (!session || session.paused) {
      return false;
    }

    const nextPhase = this.getNextPhase(session.status, context);
    if (!nextPhase) {
      return false;
    }

    const validation = this.validateTransition(session, nextPhase, context.teamCount);
    return validation.canTransition;
  }

  /**
   * Get the duration for a phase in seconds
   * @param phase - Session phase
   * @param settings - Session settings
   * @returns Duration in seconds
   */
  static getPhaseDuration(phase: SessionStatus, settings: { answerSecs: number; voteSecs: number; resultsSecs: number }): number {
    switch (phase) {
      case 'answer':
        return settings.answerSecs;
      case 'vote':
        return settings.voteSecs;
      case 'results':
        return settings.resultsSecs;
      default:
        return 0; // lobby and ended have no time limit
    }
  }

  /**
   * Check if a phase is timed (has a duration limit)
   * @param phase - Session phase
   * @returns Whether the phase is timed
   */
  static isTimedPhase(phase: SessionStatus): boolean {
    return ['category-select', 'answer', 'vote', 'results'].includes(phase);
  }

  /**
   * Get human-readable name for a phase
   * @param phase - Session phase
   * @returns Human-readable phase name
   */
  static getPhaseName(phase: SessionStatus): string {
    const names: Record<SessionStatus, string> = {
      lobby: 'Lobby',
      'category-select': 'Category Selection',
      answer: 'Answer Phase',
      vote: 'Voting Phase',
      results: 'Results',
      ended: 'Ended'
    };
    return names[phase] || phase;
  }

  /**
   * Check if a session is in a playable state
   * @param session - Current session
   * @returns Whether the session is playable
   */
  static isPlayable(session: Session | null): boolean {
    return session !== null && 
           session.status !== 'ended' && 
           !session.paused;
  }

  /**
   * Check if a session is in a final state
   * @param session - Current session
   * @returns Whether the session is in a final state
   */
  static isFinalState(session: Session | null): boolean {
    return session?.status === 'ended' || false;
  }
}

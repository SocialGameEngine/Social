import type { GamePhase, PhaseConfig, PhaseConfigMap, RoomPageError } from '../types';
import type { Session } from '../../../shared/types';

export const PHASE_CONFIG: PhaseConfigMap = {
  lobby: {
    title: 'Lobby',
    description: 'Waiting for the host to start the game',
    buttonText: 'Ready to Play',
    submittedText: 'Ready',
    color: 'primary',
  },
  answer: {
    title: 'Answer Phase',
    description: 'Submit your answer to the prompt',
    buttonText: 'Submit Answer',
    submittedText: 'Answer Submitted',
    color: 'primary',
  },
  vote: {
    title: 'Vote Phase',
    description: 'Vote for your favorite answer',
    buttonText: 'Cast Vote',
    submittedText: 'Vote Cast',
    color: 'secondary',
  },
  results: {
    title: 'Results',
    description: 'View the results of the round',
    buttonText: 'View Results',
    submittedText: 'Results Viewed',
    color: 'accent',
  },
  ended: {
    title: 'Game Ended',
    description: 'The game has ended',
    buttonText: 'Game Over',
    submittedText: 'Finished',
    color: 'primary',
  },
};

export function getPhaseConfig(phase: GamePhase): PhaseConfig {
  return PHASE_CONFIG[phase] ?? PHASE_CONFIG.lobby;
}

export function isActionPhase(phase: GamePhase): boolean {
  return phase === 'lobby' || phase === 'answer' || phase === 'vote';
}

export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return '0:00';
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function canSubmit(
  phase: GamePhase,
  hasSubmitted: boolean,
  endsAt?: string
): boolean {
  // Can't submit if phase doesn't allow actions
  if (!isActionPhase(phase)) return false;
  
  // Check if time has expired
  if (endsAt) {
    const endTime = new Date(endsAt).getTime();
    if (Date.now() >= endTime) return false;
  }
  
  // Can submit if hasn't submitted yet
  return !hasSubmitted;
}

export function createError(
  type: RoomPageError['type'],
  message: string,
  recoverable: boolean = true
): RoomPageError {
  return {
    type,
    message,
    recoverable,
  };
}

export function getSessionPhase(session: Session | null): GamePhase {
  if (!session) return 'lobby';
  
  // Session status already matches GamePhase
  switch (session.status) {
    case 'lobby':
      return 'lobby';
    case 'answer':
      return 'answer';
    case 'vote':
      return 'vote';
    case 'results':
      return 'results';
    case 'ended':
      return 'ended';
    default:
      return 'lobby';
  }
}

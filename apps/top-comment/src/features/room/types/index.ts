import type { Dispatch } from 'react';
import type { Session, Room, RoomMembership } from '../../../shared/types';

export type GamePhase = 'lobby' | 'answer' | 'vote' | 'reveal' | 'results' | 'ended' | 'break';
export type ModalType = 'answer' | 'vote' | 'leaderboard' | 'selfie' | null;

export interface SubmissionStatus {
  answer: boolean;
  vote: boolean;
}

export interface RoomPageError {
  type: 'ROOM_NOT_FOUND' | 'SESSION_ERROR' | 'SUBMISSION_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN';
  message: string;
  recoverable: boolean;
}

export interface SocialeModalContext {
  socialeId: string;
  roundId: string;
  prompt: string;
  roundIndex: number;
  roundType?: string;
  roundSettings?: any; // Add round settings for MC/written answer
  phaseEndsAt?: string | null;
  phaseStartedAt?: string | null;
  voteSeconds?: number;
  paused: boolean;
}

export interface RoomPageState {
  activeModal: ModalType;
  submissionStatus: SubmissionStatus;
  error: RoomPageError | null;
  isLoading: boolean;
  endedModals: ('leaderboard' | 'selfie')[];
  socialeModalContext?: SocialeModalContext; // Add Sociale modal context
}

export interface PhaseConfig {
  title: string;
  description: string;
  buttonText: string;
  submittedText: string;
  color: 'primary' | 'secondary' | 'accent';
}

export type PhaseConfigMap = Record<GamePhase, PhaseConfig>;

export interface RoomPageContextValue {
  state: RoomPageState;
  room: Room | null;
  memberships: RoomMembership[] | null;
  session: Session | null;
  sessionId: string | null;
  dispatch: Dispatch<RoomPageAction>;
}

export type RoomPageAction =
  | { type: 'OPEN_MODAL'; payload: ModalType }
  | { type: 'OPEN_SOCIALE_MODAL'; payload: SocialeModalContext }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_SUBMISSION_STATUS'; payload: { type: 'answer' | 'vote'; submitted: boolean } }
  | { type: 'SET_ERROR'; payload: RoomPageError | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET_SUBMISSIONS' }
  | { type: 'OPEN_ENDED_MODAL'; payload: 'leaderboard' | 'selfie' }
  | { type: 'CLOSE_ENDED_MODAL'; payload: 'leaderboard' | 'selfie' };

export interface UseRoomPageReturn {
  state: RoomPageState;
  room: Room | null;
  memberships: RoomMembership[] | null;
  session: Session | null;
  sessionId: string | null;
  openModal: (type: 'answer' | 'vote') => void;
  closeModal: () => void;
  markSubmitted: (type: 'answer' | 'vote') => void;
  openEndedModal: (type: 'leaderboard' | 'selfie') => void;
  closeEndedModal: (type: 'leaderboard' | 'selfie') => void;
  clearError: () => void;
  handleLeaveRoom: () => Promise<void>;
}

import type { Dispatch } from 'react';
import type { Session, Room, RoomMembership } from '../../../shared/types';

export type GamePhase = 'lobby' | 'answer' | 'vote' | 'results' | 'ended';
export type ModalType = 'answer' | 'vote' | null;

export interface SubmissionStatus {
  answer: boolean;
  vote: boolean;
}

export interface RoomPageError {
  type: 'ROOM_NOT_FOUND' | 'SESSION_ERROR' | 'SUBMISSION_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN';
  message: string;
  recoverable: boolean;
}

export interface RoomPageState {
  activeModal: ModalType;
  submissionStatus: SubmissionStatus;
  error: RoomPageError | null;
  isLoading: boolean;
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
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_SUBMISSION_STATUS'; payload: { type: 'answer' | 'vote'; submitted: boolean } }
  | { type: 'SET_ERROR'; payload: RoomPageError | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET_SUBMISSIONS' };

export interface UseRoomPageReturn {
  state: RoomPageState;
  room: Room | null;
  memberships: RoomMembership[] | null;
  session: Session | null;
  sessionId: string | null;
  openModal: (type: 'answer' | 'vote') => void;
  closeModal: () => void;
  markSubmitted: (type: 'answer' | 'vote') => void;
  clearError: () => void;
  handleLeaveRoom: () => Promise<void>;
}

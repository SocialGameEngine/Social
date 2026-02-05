import { useCallback, useEffect } from 'react';
import { useRoomPageContext } from '../context/RoomPageContext';
import { getSessionPhase } from '../utils/phaseConfig';

export function usePhaseManager() {
  const { state, session, dispatch } = useRoomPageContext();

  const currentPhase = getSessionPhase(session);

  // Reset submission status when phase changes
  useEffect(() => {
    dispatch({ type: 'RESET_SUBMISSIONS' });
    dispatch({ type: 'CLOSE_MODAL' });
  }, [currentPhase, dispatch]);

  const openModal = useCallback((type: 'answer' | 'vote') => {
    dispatch({ type: 'OPEN_MODAL', payload: type });
  }, [dispatch]);

  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, [dispatch]);

  const markSubmitted = useCallback((type: 'answer' | 'vote') => {
    dispatch({ type: 'SET_SUBMISSION_STATUS', payload: { type, submitted: true } });
  }, [dispatch]);

  return {
    currentPhase,
    activeModal: state.activeModal,
    submissionStatus: state.submissionStatus,
    openModal,
    closeModal,
    markSubmitted,
  };
}

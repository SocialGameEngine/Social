import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomPageContext } from '../context/RoomPageContext';
import { usePhaseManager } from './usePhaseManager';
import { roomMembershipService } from '../../../services/roomMembershipService';
import { useAuth } from '../../../shared/providers/AuthContext';
import type { UseRoomPageReturn } from '../types';

export function useRoomPage(): UseRoomPageReturn {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state, room, memberships, session, sessionId, dispatch } = useRoomPageContext();
  const phaseManager = usePhaseManager();

  const handleLeaveRoom = useCallback(async (): Promise<void> => {
    if (!room || !user) return;

    try {
      const myMembership = memberships?.find(m => m.userId === user.id);
      if (myMembership) {
        await roomMembershipService.leaveRoom({
          roomId: room.id,
          userId: user.id,
        });
      }
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { 
          type: 'NETWORK_ERROR', 
          message: 'Successfully left room', 
          recoverable: true 
        } 
      });
      navigate('/join');
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { 
          type: 'NETWORK_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to leave room', 
          recoverable: true 
        } 
      });
      // Still navigate even if leave fails
      navigate('/join');
    }
  }, [room, user, memberships, navigate]);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, [dispatch]);

  return {
    state,
    room,
    memberships,
    session,
    sessionId,
    openModal: phaseManager.openModal,
    closeModal: phaseManager.closeModal,
    markSubmitted: phaseManager.markSubmitted,
    openEndedModal: phaseManager.openEndedModal,
    closeEndedModal: phaseManager.closeEndedModal,
    clearError,
    handleLeaveRoom,
  };
}

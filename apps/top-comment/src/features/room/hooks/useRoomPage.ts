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
      navigate('/join');
    } catch (error) {
      console.error('Failed to leave room:', error);
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
    clearError,
    handleLeaveRoom,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../shared/providers/AuthContext';
import { sessionPlayerService } from '../../../../services/sessionPlayerService';
import { PhaseButton } from '../../components/PhaseButton';
import { Modal } from '../../../../components/Modal';
import { Button } from '../../../../components/Button';
import type { Session, RoomMembership } from '../../../../shared/types';
import type { SessionPlayer } from '../../../../services/sessionPlayerService';

interface LobbyPhaseProps {
  session: Session | null;
  memberships: RoomMembership[] | null;
}

export function LobbyPhase({ session, memberships }: LobbyPhaseProps) {
  const { user } = useAuth();
  const [sessionPlayer, setSessionPlayer] = useState<SessionPlayer | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Get user's display name from membership
  const myMembership = user ? memberships?.find(m => m.userId === user.id) : null;
  const displayName = myMembership?.playerName || user?.user_metadata?.display_name || 'Player';

  // Subscribe to session player changes
  useEffect(() => {
    if (!session?.id || !user?.id) {
      setSessionPlayer(null);
      return;
    }

    const unsubscribe = sessionPlayerService.subscribeToSessionPlayer(
      session.id,
      user.id,
      (player) => {
        setSessionPlayer(player);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [session?.id, user?.id]);

  const handleJoinSession = useCallback(async () => {
    if (!session?.id || isJoining) return;

    setIsJoining(true);
    try {
      await sessionPlayerService.joinSessionAsPlayer({
        sessionId: session.id,
        displayName,
      });
    } catch (error) {
      console.error('Failed to join session:', error);
    } finally {
      setIsJoining(false);
    }
  }, [session?.id, displayName, isJoining]);

  const handleLeaveSession = useCallback(async () => {
    if (!session?.id || !sessionPlayer?.id || isLeaving) return;

    setIsLeaving(true);
    try {
      await sessionPlayerService.leaveSessionAsPlayer({
        sessionId: session.id,
        playerId: sessionPlayer.id,
      });
      
      // Manually clear session player state to ensure UI updates immediately
      setSessionPlayer(null);
    } catch (error) {
      console.error('Failed to leave session:', error);
    } finally {
      setIsLeaving(false);
      setShowLeaveConfirm(false);
    }
  }, [session?.id, sessionPlayer?.id, isLeaving]);

  const handleLeaveClick = useCallback(() => {
    setShowLeaveConfirm(true);
  }, []);

  const handleCancelLeave = useCallback(() => {
    setShowLeaveConfirm(false);
  }, []);

  const isInSession = !!sessionPlayer;

  // Handle different session states
  if (!session) {
    return (
      <div className="w-full mb-8">
        <div className="text-center py-8 text-cyan-300">
          <p className="text-lg font-semibold">No active session</p>
          <p className="text-sm mt-2">Waiting for the host to start a session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mb-8">
      <PhaseButton 
        phase="lobby"
        hasSubmitted={isInSession}
        onClick={handleJoinSession}
        disabled={isJoining || isInSession}
      />
      {isInSession && (
        <div className="pt-3 flex justify-center">
          <button
            onClick={handleLeaveClick}
            disabled={isLeaving}
            className="chaos-leave-button text-sm px-4 py-2 bg-slate-700 hover:bg-slate-600 text-cyan-300 rounded-lg transition-colors"
          >
            {isLeaving ? 'Leaving...' : 'Leave Session'}
          </button>
        </div>
      )}
      
      <Modal
        open={showLeaveConfirm}
        onClose={handleCancelLeave}
        title="Leave Session"
      >
        <div className="space-y-4">
          <p className="text-cyan-100">
            Are you sure you want to leave this session?
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={handleCancelLeave}
              disabled={isLeaving}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleLeaveSession}
              disabled={isLeaving}
            >
              {isLeaving ? 'Leaving...' : 'Leave Session'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

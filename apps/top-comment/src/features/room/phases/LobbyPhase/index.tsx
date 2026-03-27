import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../shared/providers/AuthContext';
import { sessionPlayerService } from '../../../../services/sessionPlayerService';
import { joinRoomSession } from '../../../session/sessionService';
import { SessionButton } from '../../components/layout/SessionButton';
import { getIsMainEventMode } from '../../components/PhaseController';
import { Modal } from '../../../../components/Modal';
import { Button } from '../../../../components/Button';
import { useToast } from '../../../../shared/hooks/useToast';
import type { Session, RoomMembership } from '../../../../shared/types';
import type { SessionPlayer } from '../../../../services/sessionPlayerService';

interface LobbyPhaseProps {
  session: Session | null;
  memberships: RoomMembership[] | null;
}

export function LobbyPhase({ session, memberships }: LobbyPhaseProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessionPlayer, setSessionPlayer] = useState<SessionPlayer | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
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
    if (!session?.id || !session?.roomId || isJoining) return;

    setIsJoining(true);
    try {
      const result = await joinRoomSession({
        sessionId: session.id,
        roomId: session.roomId,
        playerName: displayName
      });

      if (result.success) {
        setJoinSuccess(true);
        setTimeout(() => setJoinSuccess(false), 2000);
        toast({ 
          title: "Joined game!", 
          variant: "success",
          description: "You're ready to play"
        });
      } else {
        toast({ 
          title: "Failed to join", 
          variant: "error",
          description: result.message
        });
      }
    } catch (error) {
      console.error('Failed to join session:', error);
      toast({ 
        title: "Failed to join game", 
        variant: "error",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsJoining(false);
    }
  }, [session?.id, session?.roomId, displayName, isJoining, toast]);

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
  const isMainEventMode = getIsMainEventMode(session);

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
      <SessionButton
        displayState={isInSession ? "joined" : "forming"}
        session={session}
        isMainEventMode={isMainEventMode}
        isJoining={isJoining}
        joinSuccess={joinSuccess}
        phase="lobby"
        onClick={isInSession ? handleLeaveClick : handleJoinSession}
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

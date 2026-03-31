import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../../shared/providers/AuthContext';
import { SocialeGameButton } from '../../components/layout/SocialeGameButton';
import { getIsMainEventModeFromSociale } from '../../components/PhaseController';
import { Modal } from '../../../../components/Modal';
import { Button } from '../../../../components/Button';
import { useToast } from '../../../../shared/hooks/useToast';
import { triggerHaptic } from '../../../../shared/utils/sessionUtils';
import type { RoomMembership } from '../../../../shared/types';
import type { Sociale, Socialite } from '../../../../domain/types/sociale.types';
import {
  useJoinSociale,
  useLeaveSociale,
  useCurrentSocialite,
  useSocialites,
} from '../../../../features/sociale';

type JoinState = 'idle' | 'joining' | 'joined' | 'error';

interface SocialeLobbyPhaseRoomProps {
  sociale: Sociale;
  roomId: string;
  memberships: RoomMembership[] | null;
}

export function SocialeLobbyPhaseRoom({ sociale, roomId, memberships }: SocialeLobbyPhaseRoomProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [joinState, setJoinState] = useState<JoinState>('idle');
  const [isLeaving, setIsLeaving] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const lastJoinAttemptRef = useRef<number>(0);
  const JOIN_DEBOUNCE_MS = 500;

  const { data: socialites = [] } = useSocialites(sociale.id);
  const { data: currentSocialite } = useCurrentSocialite(sociale.id, user?.id);
  const joinSociale = useJoinSociale();
  const leaveSociale = useLeaveSociale();

  const isJoining = joinState === 'joining';
  const joinSuccess = joinState === 'joined';

  const myMembership = user ? memberships?.find((m) => m.userId === user.id) : null;
  const displayName = myMembership?.playerName || user?.user_metadata?.display_name || 'Player';

  useEffect(() => {
    if (currentSocialite && joinState !== 'joined') {
      setJoinState('joined');
    }
    if (!currentSocialite && joinState === 'joined') {
      setJoinState('idle');
    }
  }, [currentSocialite, joinState]);

  const handleJoin = useCallback(async () => {
    if (!user?.id || !sociale?.id) return;
    const now = Date.now();
    if (now - lastJoinAttemptRef.current < JOIN_DEBOUNCE_MS) return;
    lastJoinAttemptRef.current = now;
    if (joinState === 'joining' || joinState === 'joined') return;

    setJoinState('joining');
    triggerHaptic('medium');

    try {
      await joinSociale.mutateAsync({
        socialeId: sociale.id,
        roomId,
        userId: user.id,
        displayName,
      });
      setJoinState('joined');
      triggerHaptic('success');
      toast({ title: 'Joined Sociale!', variant: 'success', description: "You're ready to play" });
      await queryClient.invalidateQueries({ queryKey: ['socialites', sociale.id] });
    } catch (error) {
      console.error('Failed to join Sociale:', error);
      setJoinState('error');
      triggerHaptic('error');
      toast({
        title: 'Failed to join',
        variant: 'error',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      setTimeout(() => setJoinState('idle'), 1500);
    }
  }, [user?.id, sociale.id, roomId, displayName, joinState, joinSociale, toast, queryClient]);

  const handleLeave = useCallback(async () => {
    if (!currentSocialite?.id || isLeaving) return;
    setIsLeaving(true);
    try {
      await leaveSociale.mutateAsync(currentSocialite.id);
      setJoinState('idle');
      await queryClient.invalidateQueries({ queryKey: ['socialites', sociale.id] });
      await queryClient.invalidateQueries({ queryKey: ['socialite', sociale.id, user?.id] });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLeaving(false);
      setShowLeaveConfirm(false);
    }
  }, [currentSocialite?.id, isLeaving, leaveSociale, queryClient, sociale.id, user?.id]);

  const isInSociale = !!currentSocialite;
  const isMainEventMode = getIsMainEventModeFromSociale(sociale);

  const participants: { displayName: string }[] = (socialites as Socialite[]).map((s) => ({
    displayName: s.displayName || 'Player',
  }));

  return (
    <div className="w-full mb-8">
      <SocialeGameButton
        displayState={isInSociale ? 'joined' : 'forming'}
        participants={participants}
        isMainEventMode={isMainEventMode}
        isJoining={isJoining}
        joinSuccess={joinSuccess}
        phase="lobby"
        onClick={isInSociale ? () => {} : handleJoin}
      />
      {isInSociale && (
        <div className="pt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setShowLeaveConfirm(true)}
            disabled={isLeaving}
            className="chaos-leave-button text-sm px-4 py-2 bg-slate-700 hover:bg-slate-600 text-cyan-300 rounded-lg transition-colors"
          >
            {isLeaving ? 'Leaving...' : 'Leave Sociale'}
          </button>
        </div>
      )}

      <Modal open={showLeaveConfirm} onClose={() => setShowLeaveConfirm(false)} title="Leave Sociale">
        <div className="space-y-4">
          <p className="text-cyan-100">Are you sure you want to leave this Sociale?</p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowLeaveConfirm(false)} disabled={isLeaving}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void handleLeave()} disabled={isLeaving}>
              {isLeaving ? 'Leaving...' : 'Leave'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

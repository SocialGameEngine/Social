import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SessionTimer } from '@social/ui';
import { useAuth } from '../../../../shared/providers/AuthContext';
import { useToast } from '../../../../shared/hooks/useToast';
import { triggerHaptic } from '../../../../shared/utils/sessionUtils';
import type { RoomMembership } from '../../../../shared/types';
import type { Sociale } from '../../../../domain/types/sociale.types';
import type { GamePhase } from '../../types';
import { SocialeGameButton, type SocialeGameParticipant } from '../../components/layout/SocialeGameButton';
import { getIsMainEventModeFromSociale } from '../../utils/sessionPhase';
import { buildSocialeTimerSessionShim } from '../../utils/socialeTimerShim';
import { usePhaseTimer } from '../../../../shared/hooks';
import { useJoinSociale } from '../../../../features/sociale';

type MidJoinMode = 'join' | 'waiting';

interface SocialeMidGameJoinCardProps {
  sociale: Sociale;
  roomId: string;
  roomPhase: GamePhase;
  memberships: RoomMembership[] | null;
  participants: SocialeGameParticipant[];
  mode: MidJoinMode;
  phaseEndsAt?: string | null;
}

export function SocialeMidGameJoinCard({
  sociale,
  roomId,
  roomPhase,
  memberships,
  participants,
  mode,
  phaseEndsAt,
}: SocialeMidGameJoinCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const joinSociale = useJoinSociale();
  const [isJoining, setIsJoining] = useState(false);
  const lastJoinAttemptRef = useRef<number>(0);
  const JOIN_DEBOUNCE_MS = 500;

  const isMainEventMode = getIsMainEventModeFromSociale(sociale);
  const timerPhase =
    roomPhase === 'vote' ? 'vote' : roomPhase === 'results' ? 'results' : 'answer';
  const timerShim = buildSocialeTimerSessionShim(sociale, timerPhase);
  const { totalSeconds } = usePhaseTimer({ session: timerShim });
  const isPaused = sociale.status === 'paused';

  const myMembership = user ? memberships?.find((m) => m.userId === user.id) : null;
  const displayName =
    myMembership?.playerName || user?.user_metadata?.display_name || 'Player';

  const handleJoinNextRound = useCallback(async () => {
    if (!user?.id || mode !== 'join') return;
    const now = Date.now();
    if (now - lastJoinAttemptRef.current < JOIN_DEBOUNCE_MS) return;
    lastJoinAttemptRef.current = now;
    if (isJoining) return;

    setIsJoining(true);
    triggerHaptic('medium');
    try {
      await joinSociale.mutateAsync({
        socialeId: sociale.id,
        roomId,
        userId: user.id,
        displayName,
        joinNextRound: true,
      });
      triggerHaptic('success');
      toast({
        title: "You're in next round",
        variant: 'success',
        description: "You'll be in on the next round.",
      });
      await queryClient.invalidateQueries({ queryKey: ['socialites', sociale.id] });
      await queryClient.invalidateQueries({ queryKey: ['socialite', sociale.id, user.id] });
    } catch (error) {
      console.error('Join next round failed:', error);
      triggerHaptic('error');
      toast({
        title: 'Could not join',
        variant: 'error',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsJoining(false);
    }
  }, [
    user?.id,
    mode,
    isJoining,
    joinSociale,
    sociale.id,
    roomId,
    displayName,
    toast,
    queryClient,
  ]);

  if (mode === 'waiting') {
    return (
      <div className="w-full mb-8">
        <SocialeGameButton
          displayState="joined"
          participants={participants}
          isMainEventMode={isMainEventMode}
          phase={timerPhase}
          joinSuccess
          successSupportText="You'll be in on the next round."
          copyOverride={{
            statusBadgeText: 'WAITING',
            headlineText: "YOU'RE IN NEXT ROUND",
            supportText: "You'll be in on the next round. Hang tight — same chaos as everyone else.",
            joinedCountText: null,
          }}
          interactionDisabled
          onClick={() => {}}
        />
        <SessionTimer
          endTime={phaseEndsAt ?? undefined}
          totalSeconds={totalSeconds}
          paused={isPaused}
          variant="brand"
          isDark={false}
          position="inline"
          showCriticalBar
        />
      </div>
    );
  }

  return (
    <div className="w-full mb-8">
      <SocialeGameButton
        displayState="forming"
        participants={participants}
        isMainEventMode={isMainEventMode}
        isJoining={isJoining}
        joinSuccess={false}
        phase={timerPhase}
        copyOverride={{
          statusBadgeText: 'SPECTATING',
          headlineText: 'JOIN NEXT ROUND',
          supportText: 'Tap to enter the next round — you will not play the current one.',
          joinedCountText: null,
        }}
        onClick={() => void handleJoinNextRound()}
      />
      <SessionTimer
        endTime={phaseEndsAt ?? undefined}
        totalSeconds={totalSeconds}
        paused={isPaused}
        variant="brand"
        isDark={false}
        position="inline"
        showCriticalBar
      />
    </div>
  );
}

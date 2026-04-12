import { SocialeGameButton } from '../../components/layout/SocialeGameButton';
import { SessionTimer } from '@social/ui';
import { usePhaseTimer } from '../../../../shared/hooks';
import { getIsMainEventModeFromSociale } from '../../components/PhaseController';
import { buildSocialeTimerSessionShim } from '../../utils/socialeTimerShim';
import type { Sociale } from '../../../../domain/types/sociale.types';
import type { SocialeGameParticipant } from '../../components/layout/SocialeGameButton';

interface SocialeVotePhaseRoomProps {
  sociale: Sociale;
  hasSubmitted: boolean;
  onOpenModal?: (type: 'answer' | 'vote') => void;
  participants: SocialeGameParticipant[];
  phaseEndsAt?: string | null;
  pausedRemainingSeconds?: number | null;
  isPaused?: boolean;
}

export function SocialeVotePhaseRoom({
  sociale,
  hasSubmitted,
  onOpenModal,
  participants,
  phaseEndsAt,
  pausedRemainingSeconds,
  isPaused = sociale.status === 'paused',
}: SocialeVotePhaseRoomProps) {
  const isMainEventMode = getIsMainEventModeFromSociale(sociale);
  const timerShim = buildSocialeTimerSessionShim(sociale, 'vote');
  const { totalSeconds } = usePhaseTimer({ session: timerShim });
  const pausedSecondsValue = isPaused && pausedRemainingSeconds != null ? pausedRemainingSeconds : undefined;

  return (
    <div className="w-full mb-8">
      <SocialeGameButton
        displayState={hasSubmitted ? 'voted' : 'vote'}
        participants={participants}
        isMainEventMode={isMainEventMode}
        phase="vote"
        onClick={() => onOpenModal?.('vote')}
      />
      <SessionTimer
        endTime={phaseEndsAt ?? undefined}
        totalSeconds={totalSeconds}
        paused={isPaused}
        pausedSeconds={pausedSecondsValue}
        variant="brand"
        isDark={false}
        position="inline"
        showCriticalBar={true}
      />
    </div>
  );
}

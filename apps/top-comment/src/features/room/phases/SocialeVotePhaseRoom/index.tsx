import { SocialeGameButton } from '../../components/layout/SocialeGameButton';
import { SessionTimer } from '@social/ui';
import { usePhaseTimer } from '../../../../shared/hooks';
import { getIsMainEventModeFromSociale } from '../../components/PhaseController';
import { buildSocialeTimerSessionShim } from '../../utils/socialeTimerShim';
import { useRoomPageContext } from '../../context/RoomPageContext';
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
  roundSettings?: any;
  currentRound?: any;
}

export function SocialeVotePhaseRoom({
  sociale,
  hasSubmitted,
  onOpenModal,
  participants,
  phaseEndsAt,
  pausedRemainingSeconds,
  isPaused = sociale.status === 'paused',
  roundSettings,
  currentRound,
}: SocialeVotePhaseRoomProps) {
  const { dispatch } = useRoomPageContext();
  const isMainEventMode = getIsMainEventModeFromSociale(sociale);
  const timerShim = buildSocialeTimerSessionShim(sociale, 'vote');
  const { totalSeconds } = usePhaseTimer({ session: timerShim });
  const pausedSecondsValue = isPaused && pausedRemainingSeconds != null ? pausedRemainingSeconds : undefined;

  const handleOpenModal = () => {
    if (sociale.currentRoundId && sociale.currentRoundIndex !== undefined) {
      dispatch({
        type: 'OPEN_SOCIALE_MODAL',
        payload: {
          socialeId: sociale.id,
          roundId: sociale.currentRoundId,
          prompt: currentRound?.content || 'Question',
          roundIndex: sociale.currentRoundIndex || 0,
          roundType: 'vote',
          roundSettings,
          phaseEndsAt,
          paused: isPaused,
        },
      });
    } else {
      onOpenModal?.('vote');
    }
  };

  return (
    <div className="w-full mb-8">
      <SocialeGameButton
        displayState={hasSubmitted ? 'voted' : 'vote'}
        participants={participants}
        isMainEventMode={isMainEventMode}
        phase="vote"
        onClick={handleOpenModal}
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

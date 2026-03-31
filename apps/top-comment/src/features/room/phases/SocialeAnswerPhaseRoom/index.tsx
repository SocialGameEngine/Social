import { SocialeGameButton } from '../../components/layout/SocialeGameButton';
import { SessionTimer } from '@social/ui';
import { usePhaseTimer } from '../../../../shared/hooks';
import { getIsMainEventModeFromSociale } from '../../components/PhaseController';
import { buildSocialeTimerSessionShim } from '../../utils/socialeTimerShim';
import type { Sociale } from '../../../../domain/types/sociale.types';
import type { SocialeGameParticipant } from '../../components/layout/SocialeGameButton';

interface SocialeAnswerPhaseRoomProps {
  sociale: Sociale;
  hasSubmitted: boolean;
  onOpenModal?: (type: 'answer' | 'vote') => void;
  participants: SocialeGameParticipant[];
  phaseEndsAt?: string | null;
}

export function SocialeAnswerPhaseRoom({
  sociale,
  hasSubmitted,
  onOpenModal,
  participants,
  phaseEndsAt,
}: SocialeAnswerPhaseRoomProps) {
  const isMainEventMode = getIsMainEventModeFromSociale(sociale);
  const timerShim = buildSocialeTimerSessionShim(sociale, 'answer');
  const { totalSeconds } = usePhaseTimer({ session: timerShim });
  const isPaused = sociale.status === 'paused';

  return (
    <div className="w-full mb-8">
      <SocialeGameButton
        displayState={hasSubmitted ? 'joined' : 'answer'}
        participants={participants}
        isMainEventMode={isMainEventMode}
        phase="answer"
        onClick={() => onOpenModal?.('answer')}
      />
      <SessionTimer
        endTime={phaseEndsAt ?? undefined}
        totalSeconds={totalSeconds}
        paused={isPaused}
        variant="brand"
        isDark={false}
        position="inline"
        showCriticalBar={true}
      />
    </div>
  );
}

import { SocialeGameButton } from '../../components/layout/SocialeGameButton';
import { SessionTimer } from '@social/ui';
import { usePhaseTimer } from '../../../../shared/hooks';
import { getIsMainEventModeFromSociale } from '../../components/PhaseController';
import { buildSocialeTimerSessionShim } from '../../utils/socialeTimerShim';
import type { Sociale } from '../../../../domain/types/sociale.types';
import type { SocialeGameParticipant } from '../../components/layout/SocialeGameButton';

interface SocialeRevealPhaseRoomProps {
  sociale: Sociale;
  participants: SocialeGameParticipant[];
  phaseEndsAt?: string | null;
}

export function SocialeRevealPhaseRoom({
  sociale,
  participants,
  phaseEndsAt,
}: SocialeRevealPhaseRoomProps) {
  const isMainEventMode = getIsMainEventModeFromSociale(sociale);
  const timerShim = buildSocialeTimerSessionShim(sociale, 'reveal');
  const { totalSeconds } = usePhaseTimer({ session: timerShim });
  const ended =
    !sociale.phaseEndsAt ||
    sociale.status === 'completed' ||
    (sociale.phaseEndsAt && new Date() >= new Date(sociale.phaseEndsAt));

  return (
    <div className="w-full mb-8">
      <SocialeGameButton
        displayState="reveal"
        participants={participants}
        isMainEventMode={isMainEventMode}
        phase="reveal"
        onClick={() => {}} // No action for reveal phase - just display
      />
      <SessionTimer
        endTime={phaseEndsAt ?? undefined}
        totalSeconds={totalSeconds}
        paused={ended || sociale.status === 'paused'}
        variant="brand"
        isDark={false}
        position="inline"
        showCriticalBar={true}
      />
    </div>
  );
}

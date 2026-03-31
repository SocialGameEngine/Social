import { SocialeGameButton } from '../../components/layout/SocialeGameButton';
import { SessionTimer } from '@social/ui';
import { usePhaseTimer } from '../../../../shared/hooks';
import { buildSocialeTimerSessionShim } from '../../utils/socialeTimerShim';
import type { Sociale } from '../../../../domain/types/sociale.types';
import type { SocialeGameParticipant } from '../../components/layout/SocialeGameButton';

interface SocialeEndedPhaseRoomProps {
  sociale: Sociale;
  participants: SocialeGameParticipant[];
  onOpenLeaderboard: () => void;
  onOpenSelfie: () => void;
}

export function SocialeEndedPhaseRoom({
  sociale,
  participants,
  onOpenLeaderboard,
  onOpenSelfie,
}: SocialeEndedPhaseRoomProps) {
  const timerShim = buildSocialeTimerSessionShim(sociale, 'results');
  const { totalSeconds } = usePhaseTimer({ session: timerShim });

  return (
    <div className="w-full mb-8 space-y-4">
      <SocialeGameButton
        displayState="ended"
        participants={participants}
        isMainEventMode={false}
        phase="ended"
        onClick={onOpenLeaderboard}
      />
      <SocialeGameButton
        displayState="idle"
        participants={participants}
        isMainEventMode={false}
        phase="ended"
        onClick={onOpenSelfie}
      />
      <SessionTimer
        endTime={sociale.phaseEndsAt ?? undefined}
        totalSeconds={totalSeconds}
        paused={true}
        variant="neutral"
        isDark={false}
        position="inline"
        showCriticalBar={false}
      />
    </div>
  );
}

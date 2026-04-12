import { SocialeGameButton } from '../../components/layout/SocialeGameButton';
import { SessionTimer } from '@social/ui';
import { usePhaseTimer } from '../../../../shared/hooks';
import { getIsMainEventModeFromSociale } from '../../components/PhaseController';
import { buildSocialeTimerSessionShim } from '../../utils/socialeTimerShim';
import type { Sociale } from '../../../../domain/types/sociale.types';
import type { SocialeGameParticipant } from '../../components/layout/SocialeGameButton';

interface SocialeResultsPhaseRoomProps {
  sociale: Sociale;
  participants: SocialeGameParticipant[];
  phaseEndsAt?: string | null;
  pausedRemainingSeconds?: number | null;
  isPaused?: boolean;
  onOpenLeaderboard?: () => void;
}

export function SocialeResultsPhaseRoom({
  sociale,
  participants,
  phaseEndsAt,
  pausedRemainingSeconds,
  isPaused = sociale.status === 'paused',
  onOpenLeaderboard,
}: SocialeResultsPhaseRoomProps) {
  const isMainEventMode = getIsMainEventModeFromSociale(sociale);
  const timerShim = buildSocialeTimerSessionShim(sociale, 'results');
  const { totalSeconds } = usePhaseTimer({ session: timerShim });
  const ended =
    !phaseEndsAt ||
    sociale.status === 'completed' ||
    (phaseEndsAt && new Date() >= new Date(phaseEndsAt));
  const pausedSecondsValue = isPaused && pausedRemainingSeconds != null ? pausedRemainingSeconds : undefined;

  return (
    <div className="w-full mb-8">
      <SocialeGameButton
        displayState="results"
        participants={participants}
        isMainEventMode={isMainEventMode}
        phase="results"
        onClick={onOpenLeaderboard ?? (() => {})}
      />
      <SessionTimer
        endTime={phaseEndsAt ?? undefined}
        totalSeconds={totalSeconds}
        paused={ended || isPaused}
        pausedSeconds={pausedSecondsValue}
        variant="brand"
        isDark={false}
        position="inline"
        showCriticalBar={true}
      />
    </div>
  );
}

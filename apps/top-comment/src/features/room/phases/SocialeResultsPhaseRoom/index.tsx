import { usePhaseTimer } from '../../../../shared/hooks';
import { buildSocialeTimerSessionShim } from '../../utils/socialeTimerShim';
import { PhasePreviewCard } from '../../components/shell/PhasePreviewCard';
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
  phaseEndsAt,
  isPaused = sociale.status === 'paused',
  onOpenLeaderboard,
}: SocialeResultsPhaseRoomProps) {
  const timerShim = buildSocialeTimerSessionShim(sociale, 'results');
  const { totalSeconds } = usePhaseTimer({ session: timerShim });
  const ended =
    !phaseEndsAt ||
    sociale.status === 'completed' ||
    (phaseEndsAt && new Date() >= new Date(phaseEndsAt));

  return (
    <div className="w-full mb-6 px-4">
      <PhasePreviewCard
        phase="results"
        title="Results"
        ctaLabel="See the leaderboard"
        roundIndex={(sociale.currentRoundIndex ?? 0) + 1}
        totalRounds={sociale.totalRounds}
        endsAt={phaseEndsAt}
        totalSeconds={totalSeconds}
        paused={ended || isPaused}
        onClick={onOpenLeaderboard}
      />
    </div>
  );
}

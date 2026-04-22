import { useMemo } from 'react';
import { usePhaseTimer } from '../../../../shared/hooks';
import { buildSocialeTimerSessionShim } from '../../utils/socialeTimerShim';
import { useRoomPageContext } from '../../context/RoomPageContext';
import { useRoundVotes, useSocialites } from '../../../../features/sociale/hooks';
import { PhasePreviewCard } from '../../components/shell/PhasePreviewCard';
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

function truncatePrompt(text: string | null | undefined, limit = 90): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit - 1).trimEnd()}…`;
}

export function SocialeVotePhaseRoom({
  sociale,
  hasSubmitted,
  onOpenModal,
  phaseEndsAt,
  isPaused = sociale.status === 'paused',
  roundSettings,
  currentRound,
}: SocialeVotePhaseRoomProps) {
  const { dispatch } = useRoomPageContext();
  const timerShim = buildSocialeTimerSessionShim(sociale, 'vote');
  const { totalSeconds } = usePhaseTimer({ session: timerShim });

  const { data: socialites = [] } = useSocialites(sociale.id);
  const { data: roundVotes = [] } = useRoundVotes(
    sociale.id,
    sociale.currentRoundId ?? undefined,
  );

  const activeSocialiteCount = useMemo(
    () => socialites.filter((s) => s.isActive).length,
    [socialites],
  );
  const votedCount = roundVotes.length;
  const promptPreview = truncatePrompt(currentRound?.content);

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
    <div className="w-full mb-6 px-4">
      <PhasePreviewCard
        phase="vote"
        title="Voting"
        ctaLabel={hasSubmitted ? 'Update your vote' : 'Cast your vote'}
        promptPreview={promptPreview}
        roundIndex={(sociale.currentRoundIndex ?? 0) + 1}
        totalRounds={sociale.totalRounds}
        endsAt={phaseEndsAt}
        totalSeconds={totalSeconds}
        paused={isPaused}
        submittedCount={votedCount}
        totalCount={activeSocialiteCount}
        hasSubmitted={hasSubmitted}
        onClick={handleOpenModal}
      />
    </div>
  );
}

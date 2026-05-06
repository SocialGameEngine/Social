import { useMemo } from 'react';
import { usePhaseTimer } from '../../../../shared/hooks';
import { buildSocialeTimerSessionShim } from '../../utils/socialeTimerShim';
import { useRoomPageContext } from '../../context/RoomPageContext';
import { useRoundResponses, useSocialites, useCurrentSocialite } from '../../../../features/sociale/hooks';
import { PhasePreviewCard } from '../../components/shell/PhasePreviewCard';
import type { Sociale } from '../../../../domain/types/sociale.types';
import type { SocialeGameParticipant } from '../../components/layout/SocialeGameButton';

interface SocialeAnswerPhaseRoomProps {
  sociale: Sociale;
  hasSubmitted: boolean;
  onOpenModal?: (type: 'answer' | 'vote') => void;
  participants: SocialeGameParticipant[];
  phaseEndsAt?: string | null;
  pausedRemainingSeconds?: number | null;
  isPaused?: boolean;
  roundSettings?: any;
  currentRound?: any;
  userId?: string;
}

function truncatePrompt(text: string | null | undefined, limit = 90): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit - 1).trimEnd()}…`;
}

export function SocialeAnswerPhaseRoom({
  sociale,
  hasSubmitted,
  onOpenModal,
  phaseEndsAt,
  isPaused = sociale.status === 'paused',
  roundSettings,
  currentRound,
  userId,
}: SocialeAnswerPhaseRoomProps) {
  const { dispatch } = useRoomPageContext();
  const timerShim = buildSocialeTimerSessionShim(sociale, 'answer');
  const { totalSeconds } = usePhaseTimer({ session: timerShim });

  const { data: socialites = [] } = useSocialites(sociale.id);
  const { data: currentSocialite } = useCurrentSocialite(sociale.id, userId);
  const { data: roundResponses = [] } = useRoundResponses(
    sociale.id,
    sociale.currentRoundId ?? undefined,
  );

  // P2-4: Ghost mode detection for late joiners
  const isGhostMode = useMemo(() => {
    if (!currentSocialite) return false;
    // If user has pending_until_round_index, they're a late joiner
    const pendingRound = currentSocialite.pendingUntilRoundIndex;
    if (pendingRound === null || pendingRound === undefined) return false;
    const currentRound = sociale.currentRoundIndex ?? 0;
    return currentRound < pendingRound;
  }, [currentSocialite, sociale.currentRoundIndex]);

  const activeSocialiteCount = useMemo(
    () => socialites.filter((s) => s.isActive).length,
    [socialites],
  );
  const submittedCount = roundResponses.length;
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
          roundType: roundSettings?.type,
          roundSettings,
          phaseEndsAt,
          paused: isPaused,
          // P2-4: Pass ghost mode flag to modal
          isGhostMode,
        },
      });
    } else {
      onOpenModal?.('answer');
    }
  };

  return (
    <div className="w-full mb-6 px-4">
      <PhasePreviewCard
        phase="answer"
        title="Answering"
        ctaLabel={hasSubmitted ? 'Update your answer' : 'Answer now'}
        promptPreview={promptPreview}
        roundIndex={(sociale.currentRoundIndex ?? 0) + 1}
        totalRounds={sociale.totalRounds}
        endsAt={phaseEndsAt}
        totalSeconds={totalSeconds}
        paused={isPaused}
        submittedCount={submittedCount}
        totalCount={activeSocialiteCount}
        hasSubmitted={hasSubmitted}
        onClick={handleOpenModal}
      />
    </div>
  );
}

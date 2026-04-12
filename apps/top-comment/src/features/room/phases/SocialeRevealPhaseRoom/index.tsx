import { SocialeGameButton } from '../../components/layout/SocialeGameButton';
import { SessionTimer } from '@social/ui';
import { usePhaseTimer } from '../../../../shared/hooks';
import { getIsMainEventModeFromSociale } from '../../components/PhaseController';
import { buildSocialeTimerSessionShim } from '../../utils/socialeTimerShim';
import { useRoundResponses, useRoundVotes } from '../../../../features/sociale/hooks';
import type { Sociale, SocialeRound, TriviaRoundSettings } from '../../../../domain/types/sociale.types';
import type { SocialeGameParticipant } from '../../components/layout/SocialeGameButton';

interface SocialeRevealPhaseRoomProps {
  sociale: Sociale;
  participants: SocialeGameParticipant[];
  phaseEndsAt?: string | null;
  pausedRemainingSeconds?: number | null;
  isPaused?: boolean;
  currentRound?: SocialeRound | null;
}

export function SocialeRevealPhaseRoom({
  sociale,
  participants,
  phaseEndsAt,
  pausedRemainingSeconds,
  isPaused = sociale.status === 'paused',
  currentRound,
}: SocialeRevealPhaseRoomProps) {
  const isMainEventMode = getIsMainEventModeFromSociale(sociale);
  const timerShim = buildSocialeTimerSessionShim(sociale, 'reveal');
  const { totalSeconds } = usePhaseTimer({ session: timerShim });
  const ended =
    !phaseEndsAt ||
    sociale.status === 'completed' ||
    (phaseEndsAt && new Date() >= new Date(phaseEndsAt));
  const pausedSecondsValue = isPaused && pausedRemainingSeconds != null ? pausedRemainingSeconds : undefined;

  // Fetch responses and votes for topic rounds to find the winning response
  const { data: responses = [] } = useRoundResponses(
    currentRound?.type === 'topic' ? sociale.id : undefined,
    currentRound?.id
  );
  const { data: votes = [] } = useRoundVotes(
    currentRound?.type === 'topic' ? sociale.id : undefined,
    currentRound?.id
  );

  // Compute the reveal content to show participants
  const revealContent = (() => {
    if (!currentRound) return null;

    if (currentRound.type === 'trivia') {
      const settings = currentRound.settings as TriviaRoundSettings;
      const snap = settings?.snapshot;
      if (snap && 'multipleChoice' in snap && snap.multipleChoice) {
        const correctOption = snap.multipleChoice.options?.find(
          (o) => o.id === snap.multipleChoice.correctOptionId
        );
        return {
          title: 'Correct Answer',
          content: correctOption?.text || 'Unknown',
          explanation: snap.explanation ?? null,
        };
      }
      if (snap && 'writtenAnswer' in snap && snap.writtenAnswer) {
        return {
          title: 'Correct Answer',
          content: snap.writtenAnswer.correctAnswer || snap.writtenAnswer.acceptedAnswers?.[0] || 'Unknown',
          explanation: snap.explanation ?? null,
        };
      }
      return null;
    }

    if (currentRound.type === 'topic') {
      // Find the response with the most votes
      const voteMap = new Map<string, number>();
      votes.forEach((v) => {
        if (v.targetResponseId) {
          voteMap.set(v.targetResponseId, (voteMap.get(v.targetResponseId) ?? 0) + 1);
        }
      });
      let topResponse = null;
      let maxVotes = 0;
      responses.forEach((r) => {
        const count = voteMap.get(r.id) ?? 0;
        if (count > maxVotes) {
          maxVotes = count;
          topResponse = r;
        }
      });
      if (!topResponse) return null;
      const r = topResponse as { value: unknown };
      const content = typeof r.value === 'string'
        ? r.value
        : r.value != null
          ? JSON.stringify(r.value)
          : '';
      if (!content) return null;
      return {
        title: 'Most Popular Response',
        content,
        explanation: null,
      };
    }

    return null;
  })();

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
        paused={ended || isPaused}
        pausedSeconds={pausedSecondsValue}
        variant="brand"
        isDark={false}
        position="inline"
        showCriticalBar={true}
      />
      {revealContent && (
        <div className="mt-4 mx-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-center space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            {revealContent.title}
          </p>
          <p className="text-lg font-bold text-white">
            {revealContent.content}
          </p>
          {revealContent.explanation && (
            <p className="text-sm italic text-slate-400">
              {revealContent.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

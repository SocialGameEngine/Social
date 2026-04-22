import { motion } from 'framer-motion';
import { usePhaseTimer } from '../../../../shared/hooks';
import { buildSocialeTimerSessionShim } from '../../utils/socialeTimerShim';
import { CountdownRing } from '../../../tv/components/CountdownRing';
import { SplitFlap } from '../../../tv/components/SplitFlap';
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
  phaseEndsAt,
  isPaused = sociale.status === 'paused',
  currentRound,
}: SocialeRevealPhaseRoomProps) {
  const timerShim = buildSocialeTimerSessionShim(sociale, 'reveal');
  const { totalSeconds } = usePhaseTimer({ session: timerShim });
  const ended =
    !phaseEndsAt ||
    sociale.status === 'completed' ||
    (phaseEndsAt && new Date() >= new Date(phaseEndsAt));

  const { data: responses = [] } = useRoundResponses(
    currentRound?.type === 'topic' ? sociale.id : undefined,
    currentRound?.id,
  );
  const { data: votes = [] } = useRoundVotes(
    currentRound?.type === 'topic' ? sociale.id : undefined,
    currentRound?.id,
  );

  const revealContent = (() => {
    if (!currentRound) return null;

    if (currentRound.type === 'trivia') {
      const settings = currentRound.settings as TriviaRoundSettings;
      const snap = settings?.snapshot;
      if (snap && 'multipleChoice' in snap && snap.multipleChoice) {
        const correctOption = snap.multipleChoice.options?.find(
          (o) => o.id === snap.multipleChoice.correctOptionId,
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
      const voteMap = new Map<string, number>();
      votes.forEach((v) => {
        if (v.targetResponseId) {
          voteMap.set(v.targetResponseId, (voteMap.get(v.targetResponseId) ?? 0) + 1);
        }
      });
      let topResponse: { value: unknown } | null = null;
      let maxVotes = 0;
      responses.forEach((r) => {
        const count = voteMap.get(r.id) ?? 0;
        if (count > maxVotes) {
          maxVotes = count;
          topResponse = r as { value: unknown };
        }
      });
      if (!topResponse) return null;
      const r = topResponse as { value: unknown };
      const content =
        typeof r.value === 'string'
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
    <div className="w-full mb-6 px-4">
      <div className="chaos-room-panel p-4 sm:p-5 space-y-4" data-phase="reveal">
        <div className="flex items-start justify-between gap-3">
          <span className="chaos-room-eyebrow">
            <span>Reveal</span>
            <span className="opacity-60">·</span>
            <span className="flex items-center gap-1">
              <span className="opacity-80">R</span>
              <SplitFlap
                value={String((sociale.currentRoundIndex ?? 0) + 1)}
                length={String(sociale.totalRounds ?? 1).length}
                flipMs={55}
                staggerMs={25}
                charWidthEm={0.55}
                style={{ fontSize: '11px' }}
              />
              {sociale.totalRounds != null && (
                <span className="opacity-60">/{sociale.totalRounds}</span>
              )}
            </span>
          </span>
          <div className="flex h-[60px] w-[60px] items-center justify-center">
            {phaseEndsAt && totalSeconds > 0 && !isPaused && !ended ? (
              <CountdownRing
                endTime={phaseEndsAt}
                totalSeconds={totalSeconds}
                size={60}
                strokeWidth={6}
                hideWhenIdle={false}
              />
            ) : null}
          </div>
        </div>

        {revealContent ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            className="rounded-2xl p-4 text-center space-y-2"
            style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(251, 191, 36, 0.08))',
              border: '2px solid rgba(251, 191, 36, 0.5)',
              boxShadow: '0 10px 20px rgba(0,0,0,0.35)',
            }}
          >
            <p className="text-[11px] font-black uppercase tracking-widest text-amber-200">
              {revealContent.title}
            </p>
            <p
              className="text-xl font-black text-white leading-tight"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}
            >
              {revealContent.content}
            </p>
            {revealContent.explanation && (
              <p className="text-sm italic text-white/70">
                {revealContent.explanation}
              </p>
            )}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 0.6, 0.2] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                  className="h-3 w-3 rounded-full bg-amber-300/80"
                />
              ))}
            </div>
            <p className="text-sm text-white/60">Look up — the answer's on the TV.</p>
          </div>
        )}
      </div>
    </div>
  );
}

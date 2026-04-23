import { motion } from 'framer-motion';
import type {
  SocialeRound,
  SocialeResponse,
  SocialeVote,
  Socialite,
  TriviaSnapshotMultipleChoice,
  TriviaSnapshotWrittenAnswer,
} from '../../../domain/types/sociale.types';
import { TVRevealSequence } from '../components/TVRevealSequence';

interface RevealPhaseProps {
  currentRound: SocialeRound | null;
  responses: SocialeResponse[];
  votes: SocialeVote[];
  socialites: Socialite[];
  /** Kept for prop parity — chaos TV styling is a single vivid theme. */
  isDark?: boolean;
}

/**
 * TV reveal phase (P1-1 + P1-29).
 *
 * Uses the dual-coded answer tiles so color+shape both reinforce correctness.
 * For trivia MC rounds: renders each tile with aggregated vote counts from
 * `responses` (selected option id) and reveals the correct tile with the full
 * visual weight (incorrect tiles shrink + dim + get an X overlay via the tile
 * component itself). For written-answer trivia: shows the canonical answer in
 * a hero card. For topic rounds: defers to room/TV results flow (nothing
 * special on TV during reveal phase — choreography lives in `ResultsPhase`).
 */
export function RevealPhase({
  currentRound,
  responses,
  votes: _votes,
  socialites: _socialites,
  isDark: _isDark,
}: RevealPhaseProps) {
  if (!currentRound) return null;

  if (currentRound.type === 'trivia') {
    const settings = currentRound.settings as {
      snapshot?: TriviaSnapshotMultipleChoice | TriviaSnapshotWrittenAnswer;
    } | null;
    const snapshot = settings?.snapshot;
    const prompt = snapshot?.prompt ?? currentRound.content ?? currentRound.title ?? '';

    // Multiple-choice: tile grid with vote distribution + color-coded correctness.
    if (snapshot && 'multipleChoice' in snapshot && snapshot.multipleChoice) {
      const options = snapshot.multipleChoice.options;
      const correctOptionId = snapshot.multipleChoice.correctOptionId;

      // Aggregate votes per option from `responses.value` (selected option id).
      const voteCountByOption = new Map<string, number>();
      responses.forEach((r) => {
        const selected = typeof r.value === 'string' ? r.value : String(r.value ?? '');
        if (!selected) return;
        voteCountByOption.set(selected, (voteCountByOption.get(selected) ?? 0) + 1);
      });
      const totalVotes = Array.from(voteCountByOption.values()).reduce((a, b) => a + b, 0);

      const tiles = options.map((opt, i) => ({
        id: opt.id,
        label: opt.text,
        optionIndex: i,
        voteCount: voteCountByOption.get(opt.id) ?? 0,
        totalVotes,
        isCorrect: opt.id === correctOptionId,
      }));

      // Calculate delay for explanation: reveal sequence takes (wrongCount * 750ms) + 500ms + buffer
      const wrongCount = options.length - 1;
      const stepMs = 750;
      const explanationDelay = (wrongCount * stepMs + 500 + 800) / 1000; // Convert to seconds, add 800ms buffer

      return (
        <section className="flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: -0.5 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="chaos-tv-prompt mx-auto max-w-5xl"
          >
            <div className="chaos-tv-sheen" aria-hidden />
            <p className="chaos-tv-title chaos-tv-title--soft text-2xl md:text-3xl lg:text-4xl leading-[1.1]">
              {prompt}
            </p>
          </motion.div>

          <TVRevealSequence tiles={tiles} roundKey={currentRound.id ?? ''} stepMs={stepMs} />

          {snapshot.explanation && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: explanationDelay }}
              className="mx-auto max-w-3xl text-center text-base md:text-lg italic text-white/80"
            >
              {snapshot.explanation}
            </motion.p>
          )}
        </section>
      );
    }

    // Written-answer: hero card with the accepted answer.
    if (snapshot && 'writtenAnswer' in snapshot && snapshot.writtenAnswer) {
      const correct =
        snapshot.writtenAnswer.correctAnswer ||
        snapshot.writtenAnswer.acceptedAnswers?.[0] ||
        'Unknown';
      return (
        <section className="flex flex-col items-center gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -0.8 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="chaos-tv-prompt mx-auto max-w-5xl"
          >
            <div className="chaos-tv-sheen" aria-hidden />
            <p className="chaos-tv-title chaos-tv-title--soft text-3xl md:text-5xl lg:text-6xl leading-[1.1]">
              {prompt}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            className="mx-auto rounded-3xl px-10 py-8 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.35), rgba(34, 197, 94, 0.1))',
              border: '3px solid rgba(34, 197, 94, 0.75)',
              boxShadow: '0 20px 60px rgba(34,197,94,0.4)',
            }}
          >
            <p className="text-sm md:text-base font-black uppercase tracking-[0.4em] text-emerald-200 mb-3">
              Correct answer
            </p>
            <p className="text-4xl md:text-6xl lg:text-7xl font-black text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
              {correct}
            </p>
            {snapshot.explanation && (
              <p className="mt-4 text-lg md:text-xl italic text-white/80">
                {snapshot.explanation}
              </p>
            )}
          </motion.div>
        </section>
      );
    }
  }

  // Predictive rounds (P1-19): host-set answer surfaces on reveal.
  const predictiveAnswer = (currentRound as unknown as { predictiveAnswer?: string | null })
    .predictiveAnswer;
  if (predictiveAnswer) {
    return (
      <section className="flex flex-col items-center gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="chaos-tv-prompt mx-auto max-w-5xl"
        >
          <p className="chaos-tv-title chaos-tv-title--soft text-3xl md:text-5xl leading-[1.1]">
            {currentRound.content ?? currentRound.title}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="rounded-3xl px-10 py-8 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(236,72,153,0.35), rgba(236,72,153,0.1))',
            border: '3px solid rgba(236,72,153,0.75)',
            boxShadow: '0 20px 60px rgba(236,72,153,0.4)',
          }}
        >
          <p className="text-sm font-black uppercase tracking-[0.4em] text-pink-200 mb-3">
            Host picked
          </p>
          <p className="text-4xl md:text-6xl lg:text-7xl font-black text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
            {predictiveAnswer}
          </p>
        </motion.div>
      </section>
    );
  }

  // Topic rounds fall through — results phase handles the post-vote podium.
  return (
    <section className="flex flex-col items-center gap-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="chaos-tv-prompt mx-auto max-w-5xl"
      >
        <p className="chaos-tv-title chaos-tv-title--soft text-3xl md:text-5xl">
          {currentRound.content ?? currentRound.title}
        </p>
      </motion.div>
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
            className="h-4 w-4 rounded-full bg-amber-300"
          />
        ))}
      </div>
      <p className="text-xl md:text-2xl font-bold text-white/70">Tallying the room…</p>
    </section>
  );
}

export default RevealPhase;

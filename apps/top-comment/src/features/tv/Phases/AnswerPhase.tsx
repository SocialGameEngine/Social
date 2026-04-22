import { motion } from 'framer-motion';
import { getMascotPath } from '../../../shared/mascots';
import { SubmissionPool } from '../components/SubmissionPool';
import { TVAnswerTile } from '../components/TVAnswerTile';
import type {
  SocialeRound,
  SocialeResponse,
  Socialite,
} from '../../../domain/types/sociale.types';
import type {
  TriviaSnapshotMultipleChoice,
  TriviaSnapshotWrittenAnswer,
} from '../../../domain/types/sociale.types';

interface AnswerPhaseProps {
  currentRound: SocialeRound | null;
  responses: SocialeResponse[];
  socialites: Socialite[];
  /** Kept for prop parity — chaos TV styling is a single vivid theme. */
  isDark?: boolean;
}

export function AnswerPhase({
  currentRound,
  responses,
  socialites,
  isDark: _isDark,
}: AnswerPhaseProps) {
  const submittedIds = new Set(responses.map((r) => r.socialiteId));
  const activePlayers = socialites.filter((s) => s.isActive && !s.isBanned);
  const stragglers = activePlayers.filter((s) => !submittedIds.has(s.id));
  // P1-5: TV straggler callout — when most players have submitted, name-check
  // the few still thinking so the room pushes them. Kicks in once >= 60% of
  // players have submitted *and* at least one is still out.
  const showStragglers =
    activePlayers.length >= 3 &&
    stragglers.length > 0 &&
    stragglers.length <= Math.max(1, Math.floor(activePlayers.length * 0.4));

  if (!currentRound) return null;

  // P1-33: replace the plain "X / Y answered" pill with a submission pool of
  // avatar dots that fill in as each player answers. Falls back to text-only
  // when no players have joined yet (so TV never shows an empty ring).
  const progressPill = socialites.length > 0
    ? (
      <div className="flex flex-col items-center gap-3">
        <SubmissionPool
          entries={socialites.map((s) => ({
            id: s.id,
            displayName: s.displayName ?? 'Player',
            mascotId: s.mascotId ?? undefined,
            hasSubmitted: submittedIds.has(s.id),
          }))}
        />
        {showStragglers && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            className="chaos-tv-straggler inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-amber-400/20 px-4 py-2 ring-2 ring-amber-300/70"
          >
            <span className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-amber-100">
              Waiting on
            </span>
            {stragglers.slice(0, 4).map((s) => (
              <span key={s.id} className="text-sm md:text-base font-black text-amber-50">
                {s.displayName}
              </span>
            ))}
            {stragglers.length > 4 && (
              <span className="text-sm font-black text-amber-100">+{stragglers.length - 4}</span>
            )}
          </motion.div>
        )}
      </div>
    )
    : (
      <div className="flex justify-center">
        <span className="chaos-tv-count chaos-tv-count--cyan">
          <span className="chaos-tv-live-dot" />
          Waiting for players
        </span>
      </div>
    );

  // Trivia rounds
  if (currentRound.type === 'trivia') {
    const settings = currentRound.settings as { snapshot?: TriviaSnapshotMultipleChoice | TriviaSnapshotWrittenAnswer } | null;
    const snapshot = settings?.snapshot;
    const prompt = snapshot?.prompt ?? currentRound.content ?? currentRound.title ?? '';
    const options = snapshot && 'multipleChoice' in snapshot
      ? snapshot.multipleChoice.options
      : null;

    return (
      <section className="flex flex-col gap-8">
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

        {options && (
          <motion.div
            className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-5 md:grid-cols-2"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
          >
            {options.map((opt, i) => (
              <motion.div
                key={opt.id}
                variants={{
                  hidden: { opacity: 0, y: 24, scale: 0.94 },
                  visible: { opacity: 1, y: 0, scale: 1 },
                }}
                transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <TVAnswerTile
                  optionIndex={i}
                  label={opt.text}
                  isRevealed={false}
                  layoutId={`tv-answer-tile-${opt.id}`}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {progressPill}
      </section>
    );
  }

  // Topic rounds: prompt + live anonymous responses
  if (currentRound.type === 'topic') {
    const prompt = currentRound.content ?? currentRound.title ?? '';

    return (
      <section className="flex flex-col gap-8">
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
          className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {responses.map((r, i) => {
            const author = socialites.find((s) => s.id === r.socialiteId);
            const mascotPath = getMascotPath(author?.mascotId);
            const tint = i % 3 === 0 ? '--pink' : i % 3 === 1 ? '--cyan' : '--dark';
            const rot = i % 2 === 0 ? '-1.2deg' : '1.2deg';
            return (
              <motion.div
                key={r.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 20, rotate: -4, scale: 0.95 },
                  visible: { opacity: 1, y: 0, rotate: 0, scale: 1 },
                }}
                transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                className={`chaos-tv-card chaos-tv-card${tint}`}
                style={{ transform: `rotate(${rot})` }}
              >
                <p className="relative text-lg md:text-xl font-black leading-snug">
                  {typeof r.value === 'string' ? r.value : JSON.stringify(r.value)}
                </p>
                <div className="relative mt-3 flex items-center gap-2">
                  {mascotPath && (
                    <img
                      src={mascotPath}
                      alt=""
                      className="chaos-tv-chip-mascot"
                      draggable={false}
                    />
                  )}
                  <span className="text-sm font-bold opacity-90">
                    {author?.displayName ?? 'Anon'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {progressPill}
      </section>
    );
  }

  return null;
}

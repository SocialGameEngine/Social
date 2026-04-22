import { motion } from 'framer-motion';
import { getMascotPath } from '../../../shared/mascots';
import type {
  SocialeRound,
  SocialeResponse,
  SocialeVote,
  Socialite,
} from '../../../domain/types/sociale.types';

interface VotePhaseProps {
  currentRound: SocialeRound | null;
  responses: SocialeResponse[];
  votes: SocialeVote[];
  socialites: Socialite[];
  /** Kept for prop parity — chaos TV styling is a single vivid theme. */
  isDark?: boolean;
}

export function VotePhase({
  currentRound,
  responses,
  votes,
  socialites,
  isDark: _isDark,
}: VotePhaseProps) {
  const voteCounts = responses.reduce<Record<string, number>>((acc, r) => {
    acc[r.id] = votes.filter((v) => v.targetResponseId === r.id).length;
    return acc;
  }, {});

  const sorted = [...responses].sort(
    (a, b) => (voteCounts[b.id] ?? 0) - (voteCounts[a.id] ?? 0)
  );

  const prompt = currentRound?.content ?? currentRound?.title ?? '';

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="chaos-tv-eyebrow chaos-tv-eyebrow--gold chaos-tv-eyebrow--flip">
          Vote for your favourite
        </span>
        {prompt && (
          <h2 className="chaos-tv-title chaos-tv-title--soft text-2xl md:text-4xl max-w-4xl">
            {prompt}
          </h2>
        )}
      </div>

      <motion.div
        layout
        className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
      >
        {sorted.map((r, i) => {
          const author = socialites.find((s) => s.id === r.socialiteId);
          const mascotPath = getMascotPath(author?.mascotId);
          const count = voteCounts[r.id] ?? 0;
          const tintModifier =
            i === 0
              ? 'chaos-tv-card--pink'
              : i === 1
                ? 'chaos-tv-card--cyan'
                : 'chaos-tv-card--dark';
          const rot = i % 2 === 0 ? '-1.2deg' : '1.2deg';
          const countClass =
            count === 0
              ? 'chaos-tv-count'
              : i === 0
                ? 'chaos-tv-count'
                : i === 1
                  ? 'chaos-tv-count chaos-tv-count--cyan'
                  : 'chaos-tv-count chaos-tv-count--gold';

          return (
            <motion.div
              key={r.id}
              layout
              variants={{
                hidden: { opacity: 0, y: 24, rotate: -4, scale: 0.95 },
                visible: { opacity: 1, y: 0, rotate: 0, scale: 1 },
              }}
              transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
              className={`chaos-tv-card ${tintModifier} relative`}
              style={{ transform: `rotate(${rot})` }}
            >
              <div className="chaos-tv-sheen" aria-hidden />
              <p className="relative text-lg md:text-2xl font-black leading-snug">
                {typeof r.value === 'string' ? r.value : JSON.stringify(r.value)}
              </p>
              <div className="relative mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {mascotPath && (
                    <img
                      src={mascotPath}
                      alt=""
                      className="chaos-tv-chip-mascot"
                      draggable={false}
                    />
                  )}
                  <span className="text-sm font-bold opacity-90 truncate">
                    {author?.displayName ?? 'Anon'}
                  </span>
                </div>
                <span className={countClass}>
                  {count} <span className="opacity-70">vote{count === 1 ? '' : 's'}</span>
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

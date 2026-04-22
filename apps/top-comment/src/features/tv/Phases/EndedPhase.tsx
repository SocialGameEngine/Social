import { motion } from 'framer-motion';
import { getMascotPath } from '../../../shared/mascots';
import type { SocialeScoreboardEntry } from '../../../domain/types/sociale.types';

interface EndedPhaseProps {
  scoreboard: SocialeScoreboardEntry[];
  /** Kept for prop parity — chaos TV styling is a single vivid theme. */
  isDark?: boolean;
}

export function EndedPhase({ scoreboard, isDark: _isDark }: EndedPhaseProps) {
  const sorted = [...scoreboard].sort((a, b) => a.rank - b.rank);
  const winner = sorted[0];
  const rest = sorted.slice(1);

  return (
    <section className="flex flex-col items-center gap-10 text-center">
      <span className="chaos-tv-eyebrow chaos-tv-eyebrow--gold chaos-tv-eyebrow--flip">
        That's a wrap!
      </span>

      {winner && (
        <motion.div
          initial={{ opacity: 0, y: 24, rotate: -3, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, rotate: -1.5, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
          className="chaos-tv-card chaos-tv-card--gold relative max-w-3xl"
        >
          <div className="chaos-tv-sheen" aria-hidden />
          <span className="chaos-tv-eyebrow chaos-tv-eyebrow--dark chaos-tv-eyebrow--flip self-center">
            Tonight's champion
          </span>
          <div className="relative mt-3 flex flex-col items-center gap-4">
            {getMascotPath(winner.mascotId) && (
              <img
                src={getMascotPath(winner.mascotId)}
                alt=""
                className="h-24 w-24 md:h-32 md:w-32 rounded-full border-[4px] border-black bg-[#0f0f1c] object-contain"
                draggable={false}
              />
            )}
            <h2 className="chaos-tv-title chaos-tv-title--subtle text-5xl md:text-7xl lg:text-8xl">
              {winner.displayName}
            </h2>
            <p className="text-4xl md:text-6xl font-black tabular-nums text-[var(--tv-ink)]">
              {winner.score.toLocaleString()} pts
            </p>
          </div>
        </motion.div>
      )}

      {rest.length > 0 && (
        <motion.ol
          className="mx-auto flex w-full max-w-4xl flex-col gap-4"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } } }}
        >
          {rest.map((entry, i) => {
            const idx = i + 1; // actual rank index in the full list
            const mascotPath = getMascotPath(entry.mascotId);
            const podium =
              idx === 1 ? 'chaos-tv-row--second' : idx === 2 ? 'chaos-tv-row--third' : '';
            const bignum =
              idx === 1 || idx === 2
                ? 'chaos-tv-bignum'
                : 'chaos-tv-bignum chaos-tv-bignum--cyan';
            return (
              <motion.li
                key={entry.socialiteId}
                variants={{
                  hidden: { opacity: 0, x: idx % 2 === 0 ? -28 : 28, rotate: -3 },
                  visible: { opacity: 1, x: 0, rotate: idx % 2 === 0 ? -0.6 : 0.6 },
                }}
                transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                className={`chaos-tv-row ${podium}`}
              >
                <span className="flex items-center gap-4 min-w-0">
                  <span className={bignum} style={{ width: 56, height: 56, fontSize: 24 }}>
                    {entry.rank}
                  </span>
                  {mascotPath && (
                    <img
                      src={mascotPath}
                      alt=""
                      className="chaos-tv-chip-mascot"
                      draggable={false}
                    />
                  )}
                  <span className="truncate text-2xl md:text-3xl font-black tracking-tight">
                    {entry.displayName}
                  </span>
                </span>
                <span className="text-3xl md:text-4xl font-black tabular-nums">
                  {entry.score.toLocaleString()}
                </span>
              </motion.li>
            );
          })}
        </motion.ol>
      )}
    </section>
  );
}

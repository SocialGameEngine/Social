import { AnimatePresence, motion } from "framer-motion";
import { getMascotPath } from "../../../shared/mascots";
import { Confetti } from "./Confetti";

interface PodiumEntry {
  id: string;
  displayName: string;
  score: number;
  mascotId?: number | null;
}

interface TVPodiumCeremonyProps {
  visible: boolean;
  /** Top 3 ranked entries (rank 1 first). Accepts 0-3 entries. */
  top3: PodiumEntry[];
}

const HEIGHTS = [260, 180, 140];
const ORDER_INDEX = [1, 0, 2]; // silver, gold, bronze (left-center-right)
const MEDAL_COLORS = ["#fbbf24", "#e2e8f0", "#d97706"];
const LABELS = ["1st", "2nd", "3rd"];

/**
 * Full-screen podium ceremony (P1-30).
 *
 * Staging:
 *   1. Platform rises from below with stagger.
 *   2. Mascots drop onto their platforms (rank 3 → rank 2 → rank 1).
 *   3. Gold spotlight sweeps; confetti bursts for the full window.
 *
 * Parent sets `visible=true` at end-of-session and leaves it up for ~8 s.
 */
export function TVPodiumCeremony({ visible, top3 }: TVPodiumCeremonyProps) {
  const ordered = ORDER_INDEX.map((rankIdx) => top3[rankIdx]).filter(Boolean) as PodiumEntry[];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[70] flex items-end justify-center pb-24"
          style={{
            background:
              "radial-gradient(ellipse at 50% 80%, rgba(251,191,36,0.3), transparent 60%), rgba(2,6,23,0.97)",
          }}
          aria-live="polite"
          aria-label="Podium ceremony"
        >
          <Confetti active={visible} count={120} durationSec={6} />

          {/* Title */}
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="absolute top-16 left-1/2 -translate-x-1/2"
          >
            <span className="chaos-tv-eyebrow chaos-tv-eyebrow--gold chaos-tv-eyebrow--flip">
              Tonight's Champions
            </span>
          </motion.div>

          <div className="flex items-end gap-8">
            {ordered.map((entry, displayIdx) => {
              const rankIdx = ORDER_INDEX[displayIdx];
              const mascotPath = getMascotPath(entry.mascotId ?? undefined);
              return (
                <motion.div
                  key={entry.id}
                  initial={{ y: 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.5 + (2 - rankIdx) * 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    initial={{ y: -120, scale: 0.5 }}
                    animate={{ y: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 + (2 - rankIdx) * 0.6, type: "spring", stiffness: 220, damping: 16 }}
                    className="mb-4 flex flex-col items-center"
                  >
                    {mascotPath ? (
                      <img
                        src={mascotPath}
                        alt=""
                        draggable={false}
                        className="w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
                      />
                    ) : (
                      <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-slate-700 flex items-center justify-center text-3xl font-black text-white">
                        {entry.displayName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="mt-2 text-xl md:text-2xl font-black text-white uppercase tracking-tight max-w-[200px] truncate">
                      {entry.displayName}
                    </span>
                    <span className="text-lg md:text-xl text-amber-200 font-black tabular-nums">
                      {entry.score.toLocaleString()} pts
                    </span>
                  </motion.div>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: HEIGHTS[rankIdx] }}
                    transition={{ duration: 0.8, delay: 0.3 + (2 - rankIdx) * 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex w-32 md:w-44 items-start justify-center rounded-t-2xl pt-4 text-4xl md:text-5xl font-black"
                    style={{
                      background: `linear-gradient(180deg, ${MEDAL_COLORS[rankIdx]}, ${MEDAL_COLORS[rankIdx]}88)`,
                      boxShadow: `0 -12px 32px ${MEDAL_COLORS[rankIdx]}55`,
                      color: rankIdx === 0 ? "#78350f" : "#0f172a",
                    }}
                  >
                    {LABELS[rankIdx]}
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TVPodiumCeremony;

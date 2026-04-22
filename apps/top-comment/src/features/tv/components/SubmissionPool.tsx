import { motion, AnimatePresence } from "framer-motion";
import { getMascotPath } from "../../../shared/mascots";

interface SubmissionPoolEntry {
  id: string;
  displayName: string;
  mascotId?: number;
  hasSubmitted: boolean;
}

interface SubmissionPoolProps {
  entries: SubmissionPoolEntry[];
  /** Whether to label submitted as "answered" vs "voted". */
  action?: "answered" | "voted";
}

/**
 * "3 of 10 answered" + avatar dots that fill in as each player submits (P1-33).
 *
 * Visual language:
 *   · Unsubmitted players appear grey-scaled at 50% opacity.
 *   · As each player submits, their avatar pops in color with a spring.
 *   · Progress pill at the bottom says "X of Y answered".
 */
export function SubmissionPool({ entries, action = "answered" }: SubmissionPoolProps) {
  if (entries.length === 0) return null;
  const submittedCount = entries.filter((e) => e.hasSubmitted).length;
  const total = entries.length;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${submittedCount} of ${total} ${action}`}
      className="mx-auto flex max-w-5xl flex-col items-center gap-3"
    >
      <div className="flex flex-wrap justify-center gap-2">
        <AnimatePresence>
          {entries.map((entry) => {
            const mascotPath = getMascotPath(entry.mascotId);
            return (
              <motion.div
                key={entry.id}
                layout
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 340, damping: 22 }}
                className="relative flex flex-col items-center gap-1 w-16"
                title={entry.displayName}
              >
                <motion.div
                  animate={{
                    filter: entry.hasSubmitted ? "grayscale(0) brightness(1)" : "grayscale(1) brightness(0.6)",
                    scale: entry.hasSubmitted ? 1 : 0.9,
                  }}
                  transition={{ duration: 0.35 }}
                  className="w-12 h-12 rounded-full bg-slate-700/60 flex items-center justify-center overflow-hidden border-2"
                  style={{
                    borderColor: entry.hasSubmitted ? "#22d3ee" : "rgba(255,255,255,0.1)",
                    boxShadow: entry.hasSubmitted ? "0 0 18px rgba(34,211,238,0.4)" : "none",
                  }}
                >
                  {mascotPath ? (
                    <img src={mascotPath} alt="" className="w-full h-full object-contain" draggable={false} />
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {entry.displayName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </motion.div>
                {entry.hasSubmitted && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-1 -right-1 rounded-full bg-emerald-500 w-4 h-4 flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" stroke="white" strokeWidth="4" fill="none">
                      <polyline points="5 12 10 17 19 7" />
                    </svg>
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <motion.span
        layout
        className="inline-flex items-center gap-2 rounded-full bg-cyan-500/90 px-4 py-1.5 text-sm md:text-base font-black uppercase tracking-wider text-white shadow-[0_8px_24px_rgba(6,182,212,0.4)]"
      >
        <motion.span
          key={submittedCount}
          initial={{ scale: 0.7 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 18 }}
        >
          {submittedCount}
        </motion.span>
        <span className="opacity-80">of {total} {action}</span>
      </motion.span>
    </div>
  );
}

export default SubmissionPool;

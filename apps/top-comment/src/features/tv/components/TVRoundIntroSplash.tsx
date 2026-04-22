import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SplitFlap } from "./SplitFlap";

interface TVRoundIntroSplashProps {
  /** Unique key: when it changes, the splash fires once. */
  triggerKey: string | number;
  roundNumber: number;
  totalRounds: number;
  title: string;
  /** e.g. "Trivia", "Pop Quiz", "Opinion" — appears above the title. */
  kind?: string;
  /** ms to hold on screen; fades itself out automatically. */
  durationMs?: number;
  isFinalRound?: boolean;
}

/**
 * Full-bleed splash that fires for ~2.2s at the start of each round (P1-9).
 * Hides TV HUD while active so the room's attention snaps to the new round.
 */
export function TVRoundIntroSplash({
  triggerKey,
  roundNumber,
  totalRounds,
  title,
  kind,
  durationMs = 2400,
  isFinalRound,
}: TVRoundIntroSplashProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (triggerKey === undefined || triggerKey === null) return;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [triggerKey, durationMs]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center text-center px-8"
          style={{
            background:
              "radial-gradient(circle at 50% 35%, rgba(236,72,153,0.45), transparent 55%), radial-gradient(circle at 50% 75%, rgba(6,182,212,0.45), transparent 55%), rgba(2,6,23,0.92)",
            backdropFilter: "blur(12px)",
          }}
          aria-live="assertive"
        >
          {kind && (
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="mb-6 text-sm md:text-base font-black uppercase tracking-[0.5em] text-cyan-300"
            >
              {kind}
            </motion.span>
          )}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -4 }}
            animate={{ opacity: 1, scale: 1, rotate: -1 }}
            transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex items-center gap-3 mb-8"
          >
            <span className="text-3xl md:text-5xl font-black uppercase tracking-wider text-white/70">
              Round
            </span>
            <span className="text-4xl md:text-7xl">
              <SplitFlap value={String(roundNumber).padStart(2, "0")} length={2} flipMs={70} staggerMs={80} />
            </span>
            <span className="text-2xl md:text-4xl font-black uppercase tracking-wider text-white/40">
              / {totalRounds}
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-5xl text-4xl md:text-6xl lg:text-7xl font-black text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
          >
            {title}
          </motion.h2>
          {isFinalRound && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
              className="mt-10 inline-flex items-center gap-3 rounded-full bg-amber-400 px-8 py-3 text-2xl md:text-3xl font-black text-amber-950 shadow-[0_12px_40px_rgba(251,191,36,0.5)]"
            >
              <span>2× POINTS</span>
              <span className="opacity-70">· final round</span>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TVRoundIntroSplash;

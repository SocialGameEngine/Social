import { useEffect, useRef, useState } from "react";
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
  /** Optional overriding category tag (trivia/topic/prompt/poll) for per-type color. */
  category?: string;
}

/**
 * Per-category tint palette (P1-9). Falls back to the neutral pink/cyan radial
 * when no category is passed.
 */
const CATEGORY_PALETTE: Record<string, { a: string; b: string; eyebrow: string }> = {
  trivia: { a: 'rgba(6,182,212,0.45)', b: 'rgba(236,72,153,0.4)', eyebrow: '#22d3ee' },
  topic: { a: 'rgba(168,85,247,0.45)', b: 'rgba(236,72,153,0.4)', eyebrow: '#c084fc' },
  prompt: { a: 'rgba(236,72,153,0.45)', b: 'rgba(245,158,11,0.35)', eyebrow: '#f9a8d4' },
  poll: { a: 'rgba(34,197,94,0.4)', b: 'rgba(59,130,246,0.4)', eyebrow: '#4ade80' },
  predictive: { a: 'rgba(245,158,11,0.5)', b: 'rgba(236,72,153,0.4)', eyebrow: '#fbbf24' },
  break: { a: 'rgba(59,130,246,0.35)', b: 'rgba(14,165,233,0.35)', eyebrow: '#38bdf8' },
};

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
  durationMs = 4000,
  isFinalRound,
  category,
}: TVRoundIntroSplashProps) {
  const [visible, setVisible] = useState(false);
  const whooshRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (triggerKey === undefined || triggerKey === null) return;
    setVisible(true);
    // Fire a short whoosh sting. Falls back silently if the asset isn't
    // shipped yet.
    try {
      const audio = new Audio('/audio/whoosh.mp3');
      audio.volume = 0.55;
      whooshRef.current = audio;
      void audio.play().catch(() => {});
    } catch {
      /* best-effort */
    }
    const timer = window.setTimeout(() => setVisible(false), durationMs);
    return () => {
      window.clearTimeout(timer);
      whooshRef.current?.pause();
      whooshRef.current = null;
    };
  }, [triggerKey, durationMs]);

  const palette = (() => {
    const key = (category ?? kind ?? '').toLowerCase();
    return CATEGORY_PALETTE[key] ?? null;
  })();
  const tintA = palette?.a ?? 'rgba(236,72,153,0.45)';
  const tintB = palette?.b ?? 'rgba(6,182,212,0.45)';
  const eyebrowColor = palette?.eyebrow ?? '#22d3ee';

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
            background: `radial-gradient(circle at 50% 35%, ${tintA}, transparent 55%), radial-gradient(circle at 50% 75%, ${tintB}, transparent 55%), rgba(2,6,23,0.92)`,
            backdropFilter: "blur(12px)",
          }}
          aria-live="assertive"
        >
          {kind && (
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="mb-6 text-sm md:text-base font-black uppercase tracking-[0.5em]"
              style={{ color: eyebrowColor }}
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
              className="mt-10 inline-flex items-center gap-4 rounded-full bg-amber-400 px-8 py-4 text-2xl md:text-4xl font-black text-amber-950 shadow-[0_12px_40px_rgba(251,191,36,0.5)]"
            >
              <span className="tracking-[0.12em]">
                <SplitFlap
                  value="DOUBLE POINTS"
                  length={13}
                  flipMs={55}
                  staggerMs={45}
                />
              </span>
              <span className="opacity-70 text-base md:text-xl uppercase tracking-[0.3em]">
                final round
              </span>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TVRoundIntroSplash;

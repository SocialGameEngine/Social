import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TVAnswerTile } from "./TVAnswerTile";

export interface RevealSequenceOption {
  /** Stable id for the option (typically index). */
  id: string;
  /** Label shown on the tile. */
  label: string;
  /** Pct of the vote (0-100). */
  votePct: number;
  /** Whether this is THE correct option. */
  isCorrect: boolean;
}

interface TVRevealSequenceProps {
  options: RevealSequenceOption[];
  /**
   * Milliseconds between each wrong-answer X flash. The correct answer is
   * revealed last. Total sequence ≈ (N-1) * stepMs + finale.
   */
  stepMs?: number;
}

/**
 * Staggered reveal (P1-1). Behaviour:
 *   1. All tiles start unrevealed (grey).
 *   2. Wrong tiles flip their "X overlay" one-by-one (stepMs apart).
 *   3. Correct tile reveals last with an extra 500 ms drumroll pause.
 *
 * This is the "suspense build" phase Pete's pillars call for — no simultaneous
 * "all tiles resolve" shortcut.
 */
export function TVRevealSequence({ options, stepMs = 800 }: TVRevealSequenceProps) {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [correctRevealed, setCorrectRevealed] = useState(false);

  useEffect(() => {
    setRevealedIds(new Set());
    setCorrectRevealed(false);

    const wrongOptions = options.filter((o) => !o.isCorrect);
    const correctOption = options.find((o) => o.isCorrect);
    const timers: number[] = [];

    wrongOptions.forEach((opt, idx) => {
      const handle = window.setTimeout(() => {
        setRevealedIds((prev) => {
          const next = new Set(prev);
          next.add(opt.id);
          return next;
        });
      }, idx * stepMs);
      timers.push(handle);
    });

    if (correctOption) {
      const handle = window.setTimeout(() => {
        setRevealedIds((prev) => {
          const next = new Set(prev);
          next.add(correctOption.id);
          return next;
        });
        setCorrectRevealed(true);
      }, wrongOptions.length * stepMs + 500);
      timers.push(handle);
    }

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [options, stepMs]);

  return (
    <div className="relative mx-auto grid w-full max-w-5xl gap-4 sm:grid-cols-2">
      {options.map((opt, idx) => (
        <TVAnswerTile
          key={opt.id}
          label={opt.label}
          index={idx}
          votePct={opt.votePct}
          isCorrect={opt.isCorrect}
          isRevealed={revealedIds.has(opt.id)}
        />
      ))}
      {/* Drumroll flash when the correct answer lands */}
      <AnimatePresence>
        {correctRevealed && (
          <motion.div
            className="pointer-events-none absolute inset-0 -z-10 rounded-3xl"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: [0, 0.5, 0], scale: [0.7, 1.15, 1.5] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              background:
                "radial-gradient(circle, rgba(52,211,153,0.7), transparent 60%)",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default TVRevealSequence;

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { TVAnswerTile } from "./TVAnswerTile";

export interface TVRevealSequenceTile {
  id: string;
  label: string;
  optionIndex: number;
  voteCount: number;
  totalVotes: number;
  isCorrect: boolean;
}

interface TVRevealSequenceProps {
  tiles: TVRevealSequenceTile[];
  /** Ms between revealing each wrong tile; correct tile is last (+ pause). */
  stepMs?: number;
}

/**
 * P1-1 staggered reveal: wrong options earn an X one-by-one; correct lands
 * last with a green wash + confetti accent. Vote bars stay visible throughout.
 */
export function TVRevealSequence({ tiles, stepMs = 800 }: TVRevealSequenceProps) {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [correctRevealed, setCorrectRevealed] = useState(false);

  useEffect(() => {
    setRevealedIds(new Set());
    setCorrectRevealed(false);

    const wrong = tiles.filter((t) => !t.isCorrect);
    const correct = tiles.find((t) => t.isCorrect);
    const timers: number[] = [];

    wrong.forEach((t, idx) => {
      timers.push(
        window.setTimeout(() => {
          setRevealedIds((prev) => new Set(prev).add(t.id));
        }, idx * stepMs)
      );
    });

    if (correct) {
      timers.push(
        window.setTimeout(() => {
          setRevealedIds((prev) => new Set(prev).add(correct.id));
          setCorrectRevealed(true);
          try {
            void confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.65 },
              colors: ["#22c55e", "#06b6d4", "#eab308"],
            });
          } catch {
            /* optional dependency */
          }
        }, wrong.length * stepMs + 500)
      );
    }

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [tiles, stepMs]);

  return (
    <div className="relative mx-auto grid w-full max-w-5xl grid-cols-1 gap-5 md:grid-cols-2">
      {tiles.map((t) => (
        <TVAnswerTile
          key={t.id}
          optionIndex={t.optionIndex}
          label={t.label}
          voteCount={t.voteCount}
          totalVotes={t.totalVotes}
          isRevealed={revealedIds.has(t.id)}
          isCorrect={t.isCorrect}
          layoutId={`tv-answer-tile-${t.id}`}
        />
      ))}
      <AnimatePresence>
        {correctRevealed && (
          <motion.div
            className="pointer-events-none absolute inset-0 -z-10 rounded-3xl"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: [0, 0.45, 0], scale: [0.7, 1.12, 1.45] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            style={{
              background:
                "radial-gradient(circle, rgba(52,211,153,0.65), transparent 62%)",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default TVRevealSequence;

import { motion } from "framer-motion";

interface TVRoundProgressProps {
  currentIndex: number;
  totalRounds: number;
  /** Highlight the last segment as the "final round" (P1-11 pairing). */
  markFinal?: boolean;
}

/**
 * Segmented progress bar (P1-20). One segment per round. Filled segments use
 * the brand cyan; the active segment throbs; the final segment is tinted
 * amber when `markFinal` is true so players know the 2x multiplier is coming.
 */
export function TVRoundProgress({ currentIndex, totalRounds, markFinal = true }: TVRoundProgressProps) {
  if (!totalRounds || totalRounds <= 0) return null;
  const clamped = Math.min(currentIndex, totalRounds - 1);

  return (
    <div
      className="mx-auto w-full max-w-4xl px-6"
      aria-label={`Round ${clamped + 1} of ${totalRounds}`}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={totalRounds}
      aria-valuenow={clamped + 1}
    >
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalRounds }).map((_, i) => {
          const isPast = i < clamped;
          const isActive = i === clamped;
          const isFinal = markFinal && i === totalRounds - 1;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              className="h-1.5 flex-1 rounded-full overflow-hidden"
              style={{
                background: isPast
                  ? "#06b6d4"
                  : isActive
                    ? "linear-gradient(90deg,#06b6d4 0%,#22d3ee 100%)"
                    : isFinal
                      ? "rgba(245,158,11,0.35)"
                      : "rgba(255,255,255,0.12)",
                boxShadow: isActive ? "0 0 18px rgba(34,211,238,0.6)" : undefined,
              }}
            >
              {isActive && (
                <motion.div
                  animate={{ x: ["-100%", "120%"] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  className="h-full w-1/3"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white/70">
        <span>Round {clamped + 1} / {totalRounds}</span>
        {markFinal && clamped === totalRounds - 1 && (
          <span className="text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
            Final round · 2x
          </span>
        )}
      </div>
    </div>
  );
}

export default TVRoundProgress;

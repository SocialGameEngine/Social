import { useHypeMeter } from "../../room/hooks/useHypeMeter";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Confetti } from "./Confetti";

interface TVHypeMeterProps {
  /** Room id. Hype is scoped per room. */
  roomId: string | null | undefined;
  /** Whether the meter is currently accepting taps (gate to post-reveal). */
  active: boolean;
  /** Called when the hype meter crosses a new level threshold. */
  onLevelUp?: (level: number) => void;
}

/**
 * P1-2: collective hype meter display for the TV. Fills as phones tap,
 * bursts a celebration swell + confetti + sound when hitting a level threshold.
 */
export function TVHypeMeter({ roomId, active, onLevelUp }: TVHypeMeterProps) {
  const [swell, setSwell] = useState<number | null>(null);
  const { snapshot } = useHypeMeter({
    roomId,
    enabled: active,
    onLevelUp: (level) => {
      setSwell(level);
      window.setTimeout(() => setSwell(null), 2400);
      onLevelUp?.(level);
    },
  });

  if (!active) return null;

  const barColor =
    snapshot.level >= 3
      ? "from-pink-500 via-fuchsia-500 to-amber-400"
      : snapshot.level >= 2
        ? "from-amber-400 via-orange-500 to-pink-500"
        : snapshot.level >= 1
          ? "from-emerald-400 to-cyan-400"
          : "from-cyan-400 to-cyan-500";

  return (
    <div
      className="mx-auto mt-4 flex w-full max-w-3xl flex-col items-center gap-2"
      aria-label="Collective hype meter"
    >
      <div className="flex w-full items-center justify-between px-1 text-xs font-black uppercase tracking-wider text-cyan-200">
        <span>Hype · tap your phone</span>
        <span className="tabular-nums">Lv {snapshot.level} · {snapshot.tapsInWindow}</span>
      </div>
      <div className="relative h-5 w-full overflow-hidden rounded-full bg-slate-800/80 ring-1 ring-white/10">
        <motion.div
          className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${snapshot.progress * 100}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            boxShadow:
              snapshot.level >= 2
                ? "0 0 24px rgba(251,146,60,0.65)"
                : "0 0 12px rgba(6,182,212,0.5)",
          }}
        />
        {/* Pulse ping on each tap for TV motion. */}
        {snapshot.lastTapAt && (
          <motion.div
            key={snapshot.lastTapAt}
            className="absolute inset-0 rounded-full bg-white"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        )}
      </div>

      <AnimatePresence>
        {swell !== null && (
          <motion.div
            initial={{ scale: 0.4, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.2, opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 360, damping: 18 }}
            className="pointer-events-none fixed left-1/2 top-1/2 z-[85] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-gradient-to-r from-pink-500 via-amber-400 to-cyan-400 px-10 py-6 text-4xl md:text-6xl font-black uppercase tracking-widest text-white shadow-[0_32px_80px_rgba(236,72,153,0.6)]"
            aria-hidden="true"
          >
            {swell >= 3 ? "LEGENDARY!" : swell >= 2 ? "HYPE!" : "VIBES!"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* P1-2: confetti burst on Lv2+ level-up. */}
      <Confetti active={swell !== null && swell >= 2} count={60} />
    </div>
  );
}

export default TVHypeMeter;

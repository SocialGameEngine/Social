import { useEffect, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

interface LeaderboardRow {
  id: string;
  name: string;
  score: number;
  deltaFromLastRound?: number;
  avatarUrl?: string;
}

interface TVLeaderboardMomentProps {
  /** Increment this when a results phase begins; the moment fires once. */
  triggerKey: string | number | null | undefined;
  rows: LeaderboardRow[];
  /** ms to hold the moment on screen. */
  durationMs?: number;
  /** Title above the board. */
  title?: string;
}

/**
 * The "leaderboard as a moment" moment (P1-10).
 *
 * Fires once per `triggerKey` change. Dims everything else on the TV and
 * blows the leaderboard up to full screen for `durationMs`, with a beat
 * animation: all rows flash their delta chip, then fade to normal. Prepares
 * the room for the next-round intro.
 */
export function TVLeaderboardMoment({
  triggerKey,
  rows,
  durationMs = 5200,
  title = "Tonight's board",
}: TVLeaderboardMomentProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (triggerKey === null || triggerKey === undefined) return;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [triggerKey, durationMs]);

  const sorted = [...rows].sort((a, b) => b.score - a.score).slice(0, 10);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[65] flex flex-col items-center justify-center px-6"
          style={{
            background:
              "radial-gradient(circle at 50% 20%, rgba(192,132,252,0.5), transparent 50%), radial-gradient(circle at 50% 80%, rgba(6,182,212,0.45), transparent 50%), rgba(2,6,23,0.94)",
            backdropFilter: "blur(10px)",
          }}
          aria-live="polite"
        >
          <motion.h2
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-8 text-5xl md:text-7xl font-black uppercase tracking-tight text-white text-center drop-shadow-[0_4px_24px_rgba(236,72,153,0.6)]"
          >
            {title}
          </motion.h2>
          <LayoutGroup id="lb">
            <AnimatePresence mode="popLayout">
              <div className="w-full max-w-3xl space-y-2">
                {sorted.map((row, i) => {
                  const delta = row.deltaFromLastRound ?? 0;
                  return (
                    <motion.div
                      key={row.id}
                      layout
                      layoutId={`lb-row-${row.id}`}
                      initial={{ opacity: 0, x: -40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      transition={{ duration: 0.35, delay: i * 0.05, layout: { type: "spring", stiffness: 280, damping: 26 } }}
                      className="flex items-center gap-5 rounded-2xl px-5 py-4 text-white"
                      style={{
                        background:
                          i === 0
                            ? "linear-gradient(90deg, rgba(251,191,36,0.35), rgba(251,191,36,0.1))"
                            : i === 1
                              ? "linear-gradient(90deg, rgba(226,232,240,0.28), rgba(226,232,240,0.08))"
                              : i === 2
                                ? "linear-gradient(90deg, rgba(217,119,6,0.28), rgba(217,119,6,0.08))"
                                : "rgba(15,23,42,0.6)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <span className="w-10 text-2xl md:text-3xl font-black tabular-nums text-white/80">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-2xl md:text-3xl font-bold truncate">
                        {row.name}
                      </span>
                      {delta > 0 && (
                        <motion.span
                          initial={{ scale: 0, rotate: -12 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: i * 0.05 + 0.4, type: "spring", stiffness: 320, damping: 22 }}
                          className="rounded-full bg-emerald-400 px-3 py-1 text-sm md:text-base font-black text-emerald-950"
                        >
                          ↑{delta}
                        </motion.span>
                      )}
                      {delta < 0 && (
                        <motion.span
                          initial={{ scale: 0, rotate: 12 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: i * 0.05 + 0.4, type: "spring", stiffness: 320, damping: 22 }}
                          className="rounded-full bg-orange-400 px-3 py-1 text-sm md:text-base font-black text-orange-950"
                        >
                          ↓{Math.abs(delta)}
                        </motion.span>
                      )}
                      <span className="text-3xl md:text-4xl font-black tabular-nums text-cyan-200">
                        {row.score}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          </LayoutGroup>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TVLeaderboardMoment;

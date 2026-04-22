import { AnimatePresence, motion } from "framer-motion";

interface NearMissBannerProps {
  /** Player who just missed the top-3. */
  playerName: string | null | undefined;
  /** Point gap to the next-highest position. */
  pointGap: number | null | undefined;
  /** Visibility toggle — parent scopes timing. */
  visible: boolean;
}

/**
 * "So close! You were X points off the podium" banner (P1-31).
 *
 * Fired at EndedPhase / results tail for 4-th-6-th placers. Copy warms the
 * loss instead of letting the player walk away deflated — maps to the retro
 * pillar "design for the loser, not just the winner."
 */
export function NearMissBanner({ playerName, pointGap, visible }: NearMissBannerProps) {
  const headline =
    pointGap != null && pointGap <= 3
      ? `So close — ${pointGap} point${pointGap === 1 ? '' : 's'} off the podium`
      : pointGap != null && pointGap <= 10
        ? `Within striking distance — ${pointGap} points off`
        : `Good run, ${playerName ?? 'friend'}`;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          className="mx-auto max-w-2xl rounded-2xl bg-slate-800/70 px-5 py-4 text-center"
          style={{ border: "1px solid rgba(192,132,252,0.35)", backdropFilter: "blur(8px)" }}
          role="status"
          aria-live="polite"
        >
          <p className="text-base md:text-lg font-black uppercase tracking-wider text-purple-200">
            {headline}
          </p>
          <p className="mt-1 text-sm md:text-base text-slate-300">
            Stick around — the next one's yours.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default NearMissBanner;

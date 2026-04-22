import { motion, AnimatePresence } from "framer-motion";

interface LookUpOverlayProps {
  /** Show the overlay (typically during reveal/results phases). */
  visible: boolean;
  /** Copy override. Default "Look up!". */
  headline?: string;
  /** Subtitle. Default tone is "we'll tell you when to play again." */
  subtitle?: string;
}

/**
 * P1-27: during TV reveal phases, the player's phone collapses to a single
 * "Look up!" screen. Keeps eyes on the TV and out of their notifications.
 *
 * This is the MINIMAL phone state — no leaderboard, no CTA, no chat widget.
 * Parent decides when to show it (phase === 'reveal' && isPhone).
 */
export function LookUpOverlay({
  visible,
  headline = "Look up!",
  subtitle = "The reveal is on the TV.",
}: LookUpOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[55] flex flex-col items-center justify-center text-center px-8"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, rgba(14,165,233,0.55), transparent 55%), rgba(2,6,23,0.95)",
            backdropFilter: "blur(12px)",
          }}
          role="status"
          aria-live="assertive"
        >
          <motion.svg
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            width="88"
            height="88"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-6 text-cyan-300 drop-shadow-[0_0_18px_rgba(34,211,238,0.8)]"
          >
            <polyline points="18 15 12 9 6 15" />
          </motion.svg>
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-6xl font-black uppercase tracking-tight text-white mb-4 drop-shadow-[0_4px_18px_rgba(0,0,0,0.6)]"
          >
            {headline}
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg md:text-xl text-cyan-100/80 max-w-md"
          >
            {subtitle}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LookUpOverlay;

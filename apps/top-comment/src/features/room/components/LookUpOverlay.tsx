import { motion, AnimatePresence } from "framer-motion";

interface LookUpOverlayProps {
  /** Show the overlay (P1-27: bind to `reveal` phase). */
  visible: boolean;
  headline?: string;
  subtitle?: string;
  /** Optional full-bleed tint from the player's chosen answer tile (hex). */
  accentColor?: string | null;
}

/**
 * P1-27: minimal "look at the TV" state — full-bleed tint, single glyph,
 * breathing pulse (no duplicate leaderboard/timer chrome).
 */
export function LookUpOverlay({
  visible,
  headline = "Hang tight",
  subtitle = "The reveal is on the TV.",
  accentColor,
}: LookUpOverlayProps) {
  const accent = accentColor ?? "#0ea5e9";

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
            background: `radial-gradient(circle at 50% 38%, ${accent}99, transparent 52%), rgba(2,6,23,0.96)`,
            backdropFilter: "blur(12px)",
          }}
          role="status"
          aria-live="assertive"
        >
          <motion.div
            animate={{
              scale: [1, 1.035, 1],
              filter: [
                "hue-rotate(0deg)",
                "hue-rotate(10deg)",
                "hue-rotate(0deg)",
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center"
          >
            <motion.svg
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              width="88"
              height="88"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-6 text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.35)]"
              style={{ color: accent }}
            >
              <polyline points="18 15 12 9 6 15" />
            </motion.svg>
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl font-black uppercase tracking-tight text-white mb-4 drop-shadow-[0_4px_18px_rgba(0,0,0,0.6)]"
            >
              {headline}
            </motion.h1>
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-lg md:text-xl text-white/85 max-w-md"
            >
              {subtitle}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LookUpOverlay;

import { motion } from "framer-motion";

interface TVFinalRoundBadgeProps {
  /** Display this badge fixed to the top-center while the final round is live. */
  visible: boolean;
  /** Points multiplier for the final round. Default 2. */
  multiplier?: number;
}

/**
 * Floating "Final round · 2× points" chip (P1-11). Fixed to the top-center of
 * the TV, sized to read from across the pub. Auto-hides outside the final
 * round phase so the HUD stays uncluttered.
 */
export function TVFinalRoundBadge({ visible, multiplier = 2 }: TVFinalRoundBadgeProps) {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -40, scale: 0.8, rotate: -6 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: -2 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className="fixed left-1/2 top-5 z-40 -translate-x-1/2"
      aria-label={`Final round — ${multiplier} times points multiplier active`}
      role="status"
    >
      <motion.div
        animate={{
          boxShadow: [
            "0 12px 40px rgba(251,191,36,0.35)",
            "0 18px 60px rgba(251,191,36,0.75)",
            "0 12px 40px rgba(251,191,36,0.35)",
          ],
        }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2 text-sm md:text-base font-black uppercase tracking-[0.18em] text-amber-950"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2l2.39 7.36H22l-6.18 4.5L18.21 21 12 16.5 5.79 21l2.39-7.14L2 9.36h7.61L12 2z" />
        </svg>
        Final round · {multiplier}× points
      </motion.div>
    </motion.div>
  );
}

export default TVFinalRoundBadge;

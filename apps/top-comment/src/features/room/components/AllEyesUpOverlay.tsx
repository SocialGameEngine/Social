import { AnimatePresence, motion } from "framer-motion";

interface AllEyesUpOverlayProps {
  visible: boolean;
  /** Optional custom copy; default is "Host is speaking". */
  headline?: string;
}

/**
 * P1-6: grey-out overlay that appears on every RoomPage when the host hits
 * the "All Eyes Up" button. Designed to kill phone distractions during
 * tie-break explanations and long read-outs in a noisy pub.
 *
 * Layer z-index: 60 — above modals (50) but below reconnecting banner (80).
 */
export function AllEyesUpOverlay({
  visible,
  headline = "Host is speaking",
}: AllEyesUpOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center text-center px-8"
          style={{
            background: "rgba(15,23,42,0.92)",
            backdropFilter: "blur(16px)",
          }}
          role="status"
          aria-live="assertive"
        >
          <motion.svg
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-amber-300 mb-8 drop-shadow-[0_0_24px_rgba(251,191,36,0.7)]"
          >
            <polyline points="18 15 12 9 6 15" />
          </motion.svg>
          <h1 className="text-5xl font-black uppercase tracking-tight text-white mb-3 drop-shadow-lg">
            {headline}
          </h1>
          <p className="text-xl text-slate-300 max-w-md">
            Look at the TV.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AllEyesUpOverlay;

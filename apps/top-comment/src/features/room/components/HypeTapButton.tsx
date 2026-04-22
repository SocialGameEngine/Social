import { motion } from "framer-motion";
import { useHypeMeter } from "../hooks/useHypeMeter";

interface HypeTapButtonProps {
  roomId: string | null | undefined;
  /** Only show + accept taps when hype window is open. */
  active: boolean;
}

/**
 * P1-2 phone side: big juicy tap button that fires into the collective hype
 * meter. Only rendered when `active` (parent scopes to post-reveal window).
 */
export function HypeTapButton({ roomId, active }: HypeTapButtonProps) {
  const { snapshot, tap } = useHypeMeter({ roomId, enabled: active });

  if (!active) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 z-[62] flex flex-col items-center gap-2 px-6">
      <span className="text-xs font-black uppercase tracking-widest text-amber-300 drop-shadow">
        Hype · Lv {snapshot.level}
      </span>
      <motion.button
        type="button"
        onClick={() => {
          tap();
          if (navigator.vibrate) navigator.vibrate(12);
        }}
        whileTap={{ scale: 0.9 }}
        className="h-28 w-28 rounded-full bg-gradient-to-br from-amber-400 via-pink-500 to-fuchsia-600 text-2xl font-black uppercase tracking-widest text-white shadow-[0_16px_48px_rgba(236,72,153,0.55)] ring-4 ring-white/30"
        aria-label="Hype tap"
      >
        TAP
      </motion.button>
    </div>
  );
}

export default HypeTapButton;

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ComboPopupProps {
  /** Player whose combo just extended. */
  playerName: string | null | undefined;
  /** Current combo length. `null` or ≤1 hides the popup. */
  comboCount: number | null | undefined;
  /** Unique key that increments each time the combo extends. */
  triggerKey: string | number | null | undefined;
  /** Mascot avatar path, optional. */
  mascotUrl?: string;
  /** ms to hold on screen. */
  durationMs?: number;
}

/**
 * "2x COMBO!" / "3x ON FIRE!" popup (P1-22). Fires only when the combo is ≥2.
 * Parent should bump `triggerKey` every time a player extends their streak so
 * the component animates a fresh burst (re-running even if combo stays the
 * same length across reconnects would feel spammy).
 */
export function ComboPopup({
  playerName,
  comboCount,
  triggerKey,
  mascotUrl,
  durationMs = 2200,
}: ComboPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (triggerKey === null || triggerKey === undefined) return;
    if (!comboCount || comboCount < 2) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [triggerKey, comboCount, durationMs]);

  const label = !comboCount
    ? ""
    : comboCount >= 5
      ? "UNSTOPPABLE"
      : comboCount >= 4
        ? "ON FIRE"
        : comboCount >= 3
          ? "STREAK"
          : "COMBO";

  return (
    <AnimatePresence>
      {visible && comboCount && comboCount >= 2 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: -2 }}
          exit={{ opacity: 0, scale: 0.8, y: -40 }}
          transition={{ type: "spring", stiffness: 360, damping: 18 }}
          className="fixed left-1/2 top-1/3 z-[75] -translate-x-1/2 -translate-y-1/2 flex items-center gap-4 rounded-3xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 px-8 py-5 shadow-[0_24px_64px_rgba(251,146,60,0.6)]"
          role="status"
          aria-live="polite"
        >
          {mascotUrl && (
            <img
              src={mascotUrl}
              alt=""
              className="w-16 h-16 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
              draggable={false}
            />
          )}
          <div className="flex flex-col items-start">
            <span className="text-xl md:text-2xl font-black text-amber-950 uppercase tracking-wider">
              {playerName ?? 'Player'}
            </span>
            <span className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] uppercase">
              {comboCount}× {label}!
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ComboPopup;

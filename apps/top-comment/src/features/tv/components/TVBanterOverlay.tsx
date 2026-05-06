import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSocialeBanter } from '../../sociale/hooks/useSocialeBanter';

interface TVBanterOverlayProps {
  socialeId: string | null | undefined;
}

/**
 * P1-7: Rotates on_tv banter messages at the bottom of the TV screen.
 * Messages cycle every 8s. Hidden when there are none.
 */
export function TVBanterOverlay({ socialeId }: TVBanterOverlayProps) {
  const { data: banterItems = [] } = useSocialeBanter(socialeId ?? undefined, 'on_tv');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banterItems.length <= 1) return;
    const interval = window.setInterval(() => {
      setCurrentIndex(i => (i + 1) % banterItems.length);
    }, 8000);
    return () => window.clearInterval(interval);
  }, [banterItems.length]);

  // Reset index when items change so we don't read out of bounds
  useEffect(() => {
    setCurrentIndex(0);
  }, [socialeId]);

  if (banterItems.length === 0) return null;
  const current = banterItems[currentIndex];
  if (!current) return null;

  return (
    <div className="fixed bottom-10 inset-x-0 flex justify-center z-30 px-6 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35 }}
          className="max-w-xl w-full rounded-2xl bg-slate-900/90 backdrop-blur-sm px-6 py-4 text-center ring-1 ring-white/10 shadow-2xl"
        >
          <p className="text-lg font-semibold text-white leading-snug">"{(current as any).content}"</p>
          <p className="text-sm text-slate-400 mt-1.5">— {(current as any).displayName ?? (current as any).display_name ?? 'Anonymous'}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default TVBanterOverlay;

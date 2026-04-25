// TV-side tie-break announcement overlay.
// Shown when sociale.isTieBreak becomes true between rounds.

import { motion, AnimatePresence } from 'framer-motion';
import { generateTieBreakAnnouncement } from '../../../domain/sociale/tieBreak';

interface TieBreakBannerProps {
  isVisible: boolean;
  participants: string[];
  displayNames: Record<string, string>;
  roundNumber: number;
}

export function TieBreakBanner({
  isVisible,
  participants,
  displayNames,
  roundNumber,
}: TieBreakBannerProps) {
  const announcement = generateTieBreakAnnouncement(participants, roundNumber, displayNames);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: -40 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Card */}
          <div className="relative mx-6 max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl border border-white/20">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-orange-500 to-yellow-400 opacity-90" />

            <div className="relative z-10 px-10 py-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                className="text-7xl mb-6"
              >
                🔥
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
              >
                TIE-BREAK!
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xl md:text-2xl text-white/90 font-semibold leading-snug"
              >
                {announcement}
              </motion.p>

              {/* Participant chips */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="flex flex-wrap justify-center gap-3 mt-8"
              >
                {participants.map((id) => (
                  <span
                    key={id}
                    className="px-5 py-2 bg-white/20 border border-white/40 rounded-full text-white font-bold text-lg"
                  >
                    {displayNames[id] ?? id}
                  </span>
                ))}
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-6 text-white/70 text-base"
              >
                10 seconds · Double points
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

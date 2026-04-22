import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Sociale } from '../../../domain/types/sociale.types';

interface BreakPhaseProps {
  sociale: Sociale;
  isDark?: boolean;
}

function formatRemaining(msRemaining: number): { m: string; s: string } {
  const clamped = Math.max(0, msRemaining);
  const mins = Math.floor(clamped / 60000);
  const secs = Math.floor((clamped % 60000) / 1000);
  return {
    m: String(mins).padStart(2, '0'),
    s: String(secs).padStart(2, '0'),
  };
}

/**
 * TV "drinks break" intermission (P1-8).
 *
 * Renders a giant countdown + friendly copy while the host runs a 5/10/15 min
 * break. Host soundboard can fire lobby music underneath via `useTVSoundboard`.
 */
export function BreakPhase({ sociale, isDark: _isDark }: BreakPhaseProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  const endsAt = sociale.phaseEndsAt ? new Date(sociale.phaseEndsAt).getTime() : null;
  const remainingMs = endsAt ? endsAt - now : 0;
  const { m, s } = formatRemaining(remainingMs);
  const isDone = endsAt !== null && remainingMs <= 0;

  return (
    <section className="flex flex-col items-center gap-10 text-center">
      <motion.span
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="chaos-tv-eyebrow chaos-tv-eyebrow--cyan"
      >
        Drinks break
      </motion.span>

      <motion.h2
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="chaos-tv-title chaos-tv-title--soft text-5xl md:text-7xl"
      >
        Back in a bit
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex items-center justify-center"
      >
        <span
          className="font-black tabular-nums"
          style={{
            fontSize: 'clamp(8rem, 24vw, 22rem)',
            lineHeight: 1,
            color: isDone ? '#22d3ee' : '#f9a8d4',
            textShadow: '0 10px 40px rgba(236,72,153,0.55)',
          }}
          aria-live="polite"
        >
          {m}:{s}
        </span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="text-2xl md:text-4xl font-bold text-white/80"
      >
        {isDone ? "We're back!" : 'Stretch. Grab a drink. Hit the loo.'}
      </motion.p>
    </section>
  );
}

export default BreakPhase;

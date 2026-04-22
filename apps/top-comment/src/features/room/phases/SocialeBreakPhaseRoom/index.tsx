import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Sociale } from '../../../../domain/types/sociale.types';

interface SocialeBreakPhaseRoomProps {
  sociale: Sociale;
  phaseEndsAt?: string | null;
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
 * Room-side view during the P1-8 intermission. Mirrors the TV BreakPhase copy
 * ("back in a bit") and surfaces a phone-sized countdown so players can see
 * exactly when play resumes without looking at the big screen. Intentionally
 * doesn't let the player leave — we just want them to put the phone down.
 */
export function SocialeBreakPhaseRoom({ sociale, phaseEndsAt }: SocialeBreakPhaseRoomProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);

  const endsAtSource = phaseEndsAt ?? sociale.phaseEndsAt ?? null;
  const endsAt = endsAtSource ? new Date(endsAtSource).getTime() : null;
  const remainingMs = endsAt ? endsAt - now : 0;
  const { m, s } = formatRemaining(remainingMs);
  const isDone = endsAt !== null && remainingMs <= 0;

  return (
    <section className="flex w-full max-w-xl flex-col items-center gap-8 px-6 py-12 text-center">
      <motion.span
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-xs md:text-sm font-black uppercase tracking-[0.4em] text-cyan-300"
      >
        Intermission
      </motion.span>
      <motion.h1
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
        className="text-4xl md:text-5xl font-black text-white drop-shadow"
      >
        Back in a bit
      </motion.h1>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-[6rem] md:text-[8rem] font-black tabular-nums leading-none"
        style={{
          color: isDone ? '#22d3ee' : '#f9a8d4',
          textShadow: '0 10px 40px rgba(236,72,153,0.55)',
        }}
        aria-live="polite"
      >
        {m}:{s}
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-lg md:text-xl font-bold text-white/70"
      >
        {isDone ? "We're back!" : 'Stretch. Grab a drink. Back shortly.'}
      </motion.p>
    </section>
  );
}

export default SocialeBreakPhaseRoom;

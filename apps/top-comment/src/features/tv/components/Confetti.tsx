import { useMemo } from "react";
import { motion } from "framer-motion";

interface ConfettiProps {
  /** When true, confetti is rendered. Parent controls visibility window. */
  active: boolean;
  /** How many pieces. Default 80. */
  count?: number;
  /** Burst duration in seconds. Default 4. */
  durationSec?: number;
  /** Palette hex strings. */
  palette?: string[];
}

const DEFAULT_PALETTE = ["#f472b6", "#22d3ee", "#fbbf24", "#c084fc", "#4ade80"];

/**
 * Dependency-free confetti burst (P1-30).
 *
 * Spawns `count` particles at the top of the viewport with randomized
 * rotation + drift, animated via framer-motion to fall and tumble. Keeps the
 * bundle weightless — no canvas-confetti dep — and is sufficient for a TV
 * celebration moment held for a few seconds.
 */
export function Confetti({
  active,
  count = 80,
  durationSec = 4,
  palette = DEFAULT_PALETTE,
}: ConfettiProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: `c-${i}`,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      fallDuration: durationSec * (0.65 + Math.random() * 0.5),
      driftX: (Math.random() - 0.5) * 200,
      rotateStart: Math.random() * 360,
      rotateEnd: Math.random() * 720 - 360,
      color: palette[Math.floor(Math.random() * palette.length)],
      size: 6 + Math.random() * 10,
      isStrip: Math.random() > 0.5,
    }));
  }, [count, durationSec, palette]);

  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[80] overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{
            x: 0,
            y: "-10vh",
            rotate: p.rotateStart,
            opacity: 1,
          }}
          animate={{
            x: p.driftX,
            y: "110vh",
            rotate: p.rotateEnd,
            opacity: [1, 1, 0.9, 0],
          }}
          transition={{
            duration: p.fallDuration,
            delay: p.delay,
            ease: "easeIn",
            times: [0, 0.6, 0.85, 1],
          }}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: 0,
            width: p.isStrip ? p.size * 0.3 : p.size,
            height: p.isStrip ? p.size * 2 : p.size,
            background: p.color,
            borderRadius: p.isStrip ? 2 : "50%",
            boxShadow: `0 0 6px ${p.color}aa`,
          }}
        />
      ))}
    </div>
  );
}

export default Confetti;

import { motion } from 'framer-motion';
import { getMascotPath } from '../../../shared/mascots';
import type { Sociale, Socialite } from '../../../domain/types/sociale.types';

interface LobbyPhaseProps {
  sociale: Sociale;
  socialites: Socialite[];
  roomCode: string;
  /** Kept for prop parity with the other phases; chaos TV is a single vivid theme. */
  isDark?: boolean;
}

export function LobbyPhase({ sociale: _sociale, socialites, roomCode: _roomCode, isDark: _isDark }: LobbyPhaseProps) {
  return (
    <section className="flex flex-col items-center gap-8 text-center">
      <span className="chaos-tv-eyebrow chaos-tv-eyebrow--cyan">Warming up</span>

      <h2 className="chaos-tv-title chaos-tv-title--soft text-5xl md:text-7xl">
        {socialites.length === 0
          ? 'Scan the QR to join'
          : `${socialites.length} player${socialites.length === 1 ? '' : 's'} in the room`}
      </h2>

      {socialites.length > 0 && (
        <motion.ul
          className="flex flex-wrap items-center justify-center gap-3 max-w-6xl"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
        >
          {socialites.map((s, i) => {
            const mascotPath = getMascotPath(s.mascotId);
            const tint =
              i % 3 === 0 ? '' : i % 3 === 1 ? 'chaos-tv-chip--pink' : 'chaos-tv-chip--cyan';
            const rot = i % 2 === 0 ? '-1.5deg' : '1.5deg';
            return (
              <motion.li
                key={s.id}
                variants={{
                  hidden: { opacity: 0, y: 18, rotate: -6, scale: 0.9 },
                  visible: { opacity: 1, y: 0, rotate: 0, scale: 1 },
                }}
                transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
                className={`chaos-tv-chip ${tint}`}
                style={{ transform: `rotate(${rot})` }}
              >
                {mascotPath ? (
                  <img
                    src={mascotPath}
                    alt=""
                    className="chaos-tv-chip-mascot"
                    draggable={false}
                  />
                ) : (
                  <span
                    className="chaos-tv-chip-mascot inline-flex items-center justify-center text-base"
                    aria-hidden
                  >
                    ?
                  </span>
                )}
                <span className="chaos-tv-chip-name">{s.displayName}</span>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </section>
  );
}

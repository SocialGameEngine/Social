import { useState } from 'react';
import { motion } from 'framer-motion';
import { getMascotPath } from '../../../shared/mascots';
import type {
  Sociale,
  SocialeRound,
  SocialeResponse,
  SocialeScoreboardEntry,
} from '../../../domain/types/sociale.types';
import { DualLeaderboard } from '../components/DualLeaderboard';
import { useRoomAllTimeLeaderboard } from '../hooks/useRoomAllTimeLeaderboard';
import { SequentialStatCards } from '../components/SequentialStatCards';

interface ResultsPhaseProps {
  sociale: Sociale;
  currentRound: SocialeRound | null;
  responses: SocialeResponse[];
  scoreboard: SocialeScoreboardEntry[];
  roomId?: string;
  /** Kept for prop parity — chaos TV styling is a single vivid theme. */
  isDark?: boolean;
}

export function ResultsPhase({
  sociale,
  scoreboard,
  roomId,
  isDark: _isDark,
}: ResultsPhaseProps) {
  const isAmbient = sociale.mode === 'ambient';
  const allTimeQuery = useRoomAllTimeLeaderboard(isAmbient ? roomId : undefined);
  const [statCardsDone, setStatCardsDone] = useState(false);

  const mappedScoreboard = scoreboard.map((entry) => ({
    id: entry.socialiteId,
    rank: entry.rank,
    teamName: entry.displayName,
    score: entry.score,
    mascotId: entry.mascotId,
  }));

  // Show sequential stat cards overlay until dismissed, then reveal leaderboard.
  // Ambient mode skips stat cards (continuous loop, no natural pause point).
  if (!isAmbient && !statCardsDone) {
    return (
      <SequentialStatCards
        sociale={sociale}
        isActive={true}
        onNext={() => setStatCardsDone(true)}
        onSkip={() => setStatCardsDone(true)}
      />
    );
  }

  // Ambient mode keeps the side-by-side dual leaderboard.
  if (isAmbient) {
    return (
      <section className="flex flex-col gap-6">
        <div className="flex justify-center">
          <span className="chaos-tv-eyebrow chaos-tv-eyebrow--cyan">Leaderboard</span>
        </div>
        <DualLeaderboard
          tonightEntries={mappedScoreboard}
          allTimeEntries={allTimeQuery.data ?? []}
          isDark={true}
        />
      </section>
    );
  }

  // Hosted/standard mode: single chaos leaderboard with podium rows.
  return (
    <section className="flex flex-col gap-6">
      <div className="flex justify-center">
        <span className="chaos-tv-eyebrow chaos-tv-eyebrow--gold chaos-tv-eyebrow--flip">
          Leaderboard
        </span>
      </div>

      <motion.ol
        className="mx-auto flex w-full max-w-4xl flex-col gap-4"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
      >
        {mappedScoreboard.map((entry, i) => {
          const mascotPath = getMascotPath(entry.mascotId);
          const podium =
            i === 0
              ? 'chaos-tv-row--first'
              : i === 1
                ? 'chaos-tv-row--second'
                : i === 2
                  ? 'chaos-tv-row--third'
                  : '';
          const bignum =
            i === 0
              ? 'chaos-tv-bignum chaos-tv-bignum--gold'
              : i === 3 || i === 4
                ? 'chaos-tv-bignum chaos-tv-bignum--cyan'
                : 'chaos-tv-bignum';
          return (
            <motion.li
              key={entry.id}
              variants={{
                hidden: { opacity: 0, x: i % 2 === 0 ? -30 : 30, rotate: -3 },
                visible: { opacity: 1, x: 0, rotate: i % 2 === 0 ? -0.6 : 0.6 },
              }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className={`chaos-tv-row ${podium}`}
            >
              <span className="flex items-center gap-4 min-w-0">
                <span className={bignum} style={{ width: 56, height: 56, fontSize: 24 }}>
                  {entry.rank}
                </span>
                {mascotPath && (
                  <img
                    src={mascotPath}
                    alt=""
                    className="chaos-tv-chip-mascot"
                    draggable={false}
                  />
                )}
                <span className="truncate text-2xl md:text-3xl font-black tracking-tight">
                  {entry.teamName}
                </span>
              </span>
              <span className="text-3xl md:text-4xl font-black tabular-nums">
                {entry.score.toLocaleString()}
              </span>
            </motion.li>
          );
        })}
      </motion.ol>
    </section>
  );
}

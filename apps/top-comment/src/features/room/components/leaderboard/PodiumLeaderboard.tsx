import { motion } from 'framer-motion';
import { getMascotPath } from '../../../../shared/mascots';
import { SplitFlap } from '../../../tv/components/SplitFlap';
import { Confetti } from '../../../tv/components/Confetti';
import { useReducedMotion } from '../../../../shared/hooks/useReducedMotion';

export interface PodiumEntry {
  id: string;
  displayName: string;
  score: number;
  rank: number;
  mascotId?: number;
}

interface PodiumLeaderboardProps {
  /** Full ordered leaderboard, rank 1 first. */
  entries: PodiumEntry[];
  /** Socialite ID of the local user for highlighting + confetti trigger. */
  currentSocialiteId?: string;
  /** Play a short confetti burst when the current user is top 3. */
  celebrateLocal?: boolean;
}

/**
 * Mobile podium ceremony + remainder list (P1-30, sibling of TVPodiumCeremony).
 * Top 3 get a compact 3-up podium with mascots and SplitFlap score tickers,
 * the rest fall into a row-by-row revealed list.
 */
export function PodiumLeaderboard({
  entries,
  currentSocialiteId,
  celebrateLocal = true,
}: PodiumLeaderboardProps) {
  const reduceMotion = useReducedMotion();
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  const localEntry = currentSocialiteId ? entries.find((e) => e.id === currentSocialiteId) : null;
  const localIsTopThree = localEntry != null && localEntry.rank <= 3;

  const podiumOrder = [
    podium.find((e) => e.rank === 2),
    podium.find((e) => e.rank === 1),
    podium.find((e) => e.rank === 3),
  ].filter((e): e is PodiumEntry => e != null);

  const podiumHeights: Record<number, number> = {
    1: 112,
    2: 84,
    3: 64,
  };

  return (
    <div className="relative space-y-5">
      {celebrateLocal && localIsTopThree && !reduceMotion && (
        <Confetti active count={50} durationSec={2.8} />
      )}

      {podium.length > 0 && (
        <div className="relative">
          <div className="flex items-end justify-center gap-3">
            {podiumOrder.map((entry) => {
              const mascotPath = getMascotPath(entry.mascotId);
              const isMe = entry.id === currentSocialiteId;
              const height = podiumHeights[entry.rank] ?? 64;
              const tint = entry.rank === 1 ? '251, 191, 36' : entry.rank === 2 ? '192, 192, 204' : '217, 119, 6';

              return (
                <motion.div
                  key={entry.id}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: entry.rank === 1 ? 0.25 : entry.rank === 2 ? 0.4 : 0.55,
                    type: 'spring',
                    stiffness: 280,
                    damping: 22,
                  }}
                  className="flex flex-col items-center gap-2 flex-1 max-w-[110px]"
                >
                  <motion.div
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                    className="relative rounded-full overflow-hidden border-2"
                    style={{
                      width: 72,
                      height: 72,
                      borderColor: `rgb(${tint})`,
                      background: 'rgba(10, 1, 24, 0.7)',
                      boxShadow: `0 0 0 3px rgba(${tint}, 0.3), 0 10px 24px rgba(0,0,0,0.45)`,
                    }}
                  >
                    {mascotPath ? (
                      <img src={mascotPath} alt="" className="w-full h-full object-contain" draggable={false} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white">
                        {entry.displayName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center w-7 h-7 rounded-full text-sm font-black border-2"
                      style={{
                        background: `rgb(${tint})`,
                        color: '#0a0118',
                        borderColor: '#0a0118',
                      }}
                    >
                      {entry.rank}
                    </div>
                  </motion.div>
                  <p
                    className={`text-xs font-black uppercase tracking-wider text-center truncate w-full ${
                      isMe ? 'text-cyan-300' : 'text-white'
                    }`}
                    title={entry.displayName}
                  >
                    {entry.displayName}
                  </p>
                  <motion.div
                    initial={{ y: height + 20 }}
                    animate={{ y: 0 }}
                    transition={{
                      delay: entry.rank === 1 ? 0.35 : entry.rank === 2 ? 0.5 : 0.65,
                      type: 'spring',
                      stiffness: 220,
                      damping: 24,
                    }}
                    className="w-full rounded-t-xl relative flex flex-col items-center justify-start pt-2 text-white"
                    style={{
                      height,
                      background: `linear-gradient(180deg, rgb(${tint}) 0%, rgba(${tint}, 0.55) 100%)`,
                      border: '2px solid rgba(0,0,0,0.85)',
                      borderBottom: 'none',
                      boxShadow: '0 10px 0 rgba(0,0,0,0.6)',
                    }}
                  >
                    <SplitFlap
                      value={String(entry.score)}
                      length={Math.max(3, String(entry.score).length)}
                      flipMs={70}
                      staggerMs={40}
                      charWidthEm={0.6}
                      style={{ fontSize: '16px', color: '#0a0118' }}
                    />
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div className="space-y-2 pt-2">
          {rest.map((entry, idx) => {
            const mascotPath = getMascotPath(entry.mascotId);
            const isMe = entry.id === currentSocialiteId;
            return (
              <motion.div
                key={entry.id}
                initial={{ x: -16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.75 + idx * 0.06, type: 'spring', stiffness: 340, damping: 28 }}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                  isMe ? 'bg-cyan-400/15 border border-cyan-400/45' : 'bg-white/5 border border-white/10'
                }`}
                data-is-current={isMe ? 'true' : 'false'}
              >
                <span
                  className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-black"
                  style={{
                    background: isMe ? '#22d3ee' : 'rgba(255,255,255,0.08)',
                    color: isMe ? '#0a0118' : '#fff',
                  }}
                >
                  {entry.rank}
                </span>
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden"
                  style={{
                    background: 'rgba(10, 1, 24, 0.6)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  {mascotPath ? (
                    <img src={mascotPath} alt="" className="w-full h-full object-contain" draggable={false} />
                  ) : (
                    <span className="text-xs font-black text-white">
                      {entry.displayName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <span
                  className={`flex-1 text-sm font-black truncate ${isMe ? 'text-cyan-200' : 'text-white'}`}
                  title={entry.displayName}
                >
                  {entry.displayName}
                </span>
                <SplitFlap
                  value={String(entry.score)}
                  length={Math.max(3, String(entry.score).length)}
                  flipMs={55}
                  staggerMs={25}
                  charWidthEm={0.55}
                  style={{ fontSize: '13px' }}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PodiumLeaderboard;

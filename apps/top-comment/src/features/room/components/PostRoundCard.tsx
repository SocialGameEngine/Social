import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../shared/providers/AuthContext';
import {
  useCurrentSocialite,
  useSociale,
} from '../../../features/sociale/hooks';
import { supabase } from '../../../supabase/client';
import type { Sociale } from '../../../domain/types/sociale.types';

interface PostRoundCardProps {
  sociale: Sociale;
  onNext?: () => void;
  onAlwaysAdvance?: () => void;
}

interface SessionStats {
  roundDelta: number;
  rankDelta: number;
  currentRank: number;
  streak: number;
  roundScore: number;
  totalScore: number;
}

interface MembershipStats {
  allTimeScore: number;
  tier: string;
  venueRank: number;
  gamesPlayed: number;
}

interface PostRoundCardData {
  sessionStats: SessionStats;
  membershipStats?: MembershipStats;
  hasMembership: boolean;
  socialiteName: string;
}

interface SessionStatRow {
  socialite_id: string;
  streak_max: number;
  round_scores: number[];
}

function computeRank(scores: Record<string, number>, socialiteId: string): number {
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const idx = sorted.findIndex(([id]) => id === socialiteId);
  return idx === -1 ? 0 : idx + 1;
}

export function PostRoundCard({ sociale, onNext, onAlwaysAdvance }: PostRoundCardProps) {
  const { user } = useAuth();
  const [cardData, setCardData] = useState<PostRoundCardData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { data: currentSocialite } = useCurrentSocialite(sociale.id, user?.id);
  const { data: socialeData } = useSociale(sociale.id);

  const hasMembership = currentSocialite?.membershipId != null;

  useEffect(() => {
    if (!sociale.id || !currentSocialite) return;

    const fetchStats = async () => {
      try {
        // Fetch all session stats for this sociale to compute rank
        const { data: allStats } = await supabase
          .from('sociale_session_stats')
          .select('socialite_id, streak_max, round_scores')
          .eq('sociale_id', sociale.id);

        const rows: SessionStatRow[] = (allStats ?? []).map((row) => ({
          socialite_id: row.socialite_id as string,
          streak_max: (row.streak_max as number) ?? 0,
          round_scores: Array.isArray(row.round_scores) ? (row.round_scores as number[]) : [],
        }));

        // Compute total scores per socialite
        const currentTotals: Record<string, number> = {};
        for (const row of rows) {
          currentTotals[row.socialite_id] = row.round_scores.reduce((s, v) => s + v, 0);
        }

        // Compute totals before the last round (drop the last element)
        const previousTotals: Record<string, number> = {};
        for (const row of rows) {
          const scoresWithoutLast = row.round_scores.slice(0, -1);
          previousTotals[row.socialite_id] = scoresWithoutLast.reduce((s, v) => s + v, 0);
        }

        const currentRank = computeRank(currentTotals, currentSocialite.id);
        const previousRank = computeRank(previousTotals, currentSocialite.id);
        const rankDelta = previousRank - currentRank; // positive = moved up

        const myRow = rows.find((r) => r.socialite_id === currentSocialite.id);
        const myRoundScores = myRow?.round_scores ?? [];
        const totalScore = currentTotals[currentSocialite.id] ?? 0;
        const roundScore = myRoundScores.length > 0 ? myRoundScores[myRoundScores.length - 1] : 0;
        const streak = myRow?.streak_max ?? 0;

        // Membership stats
        let membershipStats: MembershipStats | undefined;
        if (hasMembership && currentSocialite.membershipId) {
          const { data: membershipData } = await supabase
            .from('room_membership_stats')
            .select('total_score, tier, games_played')
            .eq('membership_id', currentSocialite.membershipId)
            .single();

          if (membershipData) {
            // Venue rank: count memberships with higher total_score
            const { count } = await supabase
              .from('room_membership_stats')
              .select('*', { count: 'exact', head: true })
              .gt('total_score', membershipData.total_score as number);

            membershipStats = {
              allTimeScore: (membershipData.total_score as number) ?? 0,
              tier: (membershipData.tier as string) ?? 'Bronze',
              venueRank: (count ?? 0) + 1,
              gamesPlayed: (membershipData.games_played as number) ?? 0,
            };
          }
        }

        setCardData({
          sessionStats: { roundDelta: roundScore, rankDelta, currentRank, streak, roundScore, totalScore },
          membershipStats,
          hasMembership,
          socialiteName: currentSocialite.displayName || 'Anonymous',
        });
        setIsVisible(true);

        const timer = setTimeout(() => {
          onAlwaysAdvance?.();
        }, 8000);
        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Failed to fetch post-round stats:', error);
      }
    };

    fetchStats();
  }, [sociale.id, currentSocialite, hasMembership, onAlwaysAdvance]);

  if (!isVisible || !cardData) return null;

  const { sessionStats, membershipStats } = cardData;
  const rankDeltaLabel =
    sessionStats.rankDelta > 0
      ? `+${sessionStats.rankDelta}`
      : sessionStats.rankDelta < 0
      ? `${sessionStats.rankDelta}`
      : '—';
  const rankDeltaColor =
    sessionStats.rankDelta > 0
      ? 'text-green-400'
      : sessionStats.rankDelta < 0
      ? 'text-red-400'
      : 'text-white';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, duration: 0.3 }}
          className="relative max-w-md w-full mx-4"
        >
          <div className="bg-black/90 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-teal-600/20" />

            <div className="relative z-10 p-6">
              {/* Header */}
              <div className="text-center mb-6">
                <motion.h2
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl font-bold text-white mb-2"
                >
                  Round Complete!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-white/80 text-sm"
                >
                  {cardData.socialiteName}'s Performance
                </motion.p>
              </div>

              {/* Session Stats */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4"
              >
                <h3 className="text-sm font-semibold text-white/90 mb-3">This Round</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">
                      +{sessionStats.roundDelta}
                    </div>
                    <div className="text-xs text-white/60">Points</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${rankDeltaColor}`}>
                      {rankDeltaLabel}
                    </div>
                    <div className="text-xs text-white/60">Rank</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      🔥 {sessionStats.streak}
                    </div>
                    <div className="text-xs text-white/60">Streak</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Round Score</span>
                    <span className="text-white font-semibold">{sessionStats.roundScore}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Total Score</span>
                    <span className="text-white font-semibold">{sessionStats.totalScore}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Current Rank</span>
                    <span className="text-white font-semibold">#{sessionStats.currentRank}</span>
                  </div>
                </div>
              </motion.div>

              {/* Membership Stats */}
              {cardData.hasMembership && membershipStats && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-4 mb-4"
                >
                  <h3 className="text-sm font-semibold text-white/90 mb-3">All-Time Stats</h3>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {membershipStats.allTimeScore.toLocaleString()}
                      </div>
                      <div className="text-xs text-white/60">Total Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {membershipStats.tier}
                      </div>
                      <div className="text-xs text-white/60">Tier</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Venue Rank</span>
                      <span className="text-white font-semibold">#{membershipStats.venueRank}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Games Played</span>
                      <span className="text-white font-semibold">{membershipStats.gamesPlayed}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Auto-advance progress bar */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.5, duration: 8, ease: 'linear' }}
                className="h-1 bg-white/20 rounded-full mb-4"
              />

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex gap-3 justify-center"
              >
                <button
                  onClick={onNext}
                  className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-white/90 transition-colors"
                >
                  Next Round
                </button>
                <button
                  onClick={onAlwaysAdvance}
                  className="px-6 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors"
                >
                  Always Advance
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

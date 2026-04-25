// Compact card showing the current season name, days remaining,
// and the local player's tier + rank.

import { TierBadge } from './TierBadge';
import { getDaysRemaining, formatSeasonRange, getSeasonProgress } from '../../../domain/seasons/seasonalLeagues';
import type { Season, SeasonStanding } from '../../../domain/seasons/seasonalLeagues';

interface SeasonStandingsCardProps {
  season: Season;
  standing: SeasonStanding | null;
  onViewLeague?: () => void;
}

export function SeasonStandingsCard({ season, standing, onViewLeague }: SeasonStandingsCardProps) {
  const daysLeft = getDaysRemaining(season);
  const progress = getSeasonProgress(season);
  const dateRange = formatSeasonRange(season);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      {/* Season header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-white/50">Season</p>
          <p className="text-base font-black text-white">{season.name}</p>
          <p className="text-xs text-white/40">{dateRange}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-white">{daysLeft}</p>
          <p className="text-xs text-white/50">days left</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-700"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Player standing */}
      {standing ? (
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <TierBadge tier={standing.tier} size="md" />
            <span className="text-sm text-white/70">
              {standing.gamesPlayed} game{standing.gamesPlayed !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-white">
              {standing.totalScore.toLocaleString()}
            </span>
            <span className="text-xs text-white/50 ml-1">pts</span>
            {standing.finalRank && (
              <p className="text-xs text-white/40">Rank #{standing.finalRank}</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-white/40 text-center">Play a game to appear on the leaderboard</p>
      )}

      {onViewLeague && (
        <button
          type="button"
          onClick={onViewLeague}
          className="w-full text-center text-xs font-bold uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors py-1"
        >
          View Full Standings →
        </button>
      )}
    </div>
  );
}

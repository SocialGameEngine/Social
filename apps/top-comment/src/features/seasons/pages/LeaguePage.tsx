// Full seasonal league standings page.
// Shows the current season's leaderboard with rank, tier, display name, and score.
// Wire into your router at /league or render as a modal/sheet from RoomPage.

import { TierBadge } from '../components/TierBadge';
import { SeasonStandingsCard } from '../components/SeasonStandingsCard';
import { useCurrentSeason, useSeasonLeaderboard, useMySeasonStanding } from '../hooks/useCurrentSeason';
import { getRankChange } from '../../../domain/seasons/seasonalLeagues';

interface LeaguePageProps {
  membershipId?: string | null;
}

export function LeaguePage({ membershipId }: LeaguePageProps) {
  const { data: season, isLoading: seasonLoading } = useCurrentSeason();
  const { data: entries = [], isLoading: boardLoading } = useSeasonLeaderboard(season?.id);
  const { data: myStanding } = useMySeasonStanding(membershipId);

  if (seasonLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white/50 text-sm">Loading season…</div>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <div className="text-4xl">🏅</div>
        <p className="text-white font-bold">No active season</p>
        <p className="text-sm text-white/50">A new season starts at the beginning of each month.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* Season overview card */}
      <SeasonStandingsCard season={season} standing={myStanding ?? null} />

      {/* Leaderboard */}
      <div className="space-y-1">
        <p className="text-xs font-black uppercase tracking-widest text-white/40 px-1">
          Standings
        </p>

        {boardLoading && (
          <div className="text-center py-8 text-white/40 text-sm">Loading…</div>
        )}

        {!boardLoading && entries.length === 0 && (
          <div className="text-center py-8 text-white/40 text-sm">
            No players yet — be the first!
          </div>
        )}

        {entries.map(({ standing, displayName }, index) => {
          const rank = index + 1;
          const isMe = membershipId && standing.membershipId === membershipId;
          const rankChange = getRankChange(rank, standing.finalRank);

          return (
            <div
              key={standing.id}
              className={`
                flex items-center gap-3 rounded-xl px-4 py-3 transition-colors
                ${isMe ? 'bg-white/10 border border-white/20' : 'bg-white/5'}
              `}
            >
              {/* Rank */}
              <span className="w-7 text-center text-sm font-black text-white/60">
                {rank}
              </span>

              {/* Rank change arrow */}
              <span className="w-4 text-center text-xs">
                {rankChange.direction === 'up' && (
                  <span className="text-green-400">▲</span>
                )}
                {rankChange.direction === 'down' && (
                  <span className="text-red-400">▼</span>
                )}
                {rankChange.direction === 'same' && (
                  <span className="text-white/30">—</span>
                )}
                {rankChange.direction === 'new' && (
                  <span className="text-cyan-400">✦</span>
                )}
              </span>

              {/* Name + tier */}
              <div className="flex-1 min-w-0">
                <span className="truncate text-sm font-semibold text-white">
                  {displayName}
                  {isMe && (
                    <span className="ml-2 text-[10px] text-cyan-400 font-black uppercase tracking-widest">
                      You
                    </span>
                  )}
                </span>
                <div className="mt-0.5">
                  <TierBadge tier={standing.tier} size="sm" />
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <span className="text-base font-black text-white tabular-nums">
                  {standing.totalScore.toLocaleString()}
                </span>
                <p className="text-[10px] text-white/40">
                  {standing.gamesPlayed}G
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

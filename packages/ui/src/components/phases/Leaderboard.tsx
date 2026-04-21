import { getMascotPath } from "../../shared/mascots";

export interface LeaderboardTeam {
  id: string;
  rank: number;
  teamName: string;
  score: number;
  mascotId?: number;
}

type LeaderboardVariant = "team" | "host" | "presenter";

interface LeaderboardProps {
  leaderboard: LeaderboardTeam[];
  highlightTeamId?: string;
  maxItems?: number;
  variant?: LeaderboardVariant;
  className?: string;
  itemClassName?: string;
  isDark?: boolean;
}

export function Leaderboard({
  leaderboard,
  highlightTeamId,
  maxItems,
  variant = "team",
  className = "",
  itemClassName = "",
  isDark = false,
}: LeaderboardProps) {
  const displayLeaderboard = maxItems
    ? leaderboard.slice(0, maxItems)
    : leaderboard;

  const getRankGlow = (rank: number) => {
    if (!isDark) return '';
    return rank <= 3 ? 'shadow-lg shadow-cyan-400/30' : '';
  };

  const getRankBackground = (rank: number, isDark: boolean) => {
    if (!isDark) return 'bg-slate-100 text-slate-900 ring-slate-300';
    // Top 3 get special gradient treatment
    if (rank === 1) return 'bg-gradient-to-br from-cyan-400 to-cyan-500 text-white ring-cyan-300';
    if (rank === 2) return 'bg-gradient-to-br from-cyan-500 to-cyan-600 text-white ring-cyan-300';
    if (rank === 3) return 'bg-gradient-to-br from-cyan-600 to-cyan-700 text-white ring-cyan-300';
    return 'bg-cyan-600 text-white ring-cyan-400';
  };


  if (variant === "presenter") {
    return (
      <ul className={`space-y-2 sm:space-y-4 text-base sm:text-2xl font-semibold ${className}`}>
        {displayLeaderboard.map((team) => {
          const mascotPath = team.mascotId ? getMascotPath(team.mascotId) : null;

          return (
            <li
              key={team.id}
              className={`flex items-center gap-2 sm:gap-4 ${itemClassName || ""}`}
            >
              {/* Rank badge */}
              <div className={`flex h-8 w-8 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full text-sm sm:text-lg font-bold ring-2 transition-all duration-200 ${getRankBackground(team.rank, isDark)} ${getRankGlow(team.rank)}`}>
                {team.rank}
              </div>

              {/* Mascot avatar */}
              {mascotPath ? (
                <div className={`flex h-10 w-10 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center rounded-full p-1 sm:p-2 ring-2 transition-all duration-200 ${
                  !isDark
                    ? 'bg-slate-50 ring-slate-200'
                    : 'bg-slate-700 ring-cyan-400 shadow-lg shadow-cyan-400/20'
                }`}>
                  <img
                    src={mascotPath}
                    alt=""
                    className="h-full w-full object-contain"
                    aria-hidden="true"
                    onError={(e) => {
                      console.error("Failed to load mascot:", mascotPath, "for team:", team.teamName);
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className={`flex h-10 w-10 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center rounded-full ring-2 transition-all duration-200 ${
                  !isDark
                    ? 'bg-slate-50 ring-slate-200'
                    : 'bg-slate-700 ring-cyan-400 shadow-lg shadow-cyan-400/20'
                }`}>
                  <span className={`text-lg sm:text-2xl font-bold ${
                    !isDark ? 'text-slate-400' : 'text-cyan-200'
                  }`}>
                    {team.teamName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Team name */}
              <div className="flex-1 min-w-0">
                <p className={`truncate transition-all duration-200 ${
                  !isDark ? 'text-slate-900' : 'text-white drop-shadow-sm'
                }`} title={team.teamName}>{team.teamName}</p>
              </div>

              {/* Points */}
              <div className="flex-shrink-0 text-right min-w-0 ml-1 sm:ml-2">
                <p className={`text-sm sm:text-xl font-bold whitespace-nowrap transition-all duration-200 ${
                  !isDark ? 'text-cyan-400' : 'text-cyan-300 drop-shadow-sm'
                }`}>{team.score}</p>
                <p className={`text-sm transition-all duration-200 ${
                  !isDark ? 'text-cyan-200' : 'text-slate-400'
                }`}>pts</p>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  if (variant === "host") {
    return (
      <ol className={`space-y-2.5 ${className}`}>
        {displayLeaderboard.map((team) => {
          const mascotPath = team.mascotId ? getMascotPath(team.mascotId) : null;
          
          return (
            <li
              key={team.id}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${
                !isDark ? 'bg-slate-100' : 'bg-slate-700'
              } ${itemClassName}`}
            >
              {/* Rank badge */}
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                !isDark
                  ? 'bg-slate-300 text-slate-700'
                  : 'bg-slate-600 text-slate-200'
              }`}>
                {team.rank}
              </div>

              {/* Mascot avatar */}
              {mascotPath ? (
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full p-1 shadow-sm ring-2 ${
                  !isDark
                    ? 'bg-white ring-white/50'
                    : 'bg-slate-600 ring-slate-500'
                }`}>
                  <img
                    src={mascotPath}
                    alt=""
                    className="h-full w-full object-contain"
                    aria-hidden="true"
                    onError={(e) => {
                      console.error("Failed to load mascot:", mascotPath, "for team:", team.teamName);
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                  !isDark ? 'bg-slate-200' : 'bg-slate-500'
                }`}>
                  <span className={`text-lg font-bold ${
                    !isDark ? 'text-slate-400' : 'text-slate-300'
                  }`}>
                    {team.teamName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Team name */}
              <div className="flex-1 min-w-0">
                <p className={`truncate font-semibold ${
                  !isDark ? 'text-slate-900' : 'text-white'
                }`} title={team.teamName}>
                  {team.teamName}
                </p>
              </div>

              {/* Points */}
              <div className="flex-shrink-0 text-right min-w-0 ml-2">
                <p className={`text-sm font-bold ${
                  !isDark ? 'text-slate-700' : 'text-slate-200'
                }`}>{team.score}</p>
                <p className={`text-xs ${
                  !isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>pts</p>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  // Team variant (default) - Redesigned with mascot as prominent avatar
  return (
    <ul className={`space-y-2.5 ${className}`}>
      {displayLeaderboard.map((team) => {
        const mascotPath = team.mascotId ? getMascotPath(team.mascotId) : null;
        const isHighlighted = team.id === highlightTeamId;
        
        return (
          <li
            key={team.id}
            data-team-id={team.id}
            className={`flex items-center gap-2 sm:gap-3 rounded-2xl px-2 sm:px-3 py-2 sm:py-2.5 shadow-lg border transition ${
              isHighlighted
                ? "bg-brand-light ring-2 ring-brand-primary border-brand-primary/30"
                : (!isDark ? "bg-white border-slate-200 shadow-slate-300/40" : "bg-slate-800 border-slate-600 shadow-slate-500/20")
            } ${itemClassName}`}
          >
            {/* Rank badge */}
            <div
              className={`flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                isHighlighted
                  ? "bg-brand-primary text-white"
                  : (!isDark
                      ? "bg-slate-300 text-slate-700"
                      : "bg-slate-600 text-slate-200")
              }`}
            >
              {team.rank}
            </div>

            {/* Mascot avatar */}
            {mascotPath ? (
              <div className={`flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full p-1 shadow-sm ring-2 ${
                !isDark
                  ? 'bg-white ring-white/50'
                  : 'bg-slate-600 ring-slate-500'
              }`}>
                <img
                  src={mascotPath}
                  alt=""
                  className="h-full w-full object-contain"
                  aria-hidden="true"
                  onError={(e) => {
                    console.error("Failed to load mascot:", mascotPath, "for team:", team.teamName);
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className={`flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full ${
                !isDark ? 'bg-slate-200' : 'bg-slate-500'
              }`}>
                <span className={`text-base sm:text-lg font-bold ${
                  !isDark ? 'text-slate-400' : 'text-slate-300'
                }`}>
                  {team.teamName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Team name */}
            <div className="flex-1 min-w-0">
              <p
                className={`truncate font-semibold ${
                  isHighlighted
                    ? "text-brand-primary"
                    : (!isDark ? "text-slate-800" : "text-slate-200")
                }`}
                title={team.teamName}
              >
                {team.teamName}
              </p>
            </div>

            {/* Points */}
            <div className="flex-shrink-0 text-right min-w-0 ml-1 sm:ml-2">
              <p
                className={`text-xs sm:text-sm font-bold whitespace-nowrap ${
                  isHighlighted
                    ? "text-brand-primary"
                    : (!isDark ? "text-slate-800" : "text-cyan-300")
                }`}
              >
                {team.score}
              </p>
              <p className={`text-xs ${
                !isDark ? 'text-slate-600' : 'text-slate-300'
              }`}>pts</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}


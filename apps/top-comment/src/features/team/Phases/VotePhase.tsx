import { Card, Timer, ProgressBar } from "@social/ui";
import { getMascotById } from "../../../shared/mascots";
import type { Session, RoundGroup, Answer, Vote, Team } from "../../../shared/types";
import { statusHeadline } from "../../../shared/constants";
import { useTheme } from "../../../shared/providers/ThemeProvider";

interface VotePhaseProps {
  session: Session;
  activeGroup: RoundGroup | null;
  roundGroups: RoundGroup[];
  activeGroupIndex: number;
  totalGroups: number;
  activeGroupAnswers: Answer[];
  voteCounts: Map<string, number>;
  myActiveVote: Vote | null;
  activeGroupWinnerIds: Set<string>;
  handleVote: (answerId: string) => void;
  isSubmittingVote: boolean;
  voteSummaryActive: boolean;
  teams: Team[];
  totalSeconds: number;
  currentTeam: Team | null;
  isVotingOnOwnGroup: boolean;
}

function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diffMs = now - time;
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  return `${Math.floor(diffSeconds / 3600)}h ago`;
}

export function VotePhase({
  session,
  activeGroup,
  roundGroups,
  activeGroupIndex,
  totalGroups,
  activeGroupAnswers,
  voteCounts: _voteCounts,
  myActiveVote,
  activeGroupWinnerIds: _activeGroupWinnerIds,
  handleVote,
  isSubmittingVote,
  voteSummaryActive,
  teams,
  totalSeconds,
  isVotingOnOwnGroup,
}: VotePhaseProps) {
  const { isDark } = useTheme();
  const promptValue =
    activeGroup?.prompt ??
    roundGroups[activeGroupIndex]?.prompt ??
    null;
  
  const groupLabel = totalGroups
    ? `Group ${activeGroupIndex + 1} of ${totalGroups}`
    : "No groups";

  return (
    <Card className={`space-y-3 p-3 sm:space-y-5 sm:p-5 ${isDark ? 'relative' : ''}`} isDark={isDark}>
      {isDark && (
        <div className="absolute inset-0 rounded-3xl bg-gradient-radial from-purple-500/10 via-cyan-500/15 to-transparent pointer-events-none" />
      )}
      <div className="relative space-y-1.5 text-center sm:space-y-2">
        <h2 className={`text-xl font-bold sm:text-2xl ${!isDark ? 'text-slate-900' : 'text-cyan-400 neon-glow-cyan'}`}>
          {statusHeadline[session.status]}
        </h2>
        <p className={`text-[11px] font-semibold uppercase tracking-wide sm:text-xs ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {groupLabel}
        </p>
        {promptValue ? (
          <p className={`text-base font-black sm:text-lg ${!isDark ? 'text-slate-800' : 'text-pink-300 neon-glow-pink'}`}>
            {promptValue}
          </p>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-cyan-300">
              {session?.paused ? "Game Paused" : "Loading..."}
            </span>
          </div>
        )}
        <p className={`text-xs font-medium sm:text-sm ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          {isVotingOnOwnGroup
            ? "Viewing your group's answers — you cannot vote in your own group."
            : "Tap your favorite answer — earn points for voting! 🎯"}
        </p>
      </div>
      <Timer endTime={session.endsAt} label="Voting ends" size="md" isDark={isDark} paused={session.paused} />
      <div className={`rounded-full p-0.5 shadow-inner ${!isDark ? 'bg-white/80 shadow-slate-300' : 'bg-slate-700/80 shadow-slate-600'}`}>
        <ProgressBar endTime={session.endsAt} totalSeconds={totalSeconds} isDark={isDark} paused={session.paused} />
      </div>
      <div className="space-y-3">
        {activeGroupAnswers.length ? (
          activeGroupAnswers.map((answer) => {
            const isSelected = myActiveVote?.answerId === answer.id;
            const authorTeam = teams.find((team) => team.id === answer.teamId);
            const authorName = authorTeam?.teamName ?? "Unknown team";
            const mascot = authorTeam?.mascotId ? getMascotById(authorTeam.mascotId) : null;
            const timeAgo = formatTimeAgo(answer.createdAt);
            const voteCount = _voteCounts.get(answer.id) || 0;
            
            // Check if this answer has the most votes in the group
            const isLeading = activeGroupAnswers.some(a => {
              const otherCount = _voteCounts.get(a.id) || 0;
              return otherCount > voteCount;
            }) === false && voteCount >= 3;

            return (
              <article
                key={answer.id}
                className={`flex gap-3 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-lg border ${
                  !isDark ? 'bg-slate-100 text-slate-900 border-slate-200 shadow-slate-300/40' : 'bg-cyan-900/50 text-white border-cyan-400/60 shadow-cyan-500/25'
                } ${
                  isSelected
                    ? `${!isDark ? 'ring-4 ring-brand-primary bg-brand-light/50' : 'ring-4 ring-cyan-400 bg-cyan-400/20 card-glow-selected'} shadow-lg`
                    : (isSubmittingVote || voteSummaryActive || isVotingOnOwnGroup)
                      ? ''
                      : `${!isDark ? `hover:bg-slate-50 border-slate-300/60` : `card-hover-glow hover:bg-cyan-800/40 border-cyan-300/60`}`
                } ${isSubmittingVote || voteSummaryActive || isVotingOnOwnGroup ? "opacity-70 cursor-not-allowed" : ""}`}
                onClick={() => !isSubmittingVote && !voteSummaryActive && !isVotingOnOwnGroup && handleVote(answer.id)}
              >
                {/* Avatar/Mascot */}
                <div className="flex-shrink-0">
                  {mascot ? (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg border-2 ${!isDark ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-500'}`}>
                      <img
                        src={mascot.path}
                        alt={mascot.name}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.textContent = authorName.charAt(0).toUpperCase();
                            parent.className = `w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 ${!isDark ? 'bg-white border-slate-300 text-slate-600' : 'bg-slate-700 border-slate-500 text-slate-300'}`;
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 ${!isDark ? 'bg-white border-slate-300 text-slate-600' : 'bg-slate-700 border-slate-500 text-slate-300'}`}>
                      {authorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Team name and timestamp */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-semibold text-sm ${!isDark ? 'text-slate-900' : 'text-white'}`}>{authorName}</span>
                    <span className={`text-xs ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>•</span>
                    <span className={`text-xs ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>{timeAgo}</span>
                  </div>

                  {/* Answer text */}
                  <p className={`leading-relaxed ${!isDark ? 'text-slate-800' : 'text-slate-200'}`}>{answer.text}</p>
                </div>

                {/* Vote button and count */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {isLeading && <span className="text-lg animate-pulse">🔥</span>}
                    <div className={`text-sm font-semibold ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                      {voteCount}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isSubmittingVote && !voteSummaryActive && !isVotingOnOwnGroup) {
                        handleVote(answer.id);
                      }
                    }}
                    disabled={isSubmittingVote || voteSummaryActive || isVotingOnOwnGroup}
                    className={`text-2xl transition-all duration-200 ${
                      isSelected
                        ? `${!isDark ? 'transform scale-110 text-red-500' : 'transform scale-110 text-red-500'} ${isDark ? 'neon-glow-magenta' : ''}`
                        : `${!isDark ? 'text-slate-400 hover:text-red-400' : 'text-slate-400 hover:text-red-400'} ${isDark ? 'hover:neon-glow-magenta' : ''}`
                    }`}
                    aria-label={isSelected ? "Remove vote" : "Vote for this answer"}
                  >
                    {isSelected ? "❤️" : "🤍"}
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <Card className="elevated-card text-center" isDark={isDark}>
            <p className={`text-sm font-medium ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
              Waiting for answers from this group...
            </p>
          </Card>
        )}
      </div>
      {voteSummaryActive ? (
        <p className={`text-center text-xs font-medium sm:text-sm ${!isDark ? 'text-brand-primary' : 'text-cyan-400 neon-glow-cyan'}`}>
          Votes locked in! Tally shown before the next prompt.
        </p>
      ) : isVotingOnOwnGroup ? (
        <p className={`text-center text-xs font-medium sm:text-sm ${!isDark ? 'text-slate-700' : 'text-slate-400'}`}>
          You cannot vote in your own group, but you can see all the answers.
        </p>
      ) : myActiveVote ? (
        <p className={`text-center text-xs font-medium sm:text-sm ${!isDark ? 'text-brand-primary' : 'text-cyan-400 neon-glow-cyan'}`}>
          Vote recorded — tap another answer to change it.
        </p>
      ) : null}
      
      {!isVotingOnOwnGroup && !voteSummaryActive && (
        <div className={`text-center text-xs space-y-1 ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          <p className="font-semibold">💰 Voter Rewards:</p>
          <p>+100 per vote • +200 if you pick the winner • +300 for voting in all groups</p>
        </div>
      )}
    </Card>
  );
}

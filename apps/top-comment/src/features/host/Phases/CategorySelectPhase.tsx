import { Card, SessionTimer } from "@social/ui";
import { CategoryGrid } from "../../../shared/components/CategoryGrid";
import { usePromptLibraries } from "../../../shared/hooks";
import type { Session, Team, RoundGroup } from "../../../shared/types";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { getTotalRemainingPrompts } from "../../../shared/utils/categoryGrid";

interface CategorySelectPhaseProps {
  session: Session;
  roundGroups: RoundGroup[];
  teams: Team[];
  sessionEndsAt?: string;
  categorySelectSecs: number;
  sessionPaused?: boolean;
}

export function CategorySelectPhase({
  session,
  roundGroups,
  teams,
  sessionEndsAt,
  categorySelectSecs,
  sessionPaused,
}: CategorySelectPhaseProps) {
  const { isDark } = useTheme();
  const { data: libraries, isLoading, error } = usePromptLibraries();

  if (isLoading) {
    return (
      <Card isDark={isDark}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          <p className={`ml-3 ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
            Loading...
          </p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card isDark={isDark}>
        <p className={`text-center text-red-500`}>
          Error loading libraries: {error.message}
        </p>
      </Card>
    );
  }

  if (!libraries || !session.categoryGrid) {
    return (
      <Card isDark={isDark}>
        <p className={`text-center ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
          No libraries available
        </p>
      </Card>
    );
  }

  const remainingPrompts = getTotalRemainingPrompts(session.categoryGrid);
  const selectedCount = roundGroups.filter(g => g.promptLibraryId).length;
  const totalGroups = roundGroups.length;

  return (
    <Card isDark={isDark}>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className={`text-2xl font-bold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
            Category Selection
          </h2>
          <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
            Players are choosing categories for Round {session.roundIndex + 1}
          </p>
          <p className={`text-xs mt-1 ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>
            {selectedCount} of {totalGroups} groups selected • {remainingPrompts} prompts remaining
          </p>
        </div>

        {sessionEndsAt && !sessionPaused && (
          <SessionTimer
            endTime={sessionEndsAt}
            totalSeconds={categorySelectSecs}
            paused={sessionPaused}
          />
        )}

        <div className="space-y-3">
          {roundGroups.map((group, index) => {
            const selectingTeam = teams.find(t => t.id === group.selectingTeamId);
            const groupTeams = teams.filter(t => group.teamIds.includes(t.id));
            const selectedLibrary = libraries.find((l) => l.id === group.promptLibraryId);

            return (
              <div
                key={group.id}
                className={`rounded-xl p-4 ${!isDark ? 'bg-slate-50' : 'bg-slate-800'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-semibold ${!isDark ? 'text-slate-900' : 'text-cyan-100'}`}>
                    Group {index + 1}
                  </span>
                  {selectingTeam && !selectedLibrary && (
                    <span className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                      🎯 {selectingTeam.teamName} is choosing...
                    </span>
                  )}
                  {selectedLibrary && (
                    <span className="text-sm font-semibold text-brand-primary">
                      ✓ {selectedLibrary.emoji} {selectedLibrary.name}
                    </span>
                  )}
                </div>
                <div className={`text-xs ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>
                  Players: {groupTeams.map(t => t.teamName).join(", ")}
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>
            Available Categories
          </p>
          <CategoryGrid
            libraries={libraries}
            categoryGrid={session.categoryGrid}
            disabled={true}
            canSelect={false}
            highlightUsed={true}
            roundIndex={session.roundIndex}
            totalRounds={session.rounds?.length}
          />
        </div>
      </div>
    </Card>
  );
}

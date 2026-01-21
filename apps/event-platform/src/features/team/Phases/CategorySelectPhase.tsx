import { Card, SessionTimer } from "@social/ui";
import { CategoryGrid } from "../../../shared/components/CategoryGrid";
import { usePromptLibraries } from "../../../shared/hooks";
import type { Session, Team, RoundGroup } from "../../../shared/types";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { isSelectingTeam } from "../../../shared/utils/teamSelection";

interface CategorySelectPhaseProps {
  session: Session;
  currentTeam: Team | null;
  myGroup: RoundGroup | null;
  onSelectCategory: (categoryId: string, promptIndex: number) => void;
  isSubmitting: boolean;
}

export function CategorySelectPhase({
  session,
  currentTeam,
  myGroup,
  onSelectCategory,
  isSubmitting,
}: CategorySelectPhaseProps) {
  const { isDark } = useTheme();
  const { data: libraries, isLoading, error } = usePromptLibraries();

  console.log('CategorySelectPhase render:', { 
    libraries: libraries?.length, 
    isLoading, 
    error,
    categoryGrid: session.categoryGrid,
    currentTeam: !!currentTeam,
    myGroup: !!myGroup
  });

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

  if (!libraries || !session.categoryGrid || !currentTeam || !myGroup) {
    return (
      <Card isDark={isDark}>
        <p className={`text-center ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
          No libraries available
        </p>
      </Card>
    );
  }

  
  const isMyTurnToSelect = isSelectingTeam(currentTeam.id, myGroup.selectingTeamId);
  const hasSelected = !!myGroup.promptLibraryId;
  const selectedLibrary = libraries.find((l) => l.id === myGroup.promptLibraryId);

  return (
    <Card isDark={isDark}>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className={`text-2xl font-bold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
            {isMyTurnToSelect && !hasSelected ? "🎯 Choose a Category!" : "Category Selection"}
          </h2>
          <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
            Round {session.roundIndex + 1}
          </p>
          {session.endsAt && (
            <div className="mt-3">
              <SessionTimer
                endTime={session.endsAt}
                totalSeconds={session.settings.categorySelectSecs ?? 15}
                paused={session.paused ?? false}
              />
            </div>
          )}
        </div>

        {isMyTurnToSelect && !hasSelected ? (
          <div className="space-y-4">
            <p className={`text-center ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
              Pick a category for your group to answer!
            </p>
            <CategoryGrid
              libraries={libraries}
              categoryGrid={session.categoryGrid}
              selectedCategory={myGroup.promptLibraryId}
              onSelect={onSelectCategory}
              disabled={isSubmitting}
              canSelect={true}
              roundIndex={session.roundIndex}
              totalRounds={session.rounds?.length}
              highlightUsed={true}
            />
            {isSubmitting && (
              <p className="text-center text-sm text-brand-primary">
                Submitting selection...
              </p>
            )}
          </div>
        ) : hasSelected ? (
          <div className={`text-center rounded-xl p-6 ${!isDark ? 'bg-brand-light' : 'bg-cyan-900/30'}`}>
            <p className="text-lg font-semibold text-brand-primary mb-2">
              ✓ Category Selected!
            </p>
            <div className="text-4xl mb-2">{selectedLibrary?.emoji}</div>
            <p className={`text-lg font-bold ${!isDark ? 'text-slate-900' : 'text-cyan-100'}`}>
              {selectedLibrary?.name}
            </p>
            <p className={`text-sm mt-2 ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
              Get ready to answer!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className={`text-center ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
              Another team in your group is choosing...
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
        )}
      </div>
    </Card>
  );
}

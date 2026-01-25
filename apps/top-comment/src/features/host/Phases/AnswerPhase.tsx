import { Card, SessionTimer, GroupCard } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import type { RoundGroup } from "../../../shared/types";
import { usePromptLibrary } from "../../../shared/hooks/usePromptLibraries";

interface AnswerPhaseProps {
  sessionRoundIndex: number;
  totalGroups: number;
  roundGroups: RoundGroup[];
  teamLookup: Map<string, string>;
  sessionEndsAt: string | undefined;
  answerSecs: number;
  sessionPaused?: boolean;
  promptLibraryId?: string;
}

export function AnswerPhase({
  sessionRoundIndex,
  totalGroups,
  roundGroups,
  teamLookup,
  sessionEndsAt,
  answerSecs,
  sessionPaused = false,
  promptLibraryId,
}: AnswerPhaseProps) {
  const { isDark } = useTheme();
  
  // Get prompt library info
  const { data: promptLibrary } = usePromptLibrary(promptLibraryId || 'classic');
  return (
    <Card className="space-y-6" isDark={isDark}>
      <div className="flex flex-col gap-2">
        {promptLibrary && (
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 backdrop-blur-sm w-fit">
            <span className="text-lg">{promptLibrary.emoji}</span>
            <span className="text-xs font-semibold text-purple-200">{promptLibrary.name}</span>
          </div>
        )}
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
          Round {sessionRoundIndex + 1}
        </span>
        <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-slate-300'}`}>
          {totalGroups
            ? `${totalGroups} group${totalGroups === 1 ? "" : "s"} drafting responses`
            : "Grouping players..."}
        </p>
      </div>
      <SessionTimer
        endTime={sessionEndsAt}
        totalSeconds={answerSecs}
        paused={sessionPaused}
        label="Answer time"
        size="lg"
        isDark={isDark}
      />
      <div className="space-y-4">
        {roundGroups.length ? (
          roundGroups.map((group, index) => (
            <GroupCard
              key={group.id}
              group={group}
              index={index}
              teamLookup={teamLookup}
              variant="host"
              isDark={isDark}
            />
          ))
        ) : (
          <p className={`text-sm ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Gathering prompts for the first group...
          </p>
        )}
      </div>
    </Card>
  );
}

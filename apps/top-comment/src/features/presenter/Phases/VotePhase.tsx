import { AnswerCard, Card } from "@social/ui";
import { TTSControls } from "../../../components/TTSControls";
import type { Answer } from "../../../shared/types";
import type { VoiceProfile } from "../../../shared/services/voiceProfiles";
import { useTheme } from "../../../shared/providers/ThemeProvider";

interface VotePhaseProps {
  activeGroupAnswers: Answer[];
  voteCounts: Map<string, number>;
  activeGroupWinnerIds: Set<string>;
  voteSummaryActive: boolean;
  teamLookup: Map<string, string>;
  profile?: VoiceProfile;
}

export function VotePhase({
  activeGroupAnswers,
  voteCounts,
  activeGroupWinnerIds,
  voteSummaryActive,
  teamLookup,
  profile,
}: VotePhaseProps) {
  const { isDark } = useTheme();
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {activeGroupAnswers.length ? (
          activeGroupAnswers.map((answer, index) => {
            const voteTotal = voteCounts.get(answer.id) ?? 0;
            const isWinner = activeGroupWinnerIds.has(answer.id);
            const author = teamLookup.get(answer.teamId) ?? "Unknown";
            return (
              <div key={answer.id} className="group relative">
                <AnswerCard
                  answer={answer}
                  voteCount={voteTotal}
                  isWinner={isWinner}
                  authorName={author}
                  showSummary={voteSummaryActive}
                  variant="presenter"
                  isDark={isDark}
                />
                <div className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <TTSControls 
                    text={answer.text} 
                    label={`Answer ${index + 1}`} 
                    className="scale-75"
                    profile={profile}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <Card className="elevated-card col-span-full text-center" isDark={isDark}>
            <p className={`text-sm font-medium ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
              Waiting for answers from this group...
            </p>
          </Card>
        )}
      </div>
      {voteSummaryActive ? (
        <Card className="text-center" isDark={isDark}>
          <p className={`text-sm font-medium ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
            Votes locked in! Tally displayed before the next prompt.
          </p>
        </Card>
      ) : null}
    </div>
  );
}


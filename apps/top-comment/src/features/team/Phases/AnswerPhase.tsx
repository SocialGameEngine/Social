import { Button, SessionTimer } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { clsx } from "clsx";
import type { Session, RoundGroup, Answer } from "../../../shared/types";
import { usePromptLibrary } from "../../../shared/hooks/usePromptLibraries";

interface AnswerPhaseProps {
  session: Session;
  myGroup: RoundGroup | null;
  roundGroups: RoundGroup[];
  myAnswer: Answer | null;
  answerText: string;
  setAnswerText: (text: string) => void;
  handleSubmitAnswer: () => void;
  isSubmittingAnswer: boolean;
  totalSeconds: number;
}

export function AnswerPhase({
  session,
  myGroup,
  roundGroups,
  myAnswer,
  answerText,
  setAnswerText,
  handleSubmitAnswer,
  isSubmittingAnswer,
  totalSeconds,
}: AnswerPhaseProps) {
  const { isDark } = useTheme();
  const CHAR_LIMIT = 120;
  
  // Get current prompt from session data for real-time updates
  const currentPrompt = (() => {
    const currentRound = session.rounds?.[session.roundIndex || 0];
    if (currentRound && currentRound.groups && currentRound.groups.length > 0) {
      // Try to find the group that matches my team, or just use the first group's prompt
      if (myGroup) {
        // Find the group in current round that matches myGroup
        const groupInRound = currentRound.groups.find(g => g.id === myGroup.id);
        return groupInRound?.prompt || currentRound.groups[0]?.prompt || currentRound.prompt || null;
      } else {
        // No myGroup, use first available prompt
        return currentRound.groups[0]?.prompt || currentRound.prompt || null;
      }
    }
    
    // Fallback to myGroup or roundGroups
    return myGroup?.prompt || roundGroups[0]?.prompt || null;
  })();
  const characterCount = Math.min(answerText.length, CHAR_LIMIT);
  const limitReached = characterCount >= CHAR_LIMIT;
  
  // Get prompt library info
  const { data: promptLibrary } = usePromptLibrary(session.promptLibraryId || 'classic');

  return (
    <div className="space-y-3 p-3 sm:space-y- sm:p-5">
      <div className="hidden sm:block">
        <SessionTimer
          endTime={session.endsAt}
          totalSeconds={totalSeconds}
          paused={session.paused}
          label="Time left"
          size="sm"
          isDark={isDark}
        />
      </div>
      {promptLibrary && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 backdrop-blur-sm">
            <span className="text-lg">{promptLibrary.emoji}</span>
            <span className="text-xs font-semibold text-purple-200">{promptLibrary.name}</span>
          </div>
        </div>
      )}
      <p className="text-center text-xs font-semibold uppercase tracking-wide sm:text-sm text-cyan-200">
        Round {session.roundIndex + 1}
      </p>
      {myAnswer ? (
        <div className="space-y-3 sm:space-y-4">
          {/* Keep showing the prompt even after submission */}
          <div className="chaos-prompt-card px-3 py-3 text-center sm:px-4 sm:py-4 shadow-xl border-2 border-black/80">
            {currentPrompt ? (
              <p className="text-2xl font-black tracking-tight drop-shadow-lg sm:text-3xl text-black">
                {currentPrompt}
              </p>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-cyan-300">
                  {session?.paused ? "Game Paused" : "Loading..."}
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-3 text-center sm:space-y-4 relative">
            {/* Success indicator */}
            <div className="chaos-success-dot absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full sm:h-8 sm:w-8">
              <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <p className="chaos-success-text mb-2 text-xs font-bold sm:mb-3 sm:text-sm">
              ✓ Answer submitted!
            </p>
            <div className="chaos-answer-pill rounded-2xl p-3 sm:p-4 mb-2 sm:mb-3 border border-black/70">
              <p className="text-base sm:text-lg font-medium leading-relaxed">{myAnswer.text}</p>
            </div>
            {myAnswer.updatedAt && myAnswer.updatedAt !== myAnswer.createdAt && (
              <p className="chaos-success-muted text-[10px] opacity-80 sm:text-xs">
                Updated {new Date(myAnswer.updatedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className="w-4 h-0.5 sm:w-6 mr-2 sm:mr-3 bg-cyan-300"></div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-cyan-200">
                Update Your Answer
              </p>
              <div className="w-4 h-0.5 sm:w-6 ml-2 sm:ml-3 bg-cyan-300"></div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="chaos-answer-pill rounded-2xl px-3 sm:px-4 py-2 sm:py-3 border border-black/70">
                <textarea
                  className="min-h-[80px] sm:min-h-[90px] w-full bg-transparent text-sm leading-relaxed placeholder:text-slate-400 focus:outline-none sm:text-base"
                  placeholder="Type your updated answer here..."
                  value={answerText.slice(0, CHAR_LIMIT)}
                  maxLength={CHAR_LIMIT}
                  onChange={(event) =>
                    setAnswerText(event.target.value.slice(0, CHAR_LIMIT))
                  }
                  aria-label="Updated answer"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] text-cyan-200">
                  {answerText.length}/{CHAR_LIMIT}
                </span>
                {answerText === myAnswer.text && (
                  <span className="text-[10px] sm:text-[11px] text-amber-400">
                    No changes made
                  </span>
                )}
              </div>
              <Button
                onClick={handleSubmitAnswer}
                disabled={!answerText.trim() || answerText === myAnswer.text}
                isLoading={isSubmittingAnswer}
                fullWidth
                size="sm"
                variant="secondary"
                className="chaos-cta-button font-black text-xs sm:text-sm"
              >
                {isSubmittingAnswer ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Update Answer
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4 sm:space-y-4">
            <div className="chaos-prompt-card px-3 py-3 text-center sm:px-4 sm:py-4 shadow-xl border-2 border-black/80">
              {currentPrompt ? (
                <p className="text-2xl font-black tracking-tight drop-shadow-lg sm:text-3xl text-black">
                  {currentPrompt}
                </p>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm text-cyan-300">
                    {session?.paused ? "Game Paused" : "Loading..."}
                  </span>
                </div>
              )}
            </div>
            
            <div className="chaos-answer-pill rounded-3xl px-3 py-3 sm:px-5 sm:py-4 border border-black/70">
              <textarea
                className="min-h-[90px] w-full bg-transparent text-sm leading-relaxed placeholder:text-slate-400 focus:outline-none sm:min-h-[140px] sm:text-base"
                placeholder="Type your best response"
                value={answerText.slice(0, CHAR_LIMIT)}
                maxLength={CHAR_LIMIT}
                onChange={(event) =>
                  setAnswerText(event.target.value.slice(0, CHAR_LIMIT))
                }
                aria-label="Your answer"
              />
            </div>

            <div className="flex items-center justify-end text-[11px] sm:text-xs text-brand-primary">
              <span
                className={clsx(
                  limitReached && 'text-rose-400 font-bold text-sm sm:text-base',
                )}
              >
                {characterCount}/{CHAR_LIMIT}
              </span>
            </div>
          </div>
          <Button
            onClick={handleSubmitAnswer}
            disabled={!answerText.trim()}
            isLoading={isSubmittingAnswer}
            fullWidth
            size="sm"
            className="chaos-cta-button font-black text-xs sm:text-sm"
          >
            Submit answer
          </Button>
        </>
      )}
    </div>
  );
}

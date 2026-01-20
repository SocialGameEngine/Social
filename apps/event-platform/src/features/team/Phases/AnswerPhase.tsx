import { Card, Button, SessionTimer, ProgressBar } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { clsx } from "clsx";
import { useState, useEffect } from "react";
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
    <Card className="space-y-3 p-3 sm:space-y-5 sm:p-5" isDark={isDark}>
      <div className="space-y-2 text-center">
        <div className="rounded-2xl px-3 py-2 shadow-2xl text-xs font-semibold bg-slate-800 text-cyan-100">
          <SessionTimer
            endTime={session.endsAt}
            totalSeconds={totalSeconds}
            paused={session.paused}
            label="Time left"
            size="sm"
            showProgressBar={false}
            isDark={isDark}
          />
        </div>
        <div className="rounded-full p-0.5 shadow-inner bg-slate-700/80 shadow-slate-600">
          <ProgressBar endTime={session.endsAt} totalSeconds={totalSeconds} paused={session.paused} />
        </div>
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
          <div className="rounded-3xl px-3 py-3 text-center sm:px-4 sm:py-4 shadow-xl border-2 bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-cyan-400/50 text-cyan-100">
            {currentPrompt ? (
              <p className="text-2xl font-black tracking-tight drop-shadow-lg sm:text-3xl text-pink-300">
                {currentPrompt}
              </p>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-cyan-300">Loading...</span>
              </div>
            )}
          </div>
          
          <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center border-2 shadow-xl backdrop-blur-sm"
               style={{
                 background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(34, 197, 94, 0.1))',
                 borderColor: '#22c55e',
                 boxShadow: '0 0 30px rgba(34, 197, 94, 0.3), inset 0 1px 1px rgba(34, 197, 94, 0.2)'
               }}>
            {/* Success indicator */}
            <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center"
                 style={{ backgroundColor: '#22c55e' }}>
              <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <p className="text-xs sm:text-sm font-bold mb-2 sm:mb-3"
               style={{ color: '#22c55e' }}>
              ✓ Answer submitted!
            </p>
            <div className="bg-black/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-2 sm:mb-3 border border-green-500/20">
              <p className="text-base sm:text-lg font-medium text-white leading-relaxed">{myAnswer.text}</p>
            </div>
            {myAnswer.updatedAt && myAnswer.updatedAt !== myAnswer.createdAt && (
              <p className="text-[10px] sm:text-xs opacity-80"
                 style={{ color: '#86efac' }}>
                Updated {new Date(myAnswer.updatedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
          
          <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-2 shadow-lg backdrop-blur-sm"
               style={{
                 background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.6))',
                 borderColor: 'rgba(6, 182, 212, 0.4)',
                 boxShadow: 'inset 0 1px 1px rgba(138, 43, 226, 0.2), 0 10px 22px rgba(0, 0, 0, 0.6)'
               }}>
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className="w-4 h-0.5 sm:w-6 mr-2 sm:mr-3" style={{ backgroundColor: '#06b6d4' }}></div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider"
                 style={{ color: '#06b6d4' }}>
                Update Your Answer
              </p>
              <div className="w-4 h-0.5 sm:w-6 ml-2 sm:ml-3" style={{ backgroundColor: '#06b6d4' }}></div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <textarea
                className="min-h-[80px] sm:min-h-[90px] w-full rounded-xl sm:rounded-2xl border border-cyan-400/30 px-3 sm:px-4 py-2 sm:py-3 text-sm leading-relaxed placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all"
                placeholder="Type your updated answer here..."
                value={answerText.slice(0, CHAR_LIMIT)}
                maxLength={CHAR_LIMIT}
                onChange={(event) =>
                  setAnswerText(event.target.value.slice(0, CHAR_LIMIT))
                }
                aria-label="Updated answer"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  color: '#ffffff',
                  backdropFilter: 'blur(10px)'
                }}
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px]" style={{ color: '#06b6d4' }}>
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
                className="border-cyan-400/30 hover:border-cyan-400/50 text-xs sm:text-sm"
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
          <div className="space-y-2 sm:space-y-3">
            <div className="rounded-3xl px-3 py-3 text-center sm:px-4 sm:py-4 shadow-xl border-2 bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-cyan-400/50 text-cyan-100">
              {currentPrompt ? (
                <p className="text-2xl font-black tracking-tight drop-shadow-lg sm:text-3xl text-pink-300">
                  {currentPrompt}
                </p>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm text-cyan-300">Loading...</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-brand-primary">
              <span>Type your answer below</span>
              <span
                className={clsx(
                  limitReached && 'text-rose-400 font-bold text-sm sm:text-base',
                )}
              >
                {characterCount}/{CHAR_LIMIT}
              </span>
            </div>
            <textarea
              className="matte-input min-h-[90px] w-full rounded-3xl border border-white/40 bg-transparent px-3 py-3 text-sm leading-relaxed placeholder:text-slate-500 focus:border-brand-primary focus:outline-none focus:ring-4 focus:ring-brand-light sm:min-h-[140px] sm:px-5 sm:py-4 sm:text-base"
              placeholder="Type your best response"
              value={answerText.slice(0, CHAR_LIMIT)}
              maxLength={CHAR_LIMIT}
              onChange={(event) =>
                setAnswerText(event.target.value.slice(0, CHAR_LIMIT))
              }
              aria-label="Your answer"
            />
          </div>
          <Button
            onClick={handleSubmitAnswer}
            disabled={!answerText.trim()}
            isLoading={isSubmittingAnswer}
            fullWidth
            size="sm"
          >
            Submit answer
          </Button>
        </>
      )}
    </Card>
  );
}

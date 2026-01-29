import { useParams, Link } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { Timer, Card } from "@social/ui";
import { BackgroundAnimation } from "../../components/BackgroundAnimation";
import { transformRoundSummariesForUI } from "../../application";
import { useInviteLink, usePlayerLookup, useSessionTimers, useVoteCalculations, usePhaseTimer, useGameStateIntegration, useActiveGroupData } from "../../shared/hooks";
import { useTheme } from "../../shared/providers/ThemeProvider";
import { phaseSubtitle, phaseHeadline } from "../../shared/constants";
import classicPrompts from "../../shared/prompts.json";
import type { Team } from "../../shared/types";
import {
  LobbyPhase,
  AnswerPhase,
  VotePhase,
  ResultsPhase,
  EndedPhase,
} from "./Phases";
import { StatusSummaryCard } from "./Phases/StatusSummaryCard";
import QRCodeBlock from "../../components/QRCodeBlock";

export function PresenterPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId ?? "";
  const { isDark } = useTheme();

  // Use shared game state integration hook
  const {
    gameState,
    session,
    teams,
    answers,
    hasSnapshot,
    roundGroups,
    totalGroups,
    activeGroup,
    activeGroupIndex,
    voteCounts,
  } = useGameStateIntegration({ sessionId });

  // Debug: log presenter view data changes
  console.log('Presenter View - roundGroups updated:', roundGroups.map(g => ({ id: g.id, prompt: g.prompt })));

  // Use shared timer hook
  const { now } = useSessionTimers();

  // Pause message cycling (presenter-specific logic)
  const [pauseMessageIndex, setPauseMessageIndex] = useState(0);
  useEffect(() => {
    if (!session?.paused) {
      setPauseMessageIndex(0);
      return;
    }

    const pauseMessages = [
      "Timer's on hold, bud. Stretch yer legs.",
      "Hold up... don't do anything stupid yet.",
      "Paused. Don't send 'er yet, eh.",
      "Sit tight, bud. We'll get back to it.",
      "Timer's taking a nap. So are we.",
      "Chill, bud. Wait for the go.",
      "Pause time! No excuses yet.",
      "Don't do anything rash... yet.",
      "Patience, bud. It'll start again soon.",
      "Time's frozen. Overthinking is allowed.",
      "Nothing's happening yet... stay classy, bud.",
      "Keep your phones ready. Not yet, bud.",
      "Breather time. Think of something good.",
      "Pause in effect. Don't get too comfortable.",
      "Almost... but not quite. Chill, bud."
    ];

    const interval = window.setInterval(() => {
      setPauseMessageIndex(prev => (prev + 1) % pauseMessages.length);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [session?.paused]);

  const playerLookup = usePlayerLookup(teams);
  const inviteLink = useInviteLink(session);

  // Use shared active group data hook
  const { activeGroupAnswers } = useActiveGroupData({ answers, session, activeGroup });

  // Use shared vote calculations hook
  const {
    voteSummaryActive,
    activeGroupWinnerIds,
  } = useVoteCalculations({
    session,
    now,
    activeGroup,
    activeGroupAnswers,
    voteCounts,
  });

  // Use shared phase timer hook
  const { totalSeconds } = usePhaseTimer({ session });

  // Use gameState roundSummaries with shared transformation
  const transformedRoundSummaries = transformRoundSummariesForUI(
    gameState.roundSummaries,
    roundGroups,
    teams
  );

  // Calculate time remaining based on current time for real-time updates
  const timeRemaining = useMemo(() => {
    // If session is paused or no timer, show 0 or special state
    if (session?.paused || !session?.endsAt) return 0;
    const remaining = new Date(session.endsAt).getTime() - now;
    return Math.max(0, Math.ceil(remaining / 1000));
  }, [session?.paused, session?.endsAt, now]);

  const presenterHeading = useMemo(() => {
    if (!session) return "";
    switch (session.status) {
      case "lobby":
        return "Scan the QR to join the round";
      case "answer":
        if (!totalGroups) return null;

        // Show pause messages when session is paused
        if (session.paused) {
          const pauseMessages = [
            "Timer's on hold, bud. Stretch yer legs.",
            "Hold up... don't do anything stupid yet.",
            "Paused. Don't send 'er yet, eh.",
            "Sit tight, bud. We'll get back to it.",
            "Timer's taking a nap. So are we.",
            "Chill, bud. Wait for the go.",
            "Pause time! No excuses yet.",
            "Don't do anything rash... yet.",
            "Patience, bud. It'll start again soon.",
            "Time's frozen. Overthinking is allowed.",
            "Nothing's happening yet... stay classy, bud.",
            "Keep your phones ready. Not yet, bud.",
            "Breather time. Think of something good.",
            "Pause in effect. Don't get too comfortable.",
            "Almost... but not quite. Chill, bud."
          ];
          return pauseMessages[pauseMessageIndex];
        }

        // Dynamic Alberta-style messaging based on time remaining
        if (timeRemaining >= 61) {
          return `ANSWER THE PROMPT\nMake it funny. No stress.\nTime left: ${timeRemaining} seconds`;
        } else if (timeRemaining >= 41) {
          return `You got this. Just pick somethin', bud.\n${timeRemaining} seconds left`;
        } else if (timeRemaining >= 26) {
          return `Alright, let's see it. Don't stall.\n${timeRemaining} seconds left`;
        } else if (timeRemaining >= 16) {
          return `Overthinkin' = sus. Just roll with it.\n${timeRemaining} seconds left`;
        } else if (timeRemaining >= 11) {
          return `It's fine. Really, just send 'er.\n${timeRemaining} seconds left`;
        } else if (timeRemaining >= 6) {
          return `Hot take: just type it, bud.\n${timeRemaining} seconds`;
        } else if (timeRemaining >= 3) {
          return `Any ol' answer works now.\n${timeRemaining} seconds`;
        } else if (timeRemaining >= 1) {
          return `Send 'er, bud.\n${timeRemaining} second${timeRemaining === 1 ? '' : 's'}`;
        } else {
          return `Commit. That's all she wrote.\n${timeRemaining} seconds`;
        }
      case "vote":
        return (
          activeGroup?.prompt ??
          roundGroups[activeGroupIndex]?.prompt ??
          classicPrompts[session.roundIndex % classicPrompts.length]
        );
      case "results":
        return "Round results";
      default:
        return (
          roundGroups[0]?.prompt ?? classicPrompts[session.roundIndex % classicPrompts.length]
        );
    }
  }, [
    session,
    activeGroup?.prompt,
    roundGroups,
    activeGroupIndex,
    totalGroups,
    timeRemaining,
    pauseMessageIndex,
  ]);

  const groupStatusLabel = useMemo(() => {
    if (!session) return "";
    if (session.status === "vote" && totalGroups) {
      return `Group ${activeGroupIndex + 1} of ${totalGroups}`;
    }
    if (session.status === "answer" && totalGroups) {
      return `${totalGroups} group${totalGroups === 1 ? "" : "s"} drafting`;
    }
    return "";
  }, [session, totalGroups, activeGroupIndex]);

  // Use gameState.leaderboard and merge with full team data for compatibility
  const leaderboard = gameState.leaderboard.map(entry => {
    const team = teams.find(t => t.id === entry.teamId);
    return team ? { ...team, rank: entry.rank } : null;
  }).filter(Boolean) as (Team & { rank: number })[];

  if (!hasSnapshot) {
    return (
      <main className={`flex min-h-screen flex-col items-center justify-center px-6 py-12 ${!isDark ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-white'}`}>
        <p className={`text-lg ${!isDark ? 'text-slate-600' : 'text-white/70'}`}>Fetching session...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className={`flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center ${!isDark ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-white'}`}>
        <h1 className={`text-4xl font-black ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>Session not found</h1>
        <p className={`mt-3 max-w-md ${!isDark ? 'text-slate-600' : 'text-white/70'}`}>
          Double-check the presenter link or launch a new session from the host
          console.
        </p>
        <Link
          to="/"
          className={`mt-6 rounded-full px-6 py-3 text-sm font-semibold ${!isDark ? 'bg-white text-slate-900' : 'bg-slate-700 text-cyan-100 hover:bg-slate-600'}`}
        >
          Back to home
        </Link>
      </main>
    );
  }

  const showStatusSummaryCard = session?.status !== "lobby" && session?.status !== "ended";

  const renderPhaseContent = () => {
    // Return loading state if no session
    if (!session) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg text-cyan-300">Loading session...</span>
          </div>
        </div>
      );
    }

    const statusCard = showStatusSummaryCard ? (
      <StatusSummaryCard
        session={session}
        presenterHeading={presenterHeading}
        groupStatusLabel={groupStatusLabel}
        totalSeconds={totalSeconds}
      />
    ) : null;

    switch (session.status) {
      case "lobby":
        return (
          <LobbyPhase
            session={session}
            presenterHeading={presenterHeading}
            groupStatusLabel={groupStatusLabel}
            totalSeconds={totalSeconds}
            players={teams}
          />
        );
      case "answer":
        return (
          <>
            {statusCard}
            <AnswerPhase roundGroups={roundGroups} teamLookup={playerLookup} isDark={isDark} />
          </>
        );
      case "vote":
        return (
          <>
            {statusCard}
            <VotePhase
              activeGroupAnswers={activeGroupAnswers}
              voteCounts={voteCounts}
              activeGroupWinnerIds={activeGroupWinnerIds}
              voteSummaryActive={voteSummaryActive}
              teamLookup={playerLookup}
            />
          </>
        );
      case "results":
        return (
          <>
            {statusCard}
            <ResultsPhase
              leaderboard={leaderboard}
              roundSummaries={transformedRoundSummaries}
              voteCounts={voteCounts}
            />
          </>
        );
      case "ended":
        return (
          <>
            {statusCard}
            <EndedPhase leaderboard={leaderboard} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <BackgroundAnimation show={true} />
      <main className={`relative min-h-screen px-6 py-10 ${!isDark ? 'text-slate-900' : 'text-white'}`}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col items-center justify-between gap-6 lg:flex-row">
          <Card className="text-center lg:text-left" isDark={isDark}>
            <h1 className={`text-4xl font-black tracking-tight ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
              {phaseHeadline[session.status]}
            </h1>
            <p className={`mt-2 text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
              {phaseSubtitle[session.status]}
            </p>
          </Card>
          <div className="flex items-center gap-6">
            <div className={`flex flex-col items-center gap-2 rounded-2xl px-6 py-4 border ${!isDark ? 'bg-slate-100 border-slate-200' : 'bg-cyan-900/30 border-cyan-400/50'}`}>
              <span className={`text-xs uppercase tracking-wider ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                Room code
              </span>
              <span className={`text-3xl font-black tracking-widest ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
                {session.code}
              </span>
              {teams.length > 0 ? (
                <span className={`text-xs ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>
                  {teams.length} player{teams.length === 1 ? "" : "s"} online
                </span>
              ) : null}
            </div>
            {session.status === "lobby" && (
              <div className="mt-4 flex flex-col items-center">
                <QRCodeBlock value={inviteLink || ""} isDark={isDark} />
              </div>
            )}
            <Timer
              endTime={session.endsAt}
              size="lg"
              label="Time"
              isDark={isDark}
              paused={session.paused}
            />
          </div>
        </header>

        {renderPhaseContent()}
      </div>
    </main>
    </>
  );
}

export default PresenterPage;

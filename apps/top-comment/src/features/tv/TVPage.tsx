import { useParams, Link } from "react-router-dom";
import { useMemo, useEffect, useRef, useCallback } from "react";
import { Timer, Card } from "@social/ui";
import { BackgroundAnimation } from "../../components/BackgroundAnimation";
import { useTheme } from "../../shared/providers/ThemeProvider";
import { useReactions } from "../../hooks/useReactions";
import { PresenterReactionBar } from "../presenter/components/PresenterReactionBar";
import { ReactionOverlay } from "../room/components/ReactionOverlay";
import QRCodeBlock from "../../components/QRCodeBlock";
import { useTVPresenter } from "./hooks/useTVPresenter";
import { useTVAutoTTS } from "./hooks/useTVAutoTTS";
import { useRoom } from "../../hooks/useRoom";
import { supabase } from "../../supabase/client";
import {
  LobbyPhase,
  AnswerPhase,
  VotePhase,
  ResultsPhase,
  EndedPhase,
} from "./Phases";

export function TVPage() {
  const { roomCode = "" } = useParams<{ roomCode: string }>();
  const { isDark } = useTheme();

  // Fetch room first to get the sociale
  const { room, isLoading: roomLoading } = useRoom({ roomCode });

  const {
    sociale,
    currentRound,
    socialites,
    currentRoundResponses,
    currentRoundVotes,
    scoreboard,
    currentPhase,
    timeRemaining,
    isLoading: socialeLoading,
  } = useTVPresenter(room?.currentSocialeId ?? "");

  const { reactions, reactionCounts, bursts } = useReactions({
    roomId: sociale?.roomId,
    membershipId: undefined,
  });

  // Auto TTS - fires on phase and round changes
  useTVAutoTTS(sociale ?? null, currentRound ?? null);

  // Ambient mode auto-advance
  const isAdvancing = useRef(false);

  const advancePhase = useCallback(async () => {
    if (!sociale?.id || isAdvancing.current) return;
    if (sociale?.mode !== 'ambient') return; // only TVPage drives ambient advance

    isAdvancing.current = true;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.functions.invoke('sociales-advance', {
        body: { socialeId: sociale.id },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });
    } catch (err) {
      console.error('Ambient auto-advance failed:', err);
    } finally {
      isAdvancing.current = false;
    }
  }, [sociale?.id, sociale?.mode]);

  // Fire when phaseEndsAt expires
  useEffect(() => {
    if (!sociale?.phaseEndsAt || sociale.mode !== 'ambient') return;

    const msRemaining = new Date(sociale.phaseEndsAt).getTime() - Date.now();
    if (msRemaining <= 0) {
      void advancePhase();
      return;
    }

    const timer = window.setTimeout(() => void advancePhase(), msRemaining + 500); // +500ms buffer
    return () => window.clearTimeout(timer);
  }, [sociale?.phaseEndsAt, sociale?.mode, advancePhase]);

  const isLoading = roomLoading || socialeLoading;

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-white/70">Loading...</p>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center text-center px-6">
        <h1 className="text-4xl font-black text-pink-400">Room not found</h1>
        <p className="mt-2 text-lg text-white/70">Room code: {roomCode}</p>
        <Link to="/" className="mt-6 rounded-full bg-slate-700 px-6 py-3 text-sm font-semibold text-cyan-100">
          Back to home
        </Link>
      </main>
    );
  }

  if (!sociale) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center text-center px-6">
        <h1 className="text-4xl font-black text-pink-400">No active game in this room</h1>
        <p className="mt-2 text-lg text-white/70">Room code: {roomCode}</p>
        <Link to="/" className="mt-6 rounded-full bg-slate-700 px-6 py-3 text-sm font-semibold text-cyan-100">
          Back to home
        </Link>
      </main>
    );
  }

  const renderPhase = () => {
    switch (currentPhase) {
      case 'lobby':
        return (
          <LobbyPhase
            sociale={sociale}
            socialites={socialites}
            roomCode={room?.code ?? ""}
            isDark={isDark}
          />
        );
      case 'answer':
        return (
          <AnswerPhase
            currentRound={currentRound}
            responses={currentRoundResponses}
            socialites={socialites}
            isDark={isDark}
          />
        );
      case 'vote':
        return (
          <VotePhase
            currentRound={currentRound}
            responses={currentRoundResponses}
            votes={currentRoundVotes}
            socialites={socialites}
            isDark={isDark}
          />
        );
      case 'results':
        return (
          <ResultsPhase
            sociale={sociale}
            currentRound={currentRound}
            responses={currentRoundResponses}
            scoreboard={scoreboard}
            isDark={isDark}
          />
        );
      case 'ended':
        return <EndedPhase scoreboard={scoreboard} isDark={isDark} />;
      default:
        return null;
    }
  };

  return (
    <>
      <BackgroundAnimation show={true} />
      <main className={`relative min-h-screen px-6 py-10 ${!isDark ? 'text-slate-900' : 'text-white'}`}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">

          {/* Header */}
          <header className="flex flex-col items-center justify-between gap-6 lg:flex-row">
            <Card className="text-center lg:text-left" isDark={isDark}>
              <h1 className={`text-4xl font-black tracking-tight ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
                {currentRound?.title ?? sociale.title ?? "Social Game"}
              </h1>
              <p className={`mt-2 text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                Round {(sociale.currentRoundIndex ?? 0) + 1} of {sociale.totalRounds ?? "?"}
              </p>
            </Card>

            <div className="flex items-center gap-6">
              {/* Room code */}
              <div className={`flex flex-col items-center gap-2 rounded-2xl px-6 py-4 border ${!isDark ? 'bg-slate-100 border-slate-200' : 'bg-cyan-900/30 border-cyan-400/50'}`}>
                <span className={`text-xs uppercase tracking-wider ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>Room code</span>
                <span className={`text-3xl font-black tracking-widest ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
                  {room?.code ?? "â\u0080\u0094"}
                </span>
                <span className={`text-xs ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>
                  {socialites.length} player{socialites.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* QR â\u0080\u0094 always visible per P1-16 */}
              {room?.code && (
                <QRCodeBlock value={`${window.location.origin}/room/${room.code}`} isDark={isDark} />
              )}

              {/* Phase timer */}
              <Timer
                endTime={sociale.phaseEndsAt ?? undefined}
                size="lg"
                label="Time"
                isDark={isDark}
              />
            </div>
          </header>

          {renderPhase()}

          <PresenterReactionBar reactionCounts={reactionCounts} />
        </div>
        <ReactionOverlay reactions={reactions} bursts={bursts} />
      </main>
    </>
  );
}

export default TVPage;

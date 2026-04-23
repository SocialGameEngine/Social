import { useParams, Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Timer } from "@social/ui";
import { BackgroundAnimation } from "../../components/BackgroundAnimation";
import { useTheme } from "../../shared/providers/ThemeProvider";
import { useReactions } from "../../hooks/useReactions";
import { PresenterReactionBar } from "../presenter/components/PresenterReactionBar";
import { ReactionOverlay } from "../room/components/ReactionOverlay";
import { TVCornerQR } from "./components/TVCornerQR";
import { useTVPresenter } from "./hooks/useTVPresenter";
import { useTVAutoTTS } from "./hooks/useTVAutoTTS";
import { useTVSoundboard } from "./hooks/useTVSoundboard";
import { useHostSignals } from "../room/hooks/useHostSignals";
import { useRoom } from "../../hooks/useRoom";
import { supabase } from "../../supabase/client";
import { TVAttractScreen } from "./TVAttractScreen";
import { TVRoundProgress } from "./components/TVRoundProgress";
import { TVRoundAudio } from "./components/TVRoundAudio";
import { TVRoundIntroSplash } from "./components/TVRoundIntroSplash";
import { TVFinalRoundBadge } from "./components/TVFinalRoundBadge";
import { TVLeaderboardMoment } from "./components/TVLeaderboardMoment";
import { TVPodiumCeremony } from "./components/TVPodiumCeremony";
import { TVHypeMeter } from "./components/TVHypeMeter";
import {
  LobbyPhase,
  AnswerPhase,
  VotePhase,
  RevealPhase,
  ResultsPhase,
  EndedPhase,
  BreakPhase,
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

  // P1-4: TV plays soundboard cues the host fires from HostSignalsToolbar.
  useTVSoundboard(room?.id ?? null);

  // P1-10: host-forced leaderboard moment. We key the `triggerKey` off the
  // broadcast's nonce so repeat presses refire the animation.
  const { signals: hostSignals, send: sendHostSignal } = useHostSignals(room?.id ?? null);

  // P1-1: track previous scoreboard ranks so we can show ↑/↓ deltas on the
  // leaderboard moment. Keyed by socialiteId → rank (1-based).
  const prevRanksRef = useRef<Map<string, number>>(new Map());

  // P1-2 (topic-round score coupling): track the peak hype level reached
  // during the current round so we can award a bonus when the round ends.
  const peakHypeLevelRef = useRef<number>(0);
  const prevRoundIdRef = useRef<string | null>(null);
  const prevRoundTypeRef = useRef<string | null>(null);

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

  // Round intro splash (P1-9): fire once per new round. We key off roundId so
  // reconnects mid-round don't re-trigger the splash.
  const roundKey = sociale?.currentRoundId ?? null;
  const isFinalRound = useMemo(() => {
    if (!sociale?.totalRounds || sociale.currentRoundIndex === undefined) return false;
    return (sociale.currentRoundIndex ?? 0) === (sociale.totalRounds ?? 0) - 1;
  }, [sociale?.totalRounds, sociale?.currentRoundIndex]);

  // Leaderboard moment (P1-10). Two triggers:
  //   (a) the scheduled "every results phase" beat (existing behaviour)
  //   (b) host-forced mid-game via the LEADERBOARD_SHOW broadcast
  /** P1-10: `'off'` | `'scheduled'` | `'every_question'` (default scheduled). */
  const leaderboardMode = (() => {
    const v = (sociale?.settings as Record<string, unknown>)?.leaderboardEnabled;
    if (v === false || v === "off") return "off" as const;
    if (v === "every_question") return "every_question" as const;
    return "scheduled" as const;
  })();
  const scheduledLeaderboardEnabled = leaderboardMode !== "off";
  const scheduledKey =
    scheduledLeaderboardEnabled && currentPhase === "results" && sociale?.currentRoundId
      ? `moment-${sociale.currentRoundId}`
      : null;
  const hostForcedKey = hostSignals.leaderboardShowAt
    ? `host-${hostSignals.leaderboardShowAt}`
    : null;
  const leaderboardMomentKey = hostForcedKey ?? scheduledKey;

  // P1-1: After each leaderboard moment, snapshot the current ranks so the
  // NEXT moment can compute ↑/↓ deltas. The 300 ms delay lets the current
  // render (which reads the ref for deltas) commit before we overwrite it.
  useEffect(() => {
    if (!leaderboardMomentKey) return;
    const tid = window.setTimeout(() => {
      const map = new Map<string, number>();
      scoreboard.forEach((s: any, i: number) => map.set(s.socialiteId, i + 1));
      prevRanksRef.current = map;
    }, 300);
    return () => window.clearTimeout(tid);
  }, [leaderboardMomentKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // P1-1: rows with rank deltas for the leaderboard moment.
  const leaderboardRows = useMemo(
    () =>
      scoreboard.map((s: any, i: number) => {
        const currentRank = i + 1;
        const prevRank = prevRanksRef.current.get(s.socialiteId);
        return {
          id: s.socialiteId,
          name: s.displayName,
          score: s.score ?? 0,
          // positive = moved up (e.g. was 4th, now 2nd → delta +2)
          deltaFromLastRound: prevRank !== undefined ? prevRank - currentRank : 0,
        };
      }),
    // Re-derive when the moment fires so deltas are fresh from the pre-update ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scoreboard, leaderboardMomentKey],
  );

  // P1-2: stable callback for hype level-up — plays a sound cue AND updates
  // the per-round peak so the bonus edge function gets the right tier.
  const handleHypeLevelUp = useCallback(
    (level: number) => {
      if (level > peakHypeLevelRef.current) peakHypeLevelRef.current = level;
      const cue = level >= 3 ? "applause" : level >= 2 ? "cheer" : "ding";
      sendHostSignal("sound:play", { id: cue });
    },
    [sendHostSignal],
  );

  // P1-2 (topic-round score coupling): fire hype bonus when the round
  // advances away from a topic round that had hype activity (peakLevel >= 1).
  useEffect(() => {
    const prevId = prevRoundIdRef.current;
    const prevType = prevRoundTypeRef.current;
    const peak = peakHypeLevelRef.current;
    const newId = currentRound?.id ?? null;

    if (prevId && prevId !== newId && prevType === 'topic' && peak >= 1 && sociale?.id) {
      void (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          await supabase.functions.invoke('sociales-hype-bonus', {
            body: { socialeId: sociale!.id, roundId: prevId, peakHypeLevel: peak },
            headers: session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : {},
          });
        } catch (err) {
          // Non-critical — bonus scoring failure should never interrupt gameplay.
          console.warn('[hype-bonus] failed, non-critical:', err);
        }
      })();
    }

    // Always update refs so next transition has fresh context.
    prevRoundIdRef.current = newId;
    prevRoundTypeRef.current = currentRound?.type ?? null;
    // Reset peak for the incoming round.
    peakHypeLevelRef.current = 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRound?.id]);

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

  if (!sociale || sociale.status === 'completed' || sociale.status === 'cancelled') {
    return (
      <>
        <BackgroundAnimation show={true} />
        <TVAttractScreen
          roomCode={room.code}
          roomId={room.id}
          roomName={room.name}
          isDark={isDark}
        />
      </>
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
      case 'reveal':
        return (
          <RevealPhase
            currentRound={currentRound}
            responses={currentRoundResponses}
            votes={currentRoundVotes}
            socialites={socialites}
            isDark={isDark}
          />
        );
      case 'break':
        return <BreakPhase sociale={sociale} isDark={isDark} />;
      case 'results':
        return (
          <ResultsPhase
            sociale={sociale}
            currentRound={currentRound}
            responses={currentRoundResponses}
            scoreboard={scoreboard}
            roomId={room.id}
            isDark={isDark}
          />
        );
      case 'ended':
        return <EndedPhase scoreboard={scoreboard} isDark={isDark} />;
      default:
        return null;
    }
  };

  const joinUrl = room?.code
    ? `${window.location.origin}/room/${room.code}`
    : undefined;

  const hasActiveTimer = Boolean(sociale.phaseEndsAt);
  // Phases where the on-TV urgency treatment (vignette + stadium digits) should
  // fire. Limited to the two interactive phases where players have a decision
  // to get in before the clock expires; reveal/results/lobby/ended have timers
  // too but no player action — firing the red screen there feels alarming for
  // no reason.
  const URGENCY_PHASES = ['answer', 'vote'] as const;
  const showUrgencyIndicator = URGENCY_PHASES.includes(currentPhase as typeof URGENCY_PHASES[number]);

  return (
    <>
      <BackgroundAnimation show={true} />

      {/* Phase timer — only render when the current phase actually has a deadline
          (otherwise the built-in ghost "Time 0s" reads as broken UI). */}
      {hasActiveTimer && (
        <div className="chaos-tv-timer-wrap">
          <Timer
            endTime={sociale.phaseEndsAt ?? undefined}
            size="lg"
            label="Time"
            position="inline"
            isDark={true}
            showCriticalBar={showUrgencyIndicator}
          />
        </div>
      )}

      {/* P1-11: 2x multiplier chip during final round only */}
      <TVFinalRoundBadge
        visible={isFinalRound && (currentPhase === 'answer' || currentPhase === 'vote')}
      />

      {/* P1-9: round intro splash — fires once per new round, only during answer phase */}
      {roundKey && currentRound && currentPhase === 'answer' && (
        <TVRoundIntroSplash
          triggerKey={roundKey}
          roundNumber={(sociale.currentRoundIndex ?? 0) + 1}
          totalRounds={sociale.totalRounds ?? 0}
          title={currentRound.title ?? sociale.title ?? 'Next round'}
          kind={currentRound.type ?? undefined}
          category={
            (() => {
              const raw = currentRound.content;
              if (raw && typeof raw === "string" && raw.trim().startsWith("{")) {
                try {
                  const j = JSON.parse(raw) as { category?: string };
                  if (j?.category) return j.category;
                } catch {
                  /* not JSON */
                }
              }
              return currentRound.type ?? undefined;
            })()
          }
          isFinalRound={isFinalRound}
        />
      )}

      {/* P1-30: podium + confetti ceremony when the sociale ends */}
      <TVPodiumCeremony
        visible={currentPhase === 'ended'}
        top3={scoreboard.slice(0, 3).map((s: any) => ({
          id: s.socialiteId,
          displayName: s.displayName,
          score: s.score ?? 0,
          mascotId: s.mascotId ?? null,
        }))}
      />

      {/* P1-12: per-question audio clip. Reads from currentRound.settings.audio
          so hosts can attach without a schema migration on the frontend types. */}
      {currentRound && (() => {
        const audio = (currentRound.settings as any)?.audio
          ?? {
            url: (currentRound as any)?.audio_url ?? null,
            kind: (currentRound as any)?.audio_kind ?? 'mp3',
            startSeconds: (currentRound as any)?.audio_start_seconds ?? 0,
          };
        return (
          <TVRoundAudio
            url={audio?.url ?? null}
            kind={audio?.kind ?? 'mp3'}
            startSeconds={audio?.startSeconds ?? 0}
            phase={currentPhase}
            roundKey={currentRound.id ?? null}
          />
        );
      })()}

      {/* P1-10: full-screen leaderboard moment between rounds */}
      <TVLeaderboardMoment
        triggerKey={leaderboardMomentKey}
        rows={leaderboardRows}
      />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="relative min-h-screen px-6 pt-28 pb-40 md:pt-32 md:pb-48 text-white"
      >
        {/* Hero stage: phase content is the focus */}
        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-stretch gap-6">
          {/* P1-20: segmented round progress bar */}
          {(sociale.totalRounds ?? 0) > 0 && (
            <TVRoundProgress
              currentIndex={sociale.currentRoundIndex ?? 0}
              totalRounds={sociale.totalRounds ?? 0}
            />
          )}

          {(currentRound?.title || sociale.title) && (
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className="chaos-tv-title chaos-tv-title--soft text-center text-3xl md:text-5xl lg:text-6xl"
            >
              {currentRound?.title ?? sociale.title}
            </motion.h1>
          )}

          {renderPhase()}

          {/* P1-2: collective hype meter — only during results/reveal phase. */}
          <TVHypeMeter
            roomId={room?.id ?? null}
            active={currentPhase === "results" || currentPhase === "reveal"}
            onLevelUp={handleHypeLevelUp}
          />

          <PresenterReactionBar reactionCounts={reactionCounts} />
        </div>

        {/* Top-left: round progress sticker */}
        <motion.div
          initial={{ opacity: 0, y: -16, rotate: -6 }}
          animate={{ opacity: 1, y: 0, rotate: -2 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          className="fixed left-6 top-6 z-40 md:left-10 md:top-10"
        >
          <span className="chaos-tv-section-eyebrow">
            <span className="chaos-tv-live-dot" />
            Round {(sociale.currentRoundIndex ?? 0) + 1} of {sociale.totalRounds ?? "?"}
          </span>
        </motion.div>

        {/* Top-right (below fixed Timer): room code mini-sticker */}
        {room?.code && (
          <motion.div
            initial={{ opacity: 0, y: -16, rotate: 4 }}
            animate={{ opacity: 1, y: 0, rotate: 2 }}
            transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1], delay: 0.05 }}
            className="fixed right-6 top-28 z-40 md:right-10 md:top-32"
          >
            <div className="chaos-tv-header-code">
              <span className="chaos-tv-header-code-label">Room</span>
              <span className="chaos-tv-header-code-value">{room.code}</span>
            </div>
          </motion.div>
        )}

        {/* Bottom-left: live player count badge */}
        {socialites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -60, rotate: -6 }}
            animate={{ opacity: 1, x: 0, rotate: -2 }}
            transition={{ type: "spring", stiffness: 320, damping: 20 }}
            className="fixed bottom-6 left-6 z-40 md:bottom-10 md:left-10"
          >
            <span className="chaos-tv-joined">
              <span className="chaos-tv-joined-dot" />
              {socialites.length} PLAYER{socialites.length === 1 ? "" : "S"}
            </span>
          </motion.div>
        )}

        {/* P1-26: persistent top-right QR for the whole session. Shrinks during
            active play so it doesn't dominate the screen during questions. */}
        {joinUrl && (
          <TVCornerQR
            joinUrl={joinUrl}
            roomCode={room?.code ?? ''}
            isActivePlay={currentPhase === 'answer' || currentPhase === 'vote'}
          />
        )}

        <ReactionOverlay reactions={reactions} bursts={bursts} />

        {/* P1-20 — permanent thin progress ribbon at the bottom of /tv so the
            round cursor is always readable without needing the splash or the
            segmented bar to be on screen. */}
        {(sociale.totalRounds ?? 0) > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-30 h-[3px] bg-white/5">
            <motion.div
              className="h-full"
              style={{
                background:
                  'linear-gradient(90deg, rgba(34,211,238,1) 0%, rgba(236,72,153,1) 100%)',
                boxShadow: '0 0 10px rgba(34,211,238,0.7)',
              }}
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    (((sociale.currentRoundIndex ?? 0) + 1) /
                      (sociale.totalRounds ?? 1)) *
                      100
                  )
                )}%`,
              }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              aria-hidden
            />
          </div>
        )}
      </motion.main>
    </>
  );
}

export default TVPage;

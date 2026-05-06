import { useMemo, useState } from 'react';
import { PhaseShell } from './shell/PhaseShell';
import { PodiumLeaderboard, type PodiumEntry } from './leaderboard/PodiumLeaderboard';
import { ShareCardButton } from './ShareCardButton';
import { ShareCardPngButton } from '../../share/ShareCardPngButton';
import { WrappedRecap } from '../../share/WrappedRecap';
import { generateStoryCards } from '../../../domain/share/generateStoryCards';
import type { RoundResult } from '../utils/shareCard';

export interface SocialeLeaderboardTeam {
  id: string;
  teamName: string;
  score: number;
  rank: number;
  mascotId?: number;
}

interface SocialeLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  finalLeaderboard: SocialeLeaderboardTeam[];
  currentSocialiteId?: string;
  onLeave: () => void;
  /** Optional per-round outcome list for the local user (fills the emoji grid). */
  myRoundResults?: RoundResult[];
  /** Optional venue name for the share card header. */
  venueName?: string | null;
  /** P1-13: membership weekly streak for share line. */
  membershipStreakWeeks?: number | null;
}

export function SocialeLeaderboardModal({
  isOpen,
  onClose,
  finalLeaderboard,
  currentSocialiteId,
  onLeave,
  myRoundResults,
  venueName,
  membershipStreakWeeks,
}: SocialeLeaderboardModalProps) {
  const [showRecap, setShowRecap] = useState(false);

  const podiumEntries: PodiumEntry[] = useMemo(
    () =>
      finalLeaderboard.map((t) => ({
        id: t.id,
        displayName: t.teamName,
        score: t.score,
        rank: t.rank,
        mascotId: t.mascotId,
      })),
    [finalLeaderboard],
  );

  const me = currentSocialiteId
    ? finalLeaderboard.find((t) => t.id === currentSocialiteId)
    : null;

  const recapCards = useMemo(() => {
    if (!me || !myRoundResults || myRoundResults.length === 0) return [];
    try {
      return generateStoryCards({
        totalScore: me.score,
        roundsPlayed: myRoundResults.length,
        correctAnswers: myRoundResults.filter(r => r.status === 'correct').length,
        totalAnswers: myRoundResults.length,
        longestStreak: 0,
        rankPosition: me.rank,
        totalPlayers: finalLeaderboard.length,
        votesReceived: 0,
        votesGiven: 0,
        perfectRounds: 0,
        roundScores: [],
        roundAccuracy: myRoundResults.map(r => r.status === 'correct'),
        venueName: venueName ?? undefined,
        sessionDate: new Date(),
      });
    } catch {
      return [];
    }
  }, [me, myRoundResults, finalLeaderboard.length, venueName]);

  if (showRecap && recapCards.length > 0 && me) {
    return (
      <WrappedRecap
        cards={recapCards}
        playerName={me.teamName}
        onClose={() => setShowRecap(false)}
      />
    );
  }

  return (
    <PhaseShell
      isOpen={isOpen}
      onClose={onClose}
      phase="ended"
      title="Leaderboard"
    >
      <div className="space-y-5">
        <div className="text-center">
          <h2
            className="text-2xl font-black text-white"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
          >
            Final Scoreboard
          </h2>
          <p className="text-sm text-white/70">Thanks for playing!</p>
        </div>

        <PodiumLeaderboard
          entries={podiumEntries}
          currentSocialiteId={currentSocialiteId}
        />

        {me && (
          <div
            className="rounded-2xl p-4 space-y-2"
            style={{
              background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.14), rgba(192, 132, 252, 0.14))',
              border: '1px solid rgba(34, 211, 238, 0.3)',
            }}
          >
            <p className="text-center text-xs font-black uppercase tracking-widest text-cyan-200">
              Share your recap
            </p>
            <ShareCardButton
              venueName={venueName}
              teamName={me.teamName}
              rank={me.rank}
              totalPlayers={finalLeaderboard.length}
              score={me.score}
              roundResults={myRoundResults ?? []}
              joinUrl={typeof window !== 'undefined' ? window.location.href : undefined}
              streakWeeks={membershipStreakWeeks}
            />
            <ShareCardPngButton
              stats={{
                totalScore: me.score,
                roundsPlayed: myRoundResults?.length ?? 0,
                correctAnswers: myRoundResults?.filter(r => r.status === 'correct').length ?? 0,
                totalAnswers: myRoundResults?.length ?? 0,
                longestStreak: membershipStreakWeeks ?? 0,
                currentStreak: membershipStreakWeeks ?? 0,
                rankPosition: me.rank,
                totalPlayers: finalLeaderboard.length,
                votesReceived: 0,
                perfectRounds: 0,
              }}
              playerName={me.teamName}
              venueName={venueName}
              correctnessPattern={myRoundResults?.map(r => r.status === 'correct')}
            />
            {recapCards.length > 0 && (
              <button
                type="button"
                onClick={() => setShowRecap(true)}
                className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg"
              >
                ✨ View Your Recap
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onLeave}
          className="w-full text-center text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white/80 transition py-2"
        >
          Leave Sociale
        </button>
      </div>
    </PhaseShell>
  );
}

export default SocialeLeaderboardModal;

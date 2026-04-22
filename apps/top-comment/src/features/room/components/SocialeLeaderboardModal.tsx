import { useMemo } from 'react';
import { PhaseShell } from './shell/PhaseShell';
import { PodiumLeaderboard, type PodiumEntry } from './leaderboard/PodiumLeaderboard';
import { ShareCardButton } from './ShareCardButton';
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
}

export function SocialeLeaderboardModal({
  isOpen,
  onClose,
  finalLeaderboard,
  currentSocialiteId,
  onLeave,
  myRoundResults,
  venueName,
}: SocialeLeaderboardModalProps) {
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
            />
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

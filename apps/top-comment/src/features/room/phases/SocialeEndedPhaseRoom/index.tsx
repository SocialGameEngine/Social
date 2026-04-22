import { motion } from 'framer-motion';
import { useAuth } from '../../../../shared/providers/AuthContext';
import { SaveProgressPrompt } from '../../../auth/SaveProgressPrompt';
import { SplitFlap } from '../../../tv/components/SplitFlap';
import { NearMissBanner } from '../../../tv/components/NearMissBanner';
import type { Sociale } from '../../../../domain/types/sociale.types';
import type { SocialeGameParticipant } from '../../components/layout/SocialeGameButton';
import type { RoomMembership } from '../../../../shared/types';

interface SocialeEndedPhaseRoomProps {
  sociale: Sociale;
  participants: SocialeGameParticipant[];
  memberships?: RoomMembership[] | null;
  onOpenLeaderboard: () => void;
  onOpenSelfie: () => void;
  /** Rank the local user finished at (1-indexed). Drives the near-miss banner. */
  myRank?: number | null;
  /** Points off the podium (if myRank is 4-6). */
  pointGapToPodium?: number | null;
  /** Local player display name for copy. */
  myDisplayName?: string | null;
}

export function SocialeEndedPhaseRoom({
  sociale,
  memberships,
  onOpenLeaderboard,
  onOpenSelfie,
  myRank,
  pointGapToPodium,
  myDisplayName,
}: SocialeEndedPhaseRoomProps) {
  const { user } = useAuth();
  const myMembership = user && memberships ? memberships.find((m) => m.userId === user.id) : null;

  const showNearMiss = myRank != null && myRank >= 4 && myRank <= 6;

  return (
    <div className="w-full mb-8 px-4 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="chaos-room-panel p-5 text-center space-y-3"
        data-phase="ended"
      >
        <span className="chaos-room-eyebrow">
          <span>Sociale complete</span>
        </span>
        <h2
          className="text-2xl sm:text-3xl font-black text-white leading-tight"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
        >
          {myRank === 1
            ? "You took it home."
            : myRank != null && myRank <= 3
            ? 'Podium finish!'
            : 'Good run, friend.'}
        </h2>
        {myRank != null && (
          <div className="inline-flex items-center gap-2 text-white/80">
            <span className="text-xs font-black uppercase tracking-widest opacity-70">Final rank</span>
            <span className="inline-flex items-center gap-1">
              <span className="text-white/60 text-sm">#</span>
              <SplitFlap
                value={String(myRank)}
                length={Math.max(2, String(myRank).length)}
                flipMs={80}
                staggerMs={40}
                charWidthEm={0.65}
                style={{ fontSize: '22px' }}
              />
            </span>
          </div>
        )}
        <p className="text-sm text-white/60">Round {sociale.totalRounds ?? '?'} of {sociale.totalRounds ?? '?'}</p>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="chaos-room-cta px-4 text-sm"
            style={{ ['--chaos-room-accent-rgb' as any]: 'var(--chaos-room-phase-ended-rgb)' }}
          >
            Leaderboard
          </button>
          <button
            type="button"
            onClick={onOpenSelfie}
            className="chaos-room-cta px-4 text-sm"
            style={{ ['--chaos-room-accent-rgb' as any]: 'var(--chaos-room-phase-reveal-rgb)' }}
          >
            Recap selfie
          </button>
        </div>
      </motion.div>

      <NearMissBanner
        playerName={myDisplayName}
        pointGap={pointGapToPodium ?? null}
        visible={showNearMiss}
      />

      <SaveProgressPrompt membershipId={myMembership?.id} />
    </div>
  );
}

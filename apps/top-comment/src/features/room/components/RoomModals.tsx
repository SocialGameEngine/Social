import { lazy, Suspense, useMemo } from 'react';
import { useRoundResponses, useMyResponses } from '../../../features/sociale/hooks/useSocialeResponses';
import { useSocialites } from '../../../features/sociale/hooks/useSocialites';
import { useSocialeRounds } from '../../../features/sociale/hooks/useSocialeRounds';
import type { RoundResult } from '../utils/shareCard';
import type { Session } from '../../../shared/types';
import type { RoomMembership } from '../../../shared/types';

const SocialeLeaderboardModal = lazy(() => import('./SocialeLeaderboardModal.tsx'));
const SelfieModal = lazy(() => import('./SelfieModal.tsx'));
const SocialeAnswerModal = lazy(() => import('./SocialeAnswerModal.tsx'));
const SocialeVoteModal = lazy(() => import('./SocialeVoteModal.tsx'));

export interface SocialeModalContext {
  socialeId: string;
  roundId: string;
  prompt: string;
  roundIndex: number;
  roundType?: string;
  roundSettings?: any; // Add round settings for MC/written answer
  phaseEndsAt?: string | null;
  phaseStartedAt?: string | null;
  voteSeconds?: number;
  paused: boolean;
  // P2-4: Ghost mode flag for late joiners
  isGhostMode?: boolean;
}

export interface RoomModalsProps {
  state: {
    endedModals: Array<'leaderboard' | 'selfie'>;
    activeModal: string | null;
    socialeModalContext?: SocialeModalContext; // Add Sociale modal context
  };
  /**
   * Kept purely for metadata (venueName). Wave R7 removed the session-mode
   * modal fallbacks so this is no longer used to render UI.
   */
  session: Session | null;
  memberships: RoomMembership[] | null;
  userId: string | undefined;
  currentSocialeId?: string;
  closeEndedModal: (modal: 'leaderboard' | 'selfie') => void;
  closeModal: () => void;
  markSubmitted: (type: 'answer' | 'vote') => void;
  handleLeaveRoom: () => void;
  /** P1-17: host-broadcasted toggle for "Lock it in" confirmation step. */
  requireLockIn?: boolean;
  /** P1-5: forwarded to SocialeAnswerModal for typing broadcasts. */
  roomId?: string | null;
}

export function RoomModals({
  state,
  session,
  memberships,
  userId,
  currentSocialeId,
  closeEndedModal,
  closeModal,
  markSubmitted,
  handleLeaveRoom,
  requireLockIn = false,
  roomId = null,
}: RoomModalsProps) {
  const { data: socialites = [] } = useSocialites(currentSocialeId);
  const currentSocialiteId = socialites.find(s => s.userId === userId)?.id;

  const { data: socialeVoteResponses = [] } = useRoundResponses(
    state.socialeModalContext?.socialeId,
    state.activeModal === 'vote' ? state.socialeModalContext?.roundId : undefined
  );

  // Leaderboard share-card grid — per-round outcome for the local user.
  const leaderboardOpen = state.endedModals.includes('leaderboard');
  const { data: myResponses = [] } = useMyResponses(
    leaderboardOpen ? currentSocialeId : undefined,
    leaderboardOpen ? currentSocialiteId : undefined,
  );
  const { data: allRounds = [] } = useSocialeRounds(
    leaderboardOpen ? currentSocialeId : undefined,
  );

  const myRoundResults: RoundResult[] = useMemo(() => {
    if (!leaderboardOpen) return [];
    const sorted = [...allRounds].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    return sorted.map((round) => {
      const response = myResponses.find((r) => r.roundId === round.id);
      if (!response) return { status: 'wrong' as const };
      if (response.isCorrect === true) return { status: 'correct' as const };
      if (typeof response.scoreAwarded === 'number' && response.scoreAwarded > 0) {
        return { status: 'close' as const };
      }
      return { status: 'wrong' as const };
    });
  }, [leaderboardOpen, allRounds, myResponses]);

  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="h-12 w-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    }>
      {state.endedModals.includes('leaderboard') && currentSocialeId && socialites.length > 0 && (
        <SocialeLeaderboardModal
          isOpen={true}
          onClose={() => closeEndedModal('leaderboard')}
          membershipStreakWeeks={
            memberships?.find((m) => m.userId === userId)?.currentStreak ?? null
          }
          finalLeaderboard={[...socialites]
            .filter(s => s.isActive && !s.isBanned)
            .sort((a, b) => b.score - a.score)
            .map((s, i) => ({
              id: s.id,
              teamName: s.displayName || 'Player',
              score: s.score,
              rank: i + 1,
              mascotId: s.mascotId,
            }))}
          currentSocialiteId={currentSocialiteId}
          onLeave={handleLeaveRoom}
          myRoundResults={myRoundResults}
          venueName={session?.venueName}
        />
      )}
      {state.endedModals.includes('selfie') && (
        <SelfieModal
          isOpen={true}
          onClose={() => closeEndedModal('selfie')}
          currentMembership={memberships?.find(m => m.userId === userId)}
          finalLeaderboard={memberships?.map((m, i) => ({ 
            ...m,
            rank: i + 1,
          })) || []}
          venueName={session?.venueName}
        />
      )}

      {state.activeModal === 'answer' && state.socialeModalContext && (
        <SocialeAnswerModal
          isOpen={true}
          onClose={() => closeModal()}
          socialeId={state.socialeModalContext.socialeId}
          roundId={state.socialeModalContext.roundId}
          roundIndex={state.socialeModalContext.roundIndex}
          roundType={state.socialeModalContext.roundType}
          prompt={state.socialeModalContext.prompt}
          roundSettings={state.socialeModalContext.roundSettings}
          onSubmit={() => {
            markSubmitted('answer');
            closeModal();
          }}
          endsAt={state.socialeModalContext.phaseEndsAt}
          startedAt={state.socialeModalContext.phaseStartedAt}
          paused={state.socialeModalContext.paused}
          requireLockIn={requireLockIn}
          roomId={roomId}
          // P2-4: Pass ghost mode flag
          isGhostMode={state.socialeModalContext.isGhostMode}
        />
      )}

      {state.activeModal === 'vote' && state.socialeModalContext && (
        <SocialeVoteModal
          isOpen={true}
          onClose={() => closeModal()}
          socialeId={state.socialeModalContext.socialeId}
          roundId={state.socialeModalContext.roundId}
          responses={socialeVoteResponses}
          onSubmit={() => {
            markSubmitted('vote');
            closeModal();
          }}
          prompt={state.socialeModalContext.prompt}
          endsAt={state.socialeModalContext.phaseEndsAt}
          startedAt={state.socialeModalContext.phaseStartedAt}
          voteSeconds={state.socialeModalContext.voteSeconds}
          paused={state.socialeModalContext.paused}
          // P2-4: Pass ghost mode flag
          isGhostMode={state.socialeModalContext.isGhostMode}
        />
      )}

    </Suspense>
  );
}

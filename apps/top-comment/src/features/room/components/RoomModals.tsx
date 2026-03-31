import { lazy, Suspense } from 'react';
import { useRoundResponses } from '../../../features/sociale/hooks/useSocialeResponses';
import type { Session } from '../../../shared/types';
import type { RoomMembership } from '../../../shared/types';

const LeaderboardModal = lazy(() => import('./LeaderboardModal.tsx'));
const SelfieModal = lazy(() => import('./SelfieModal.tsx'));
const AnswerModal = lazy(() => import('./AnswerModal.tsx'));
const SessionVoteModal = lazy(() => import('./VoteModal.tsx'));
const SocialeAnswerModal = lazy(() => import('./SocialeAnswerModal.tsx'));
const SocialeVoteModal = lazy(() => import('./SocialeVoteModal.tsx'));

export interface SocialeModalContext {
  socialeId: string;
  roundId: string;
  prompt: string;
  roundIndex: number;
  phaseEndsAt?: string | null;
  paused: boolean;
}

interface RoomModalsProps {
  state: {
    endedModals: Array<'leaderboard' | 'selfie'>;
    activeModal: string | null;
  };
  session: Session | null;
  sessionId: string | null;
    memberships: RoomMembership[] | null;
  userId: string | undefined;
  closeEndedModal: (modal: 'leaderboard' | 'selfie') => void;
  closeModal: () => void;
  markSubmitted: (type: 'answer' | 'vote') => void;
  handleLeaveRoom: () => void;
  /** When set, answer/vote modals use Sociale flows instead of session modals */
  socialeModalContext?: SocialeModalContext | null;
}

export function RoomModals({
  state,
  session,
  sessionId,
  memberships,
  userId,
  closeEndedModal,
  closeModal,
  markSubmitted,
  handleLeaveRoom,
  socialeModalContext = null,
}: RoomModalsProps) {
  const { data: socialeVoteResponses = [] } = useRoundResponses(
    socialeModalContext?.socialeId,
    state.activeModal === 'vote' ? socialeModalContext?.roundId : undefined
  );

  return (
    <Suspense fallback={null}>
      {state.endedModals.includes('leaderboard') && (
        <LeaderboardModal
          isOpen={true}
          onClose={() => closeEndedModal('leaderboard')}
          finalLeaderboard={memberships?.map((m, i) => ({
            id: m.id,
            teamName: m.playerName || 'Unknown', // Map playerName to teamName for UI
            score: 0, // Will be populated from session data
            rank: i + 1,
            mascotId: m.mascotId,
          })) || []}
          currentMembershipId={memberships?.find(m => m.userId === userId)?.id}
          onLeave={handleLeaveRoom}
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

      {state.activeModal === 'answer' && socialeModalContext && (
        <SocialeAnswerModal
          isOpen={true}
          onClose={() => closeModal()}
          socialeId={socialeModalContext.socialeId}
          roundId={socialeModalContext.roundId}
          roundIndex={socialeModalContext.roundIndex}
          prompt={socialeModalContext.prompt}
          onSubmit={() => {
            markSubmitted('answer');
            closeModal();
          }}
          endsAt={socialeModalContext.phaseEndsAt}
          paused={socialeModalContext.paused}
        />
      )}

      {state.activeModal === 'answer' && !socialeModalContext && session && sessionId && (
        <AnswerModal
          isOpen={true}
          onClose={() => closeModal()}
          sessionId={sessionId}
          roundIndex={session.roundIndex || 0}
          prompt={session.rounds?.[session.roundIndex || 0]?.groups?.[0]?.prompt || ''}
          onSubmit={() => {
            markSubmitted('answer');
            closeModal();
          }}
          endsAt={session.endsAt}
          paused={session.paused}
        />
      )}

      {state.activeModal === 'vote' && socialeModalContext && (
        <SocialeVoteModal
          isOpen={true}
          onClose={() => closeModal()}
          socialeId={socialeModalContext.socialeId}
          roundId={socialeModalContext.roundId}
          responses={socialeVoteResponses}
          onSubmit={() => {
            markSubmitted('vote');
            closeModal();
          }}
          prompt={socialeModalContext.prompt}
          endsAt={socialeModalContext.phaseEndsAt}
          paused={socialeModalContext.paused}
        />
      )}

      {state.activeModal === 'vote' && !socialeModalContext && session && sessionId && (
        <SessionVoteModal
          isOpen={true}
          onClose={() => closeModal()}
          sessionId={sessionId}
          roundIndex={session.roundIndex || 0}
          answers={[]}
          onSubmit={() => {
            markSubmitted('vote');
            closeModal();
          }}
          prompt={session.rounds?.[session.roundIndex || 0]?.groups?.[0]?.prompt || ''}
          endsAt={session.endsAt}
          paused={session.paused}
        />
      )}
    </Suspense>
  );
}

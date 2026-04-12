import { lazy, Suspense } from 'react';
import { useRoundResponses } from '../../../features/sociale/hooks/useSocialeResponses';
import { useSocialites } from '../../../features/sociale/hooks/useSocialites';
import type { Session } from '../../../shared/types';
import type { RoomMembership } from '../../../shared/types';

const LeaderboardModal = lazy(() => import('./LeaderboardModal.tsx'));
const SocialeLeaderboardModal = lazy(() => import('./SocialeLeaderboardModal.tsx'));
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
  roundType?: string;
  roundSettings?: any; // Add round settings for MC/written answer
  phaseEndsAt?: string | null;
  paused: boolean;
}

export interface RoomModalsProps {
  state: {
    endedModals: Array<'leaderboard' | 'selfie'>;
    activeModal: string | null;
    socialeModalContext?: SocialeModalContext; // Add Sociale modal context
  };
  session: Session | null;
  sessionId: string | null;
  memberships: RoomMembership[] | null;
  userId: string | undefined;
  currentSocialeId?: string;
  closeEndedModal: (modal: 'leaderboard' | 'selfie') => void;
  closeModal: () => void;
  markSubmitted: (type: 'answer' | 'vote') => void;
  handleLeaveRoom: () => void;
}

export function RoomModals({
  state,
  session,
  sessionId,
  memberships,
  userId,
  currentSocialeId,
  closeEndedModal,
  closeModal,
  markSubmitted,
  handleLeaveRoom,
}: RoomModalsProps) {
  const { data: socialites = [] } = useSocialites(currentSocialeId);
  const currentSocialiteId = socialites.find(s => s.userId === userId)?.id;

  const { data: socialeVoteResponses = [] } = useRoundResponses(
    state.socialeModalContext?.socialeId,
    state.activeModal === 'vote' ? state.socialeModalContext?.roundId : undefined
  );

  return (
    <Suspense fallback={null}>
      {state.endedModals.includes('leaderboard') && (
        currentSocialeId && socialites.length > 0 ? (
          <SocialeLeaderboardModal
            isOpen={true}
            onClose={() => closeEndedModal('leaderboard')}
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
          />
        ) : (
          <LeaderboardModal
            isOpen={true}
            onClose={() => closeEndedModal('leaderboard')}
            finalLeaderboard={memberships?.map((m, i) => ({
              id: m.id,
              teamName: m.playerName || 'Unknown',
              score: 0,
              rank: i + 1,
              mascotId: m.mascotId,
            })) || []}
            currentMembershipId={memberships?.find(m => m.userId === userId)?.id}
            onLeave={handleLeaveRoom}
          />
        )
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
          paused={state.socialeModalContext.paused}
        />
      )}

      {state.activeModal === 'answer' && !state.socialeModalContext && session && sessionId && (
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
          paused={state.socialeModalContext.paused}
        />
      )}

      {state.activeModal === 'vote' && !state.socialeModalContext && session && sessionId && (
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

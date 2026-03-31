import { lazy, Suspense } from 'react';
import type { SocialeLeaderboardTeam } from './SocialeLeaderboardModal';

const SocialeLeaderboardModal = lazy(() => import('./SocialeLeaderboardModal.tsx'));
const SocialeSelfieModal = lazy(() => import('./SocialeSelfieModal.tsx'));
const SocialeAnswerModal = lazy(() => import('./SocialeAnswerModal.tsx'));
const SocialeVoteModal = lazy(() => import('./SocialeVoteModal.tsx'));

interface SocialeModalsProps {
  state: {
    endedModals: Array<'leaderboard' | 'selfie'>;
    activeModal: string | null;
  };
  sociale: any; // TODO: Import proper Sociale type
  socialeId: string | null;
  currentRound: any; // TODO: Import proper SocialeRound type
  responses: any[]; // TODO: Import proper SocialeResponse[]
  votes: any[]; // TODO: Import proper SocialeVote[]
  currentSocialiteId?: string;
  closeEndedModal: (modal: 'leaderboard' | 'selfie') => void;
  closeModal: () => void;
  markSubmitted: (type: 'answer' | 'vote') => void;
  handleLeaveSociale: () => void;
}

export function SocialeModals({
  state,
  sociale,
  socialeId,
  currentRound,
  responses,
  votes,
  currentSocialiteId,
  closeEndedModal,
  closeModal,
  markSubmitted,
  handleLeaveSociale,
}: SocialeModalsProps) {
  return (
    <Suspense fallback={null}>
      {state.endedModals.includes('leaderboard') && (
        <SocialeLeaderboardModal
          isOpen={true}
          onClose={() => closeEndedModal('leaderboard')}
          finalLeaderboard={responses?.map((r, i) => ({
            id: r.id,
            teamName: r.socialiteDisplayName || 'Unknown', // Map socialite display name to teamName
            score: r.scoreAwarded || 0,
            rank: i + 1,
            mascotId: r.mascotId,
          })) || []}
          currentSocialiteId={currentSocialiteId}
          onLeave={handleLeaveSociale}
        />
      )}
      {state.endedModals.includes('selfie') && (
        <SocialeSelfieModal
          isOpen={true}
          onClose={() => closeEndedModal('selfie')}
          currentSocialite={responses?.find(r => r.socialiteId === currentSocialiteId) ? {
            id: currentSocialiteId || '',
            teamName: responses.find(r => r.socialiteId === currentSocialiteId)?.socialiteDisplayName || 'Unknown',
            score: responses.find(r => r.socialiteId === currentSocialiteId)?.scoreAwarded || 0,
            rank: 1, // TODO: Calculate actual rank
            mascotId: responses.find(r => r.socialiteId === currentSocialiteId)?.mascotId,
          } : null}
          finalLeaderboard={responses?.map((r, i) => ({ 
            ...r,
            teamName: r.socialiteDisplayName || 'Unknown',
            rank: i + 1,
          })) || []}
          venueName={sociale?.title}
        />
      )}

      {state.activeModal === 'answer' && sociale && socialeId && currentRound && (
        <SocialeAnswerModal
          isOpen={true}
          onClose={() => closeModal()}
          socialeId={socialeId}
          roundId={currentRound.id}
          roundIndex={currentRound.orderIndex || 0}
          prompt={currentRound.content || ''}
          onSubmit={() => {
            markSubmitted('answer');
            closeModal();
          }}
          endsAt={sociale.phaseEndsAt}
          paused={sociale.status === 'paused'}
        />
      )}

      {state.activeModal === 'vote' && sociale && socialeId && currentRound && (
        <SocialeVoteModal
          isOpen={true}
          onClose={() => closeModal()}
          socialeId={socialeId}
          roundId={currentRound.id}
          responses={responses}
          onSubmit={() => {
            markSubmitted('vote');
            closeModal();
          }}
          prompt={currentRound.content}
          endsAt={sociale.phaseEndsAt}
          paused={sociale.status === 'paused'}
        />
      )}
    </Suspense>
  );
}

import { lazy, Suspense, useState } from 'react';
import { PhaseCardButton } from '../../components/PhaseCardButton';
import { useTeams, useAnswers } from '../../../session/hooks';
import type { Session, RoomMembership } from '../../../../shared/types';

const VoteModal = lazy(() => import('../../components/VoteModal.tsx'));

interface VotePhaseProps {
  session: Session;
  sessionId: string;
  memberships: RoomMembership[] | null;
  hasSubmitted: boolean;
  onSubmit: () => void;
}

export function VotePhase({ session, sessionId, hasSubmitted, onSubmit }: VotePhaseProps) {
  const [showModal, setShowModal] = useState(false);
  const teams = useTeams(sessionId);
  const answers = useAnswers(sessionId, session.roundIndex);

  const handleSubmit = () => {
    onSubmit();
    setShowModal(false);
  };

  return (
    <div className="w-full mb-8">
      <PhaseCardButton
        phase="vote"
        hasSubmitted={hasSubmitted}
        onClick={() => setShowModal(true)}
        disabled={false}
        endsAt={session.endsAt}
        paused={session.paused}
        prompt={session.rounds?.[session.roundIndex || 0]?.groups?.[0]?.prompt || ''}
      />

      <Suspense fallback={null}>
        {showModal && (
          <VoteModal
            isOpen={true}
            onClose={() => setShowModal(false)}
            sessionId={sessionId}
            roundIndex={session.roundIndex || 0}
            answers={answers}
            teams={teams}
            onSubmit={handleSubmit}
            prompt={session.rounds?.[session.roundIndex || 0]?.groups?.[0]?.prompt || ''}
            endsAt={session.endsAt}
            paused={session.paused}
          />
        )}
      </Suspense>
    </div>
  );
}

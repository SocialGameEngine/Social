import { lazy, Suspense, useState } from 'react';
import { PhaseCardButton } from '../../components/PhaseCardButton';
import type { Session, RoomMembership } from '../../../../shared/types';

const AnswerModal = lazy(() => import('../../components/AnswerModal.tsx'));

interface AnswerPhaseProps {
  session: Session;
  sessionId: string;
  memberships: RoomMembership[] | null;
  hasSubmitted: boolean;
  onSubmit: () => void;
}

export function AnswerPhase({ session, sessionId, hasSubmitted, onSubmit }: AnswerPhaseProps) {
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = () => {
    onSubmit();
    setShowModal(false);
  };

  return (
    <div className="w-full mb-8">
      <PhaseCardButton
        phase="answer"
        hasSubmitted={hasSubmitted}
        onClick={() => setShowModal(true)}
        disabled={false}
        endsAt={session.endsAt}
        paused={session.paused}
        prompt={session.rounds?.[session.roundIndex || 0]?.groups?.[0]?.prompt || ''}
      />

      <Suspense fallback={null}>
        {showModal && (
          <AnswerModal
            isOpen={true}
            onClose={() => setShowModal(false)}
            sessionId={sessionId}
            roundIndex={session.roundIndex || 0}
            prompt={session.rounds?.[session.roundIndex || 0]?.groups?.[0]?.prompt || ''}
            onSubmit={handleSubmit}
            endsAt={session.endsAt}
            paused={session.paused}
          />
        )}
      </Suspense>
    </div>
  );
}

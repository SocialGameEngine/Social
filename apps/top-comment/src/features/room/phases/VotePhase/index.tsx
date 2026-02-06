import { PhaseCardButton } from '../../components/PhaseCardButton';
import type { Session, RoomMembership } from '../../../../shared/types';

interface VotePhaseProps {
  session: Session;
  sessionId: string;
  memberships: RoomMembership[] | null;
  hasSubmitted: boolean;
  onSubmit: () => void;
  onOpenModal?: (type: 'answer' | 'vote') => void;
}

export function VotePhase({ session, hasSubmitted, onOpenModal }: VotePhaseProps) {
  const handleClick = () => {
    if (onOpenModal) {
      onOpenModal('vote');
    }
  };

  return (
    <div className="w-full mb-8">
      <PhaseCardButton
        phase="vote"
        hasSubmitted={hasSubmitted}
        onClick={handleClick}
        disabled={false}
        endsAt={session.endsAt}
        paused={session.paused}
        prompt={session.rounds?.[session.roundIndex || 0]?.groups?.[0]?.prompt || ''}
      />
    </div>
  );
}

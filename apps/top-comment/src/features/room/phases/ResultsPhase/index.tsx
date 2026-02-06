import { PhaseCardButton } from '../../components/PhaseCardButton';
import type { Session, RoomMembership } from '../../../../shared/types';

interface ResultsPhaseProps {
  session: Session;
  memberships: RoomMembership[] | null;
}

export function ResultsPhase({ session }: ResultsPhaseProps) {
  return (
    <div className="w-full mb-8">
      <PhaseCardButton
        phase="results"
        hasSubmitted={false}
        onClick={() => {}}
        disabled={false}
        endsAt={session.endsAt}
        paused={session.paused}
        prompt={session.rounds?.[session.roundIndex || 0]?.groups?.[0]?.prompt || ''}
      />
    </div>
  );
}

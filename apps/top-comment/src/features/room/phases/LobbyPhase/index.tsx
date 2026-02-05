import { PhaseCardButton } from '../../components/PhaseCardButton';
import type { Session, RoomMembership } from '../../../../shared/types';

interface LobbyPhaseProps {
  session: Session | null;
  memberships: RoomMembership[] | null;
}

export function LobbyPhase(_props: LobbyPhaseProps) {
  return (
    <div className="w-full mb-8">
      <PhaseCardButton
        phase="lobby"
        hasSubmitted={false}
        onClick={() => {}}
        disabled={true}
        prompt="Waiting for host to start..."
      />
    </div>
  );
}

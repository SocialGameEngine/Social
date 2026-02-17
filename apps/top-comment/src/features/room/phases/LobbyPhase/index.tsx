import { PhaseButton } from '../../components/PhaseButton';
import type { Session, RoomMembership } from '../../../../shared/types';

interface LobbyPhaseProps {
  session: Session | null;
  memberships: RoomMembership[] | null;
}

export function LobbyPhase({ session: _session, memberships: _memberships }: LobbyPhaseProps) {
  const handleStartSession = () => {
    // TODO: Implement session start logic
    console.log('Starting session...');
  };

  return (
    <div className="w-full mb-8">
      <PhaseButton 
        phase="lobby"
        hasSubmitted={false}
        onClick={handleStartSession}
        disabled={false}
      />
    </div>
  );
}

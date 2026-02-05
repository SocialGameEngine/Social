import { PhaseCardButton } from '../../components/PhaseCardButton';
import type { Session, RoomMembership } from '../../../../shared/types';

interface EndedPhaseProps {
  session: Session;
  memberships: RoomMembership[] | null;
  onOpenLeaderboard: () => void;
  onOpenSelfie: () => void;
}

export function EndedPhase({ onOpenLeaderboard, onOpenSelfie }: EndedPhaseProps) {
  return (
    <div className="w-full mb-8 space-y-4">
      <PhaseCardButton
        phase="ended"
        hasSubmitted={false}
        onClick={onOpenLeaderboard}
        disabled={false}
        prompt="View Final Results"
      />
      <PhaseCardButton
        phase="ended"
        hasSubmitted={false}
        onClick={onOpenSelfie}
        disabled={false}
        prompt="Take a Selfie"
      />
    </div>
  );
}

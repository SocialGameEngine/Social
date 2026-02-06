import { PhaseController } from '../PhaseController';
import type { Session, RoomMembership } from '../../../../shared/types';

interface SessionPanelProps {
  session: Session | null;
  sessionId: string | null;
  memberships: RoomMembership[] | null;
  onOpenLeaderboard: () => void;
  onOpenSelfie: () => void;
  onOpenModal?: (type: 'answer' | 'vote') => void;
  isSticky?: boolean;
}

export function SessionPanel({
  session,
  sessionId,
  memberships,
  onOpenLeaderboard,
  onOpenSelfie,
  onOpenModal,
  isSticky = false,
}: SessionPanelProps) {
  return (
    <div
      className={`relative z-10 w-full max-w-2xl mx-auto ${
        isSticky ? 'sticky top-0 backdrop-blur-sm' : ''
      }`}
    >
      <div className="p-4">
        <PhaseController
          session={session}
          sessionId={sessionId}
          memberships={memberships}
          onOpenLeaderboard={onOpenLeaderboard}
          onOpenSelfie={onOpenSelfie}
          onOpenModal={onOpenModal}
        />
      </div>
    </div>
  );
}

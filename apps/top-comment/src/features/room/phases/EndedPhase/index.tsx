import { SessionButton } from '../../components/layout/SessionButton';
import { SessionTimer } from '@social/ui';
import { usePhaseTimer } from '../../../../shared/hooks';
import { getIsMainEventMode } from '../../components/PhaseController';
import type { Session, RoomMembership } from '../../../../shared/types';

interface EndedPhaseProps {
  session: Session;
  memberships: RoomMembership[] | null;
  onOpenLeaderboard: () => void;
  onOpenSelfie: () => void;
}

export function EndedPhase({ session, memberships, onOpenLeaderboard, onOpenSelfie }: EndedPhaseProps) {
  const isMainEventMode = getIsMainEventMode(session);
  const { totalSeconds } = usePhaseTimer({ session });
  
  return (
    <div className="w-full mb-8 space-y-4">
      <SessionButton
        displayState="ended"
        session={session}
        isMainEventMode={isMainEventMode}
        phase="ended"
        onClick={onOpenLeaderboard}
      />
      <SessionButton
        displayState="idle"
        session={session}
        isMainEventMode={false}
        phase="ended"
        onClick={onOpenSelfie}
      />
      <SessionTimer
        endTime={session?.endsAt}
        totalSeconds={totalSeconds}
        paused={true}
        variant="neutral"
        isDark={false}
        position="inline"
        showCriticalBar={false}
      />
    </div>
  );
}

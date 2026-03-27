import { SessionButton } from '../../components/layout/SessionButton';
import { SessionTimer } from '@social/ui';
import { usePhaseTimer } from '../../../../shared/hooks';
import { getIsMainEventMode } from '../../components/PhaseController';
import type { Session, RoomMembership } from '../../../../shared/types';

interface ResultsPhaseProps {
  session: Session;
  memberships: RoomMembership[] | null;
}

export function ResultsPhase({ session, memberships }: ResultsPhaseProps) {
  const isMainEventMode = getIsMainEventMode(session);
  const { totalSeconds } = usePhaseTimer({ session });
  
  return (
    <div className="w-full mb-8">
      <SessionButton
        displayState="results"
        session={session}
        isMainEventMode={isMainEventMode}
        phase="results"
        onClick={() => {}}
      />
      <SessionTimer
        endTime={session?.endsAt}
        totalSeconds={totalSeconds}
        paused={!session?.endsAt || session?.status === 'ended' || (!session?.endsAt ? false : new Date() >= new Date(session.endsAt))}
        variant="brand"
        isDark={false}
        position="inline"
        showCriticalBar={true}
      />
    </div>
  );
}

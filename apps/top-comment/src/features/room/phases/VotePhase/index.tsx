import { SessionButton } from '../../components/layout/SessionButton';
import { SessionTimer } from '@social/ui';
import { usePhaseTimer } from '../../../../shared/hooks';
import { getIsMainEventMode } from '../../components/PhaseController';
import type { Session } from '../../../../shared/types';

interface VotePhaseProps {
  session: Session;
  sessionId: string;
  hasSubmitted: boolean;
  onSubmit: () => void;
  onOpenModal?: (type: 'answer' | 'vote') => void;
}

export function VotePhase({ session, hasSubmitted, onOpenModal }: VotePhaseProps) {
  const isMainEventMode = getIsMainEventMode(session);
  const { totalSeconds } = usePhaseTimer({ session });
  
  const handleClick = () => {
    if (onOpenModal) {
      onOpenModal('vote');
    }
  };

  return (
    <div className="w-full mb-8">
      <SessionButton
        displayState={hasSubmitted ? "joined" : "vote"}
        session={session}
        isMainEventMode={isMainEventMode}
        phase="vote"
        onClick={handleClick}
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

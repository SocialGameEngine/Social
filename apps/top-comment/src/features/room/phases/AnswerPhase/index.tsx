import { SessionButton } from '../../components/layout/SessionButton';
import { SessionTimer } from '@social/ui';
import { usePhaseTimer } from '../../../../shared/hooks';
import { getIsMainEventMode } from '../../components/PhaseController';
import type { Session } from '../../../../shared/types';

interface AnswerPhaseProps {
  session: Session;
  sessionId: string;
  hasSubmitted: boolean;
  onSubmit: () => void;
  onOpenModal?: (type: 'answer' | 'vote') => void;
}

export function AnswerPhase({ session, hasSubmitted, onOpenModal }: AnswerPhaseProps) {
  const isMainEventMode = getIsMainEventMode(session);
  const { totalSeconds } = usePhaseTimer({ session });
  
  const handleClick = () => {
    if (onOpenModal) {
      onOpenModal('answer');
    }
  };

  return (
    <div className="w-full mb-8">
      <SessionButton
        displayState={hasSubmitted ? "joined" : "answer"}
        session={session}
        isMainEventMode={isMainEventMode}
        phase="answer"
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

import { LobbyPhase } from '../phases/LobbyPhase';
import { AnswerPhase } from '../phases/AnswerPhase';
import { VotePhase } from '../phases/VotePhase';
import { ResultsPhase } from '../phases/ResultsPhase';
import { EndedPhase } from '../phases/EndedPhase';
import { getSessionPhase } from '../utils/phaseConfig';
import { useSubmissions } from '../hooks/useSubmissions';
import type { Session, RoomMembership } from '../../../shared/types';

interface PhaseControllerProps {
  session: Session | null;
  sessionId: string | null;
  memberships: RoomMembership[] | null;
  onOpenLeaderboard: () => void;
  onOpenSelfie: () => void;
  onOpenModal?: (type: 'answer' | 'vote') => void;
  onOpenTopics?: () => void;
  onOpenPolls?: () => void;
}

export function PhaseController({
  session,
  sessionId,
  memberships,
  onOpenLeaderboard,
  onOpenSelfie,
  onOpenModal,
  onOpenTopics,
  onOpenPolls,
}: PhaseControllerProps) {
  const phase = getSessionPhase(session);
  const { submissions, markSubmitted } = useSubmissions(session?.id || null, phase);

  switch (phase) {
    case 'lobby':
      return (
        <LobbyPhase
          session={session}
          memberships={memberships}
          onOpenTopics={onOpenTopics}
          onOpenPolls={onOpenPolls}
        />
      );

    case 'answer':
      if (!session || !sessionId) return null;
      return (
        <AnswerPhase
          session={session}
          sessionId={sessionId}
          memberships={memberships}
          hasSubmitted={submissions.answer}
          onSubmit={() => markSubmitted('answer')}
          onOpenModal={onOpenModal}
        />
      );

    case 'vote':
      if (!session || !sessionId) return null;
      return (
        <VotePhase
          session={session}
          sessionId={sessionId}
          memberships={memberships}
          hasSubmitted={submissions.vote}
          onSubmit={() => markSubmitted('vote')}
          onOpenModal={onOpenModal}
        />
      );

    case 'results':
      if (!session) return null;
      return <ResultsPhase session={session} memberships={memberships} />;

    case 'ended':
      if (!session) return null;
      return (
        <EndedPhase
          session={session}
          memberships={memberships}
          onOpenLeaderboard={onOpenLeaderboard}
          onOpenSelfie={onOpenSelfie}
        />
      );

    default:
      return (
        <LobbyPhase
          session={session}
          memberships={memberships}
          onOpenTopics={onOpenTopics}
          onOpenPolls={onOpenPolls}
        />
      );
  }
}

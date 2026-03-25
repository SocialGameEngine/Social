import { InteractionTypeButton } from './InteractionTypeButton';
import { SkeletonGrid } from '../../../../shared/components/SkeletonGrid';

interface InteractionsGridProps {
  onOpenPolls: () => void;
  onOpenTopics: () => void;
  onOpenPrompts: () => void;
  onOpenFibbage: () => void;
  pollsCount?: number;
  topicsCount?: number;
  promptsCount?: number;
  fibbageCount?: number;
  pollsParticipants?: number;
  topicsParticipants?: number;
  promptsParticipants?: number;
  fibbageParticipants?: number;
  isLoading?: boolean;
}

export function InteractionsGrid({
  onOpenPolls,
  onOpenTopics,
  onOpenPrompts,
  onOpenFibbage,
  pollsCount = 0,
  topicsCount = 0,
  promptsCount = 0,
  fibbageCount = 0,
  pollsParticipants = 0,
  topicsParticipants = 0,
  promptsParticipants = 0,
  fibbageParticipants = 0,
  isLoading = false,
}: InteractionsGridProps) {
  if (isLoading) {
    return <SkeletonGrid count={4} />;
  }

  return (
    <div className="px-4 pb-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
        Dailies
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <InteractionTypeButton
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V13a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 1 2 2h2a2 2 0 0 1 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
            </svg>
          }
          label="Polls"
          count={pollsCount}
          variant="interaction"
          onClick={onOpenPolls}
          participantCount={pollsParticipants}
        />
        <InteractionTypeButton
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
          label="Topics"
          count={topicsCount}
          variant="interaction"
          onClick={onOpenTopics}
          participantCount={topicsParticipants}
        />
        <InteractionTypeButton
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
          label="Prompts"
          count={promptsCount}
          variant="interaction"
          onClick={onOpenPrompts}
          participantCount={promptsParticipants}
        />
        <InteractionTypeButton
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          label="Fibbage"
          count={fibbageCount}
          variant="interaction"
          onClick={onOpenFibbage}
          participantCount={fibbageParticipants}
        />
      </div>
    </div>
  );
}

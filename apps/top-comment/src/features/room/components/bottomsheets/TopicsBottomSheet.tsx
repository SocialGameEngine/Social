import { InteractionListBottomSheet } from './InteractionListBottomSheet';
import { TopicModal } from '../interactions/TopicModal';
import type { Interaction } from '../../../../domain/types/interaction.types';

interface TopicsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Interaction[];
  membershipId?: string;
}

export function TopicsBottomSheet({
  isOpen,
  onClose,
  topics,
  membershipId,
}: TopicsBottomSheetProps) {
  return (
    <InteractionListBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Topics"
      emptyIcon="💬"
      emptyTitle="No topics currently posted"
      emptyDescription="Check back later for discussion topics from the host"
      items={topics}
      getItemId={(topic) => topic.id}
      renderListItem={(topic, onSelect) => (
        <button
          onClick={onSelect}
          className="w-full chaos-interaction-card px-4 py-4 text-left"
        >
          <div className="font-bold text-lg mb-1">{topic.question}</div>
          {topic.description && (
            <div className="text-sm opacity-80">{topic.description}</div>
          )}
        </button>
      )}
      renderDetailView={(topic, onBack) => (
        <div>
          <button
            onClick={onBack}
            className="px-6 py-3 text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to Topics</span>
          </button>
          <TopicModal
            isOpen={true}
            onClose={onBack}
            interaction={topic}
            membershipId={membershipId || ''}
          />
        </div>
      )}
    />
  );
}

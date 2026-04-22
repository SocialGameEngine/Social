import { InteractionListBottomSheet } from './InteractionListBottomSheet';
import { PollModal } from '../interactions/PollModal';
import type { Interaction } from '../../../../domain/types/interaction.types';

interface PollsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  polls: Interaction[];
  membershipId?: string;
  onJoinRoom?: () => void;
}

export function PollsBottomSheet({
  isOpen,
  onClose,
  polls,
  membershipId,
  onJoinRoom,
}: PollsBottomSheetProps) {
  return (
    <InteractionListBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Polls"
      accent="vote"
      eyebrow="Tap to vote"
      emptyIcon="📊"
      emptyTitle="No polls currently posted"
      emptyDescription="Check back later for new polls from the host"
      items={polls}
      getItemId={(poll) => poll.id}
      renderListItem={(poll, onSelect) => (
        <button onClick={onSelect} className="chaos-room-sheet-item">
          <div className="title">{poll.question}</div>
          {poll.description && <div className="subtitle">{poll.description}</div>}
        </button>
      )}
      renderDetailView={(poll, onBack) => (
        <div>
          <button
            onClick={onBack}
            className="px-6 py-3 text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to Polls</span>
          </button>
          <PollModal
            interaction={poll}
            membershipId={membershipId}
            isOpen={true}
            onClose={onBack}
            onJoinRoom={onJoinRoom}
          />
        </div>
      )}
    />
  );
}

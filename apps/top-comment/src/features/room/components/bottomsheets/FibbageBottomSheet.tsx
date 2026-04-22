import { InteractionListBottomSheet } from './InteractionListBottomSheet';
import { HeadlineRespondModal } from '../interactions/HeadlineRespondModal';
import type { Interaction, RoomMembership } from '../../../../shared/types';

interface FibbageBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  fibbageGames: Interaction[];
  membership: RoomMembership | null;
}

export function FibbageBottomSheet({
  isOpen,
  onClose,
  fibbageGames,
  membership,
}: FibbageBottomSheetProps) {
  return (
    <InteractionListBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Fibbage"
      accent="answer"
      eyebrow="Write a lie they'll fall for"
      emptyIcon="🎭"
      emptyTitle="No fibbage games currently posted"
      emptyDescription="Check back later for headline fibbage games from the host"
      items={fibbageGames}
      getItemId={(game) => game.id}
      renderListItem={(game, onSelect) => (
        <button onClick={onSelect} className="chaos-room-sheet-item">
          <div className="title">{game.question}</div>
          {game.description && <div className="subtitle">{game.description}</div>}
        </button>
      )}
      renderDetailView={(game, onBack) => (
        <div>
          <button
            onClick={onBack}
            className="px-6 py-3 text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to Fibbage</span>
          </button>
          <HeadlineRespondModal
            isOpen={true}
            onClose={onBack}
            interaction={game}
            membership={membership}
          />
        </div>
      )}
    />
  );
}

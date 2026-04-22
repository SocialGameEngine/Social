import { InteractionListBottomSheet } from './InteractionListBottomSheet';
import { RespondModal } from '../interactions/RespondModal';
import type { Interaction } from '../../../../domain/types/interaction.types';

interface PromptsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: Interaction[];
  onSubmitResponse: (interactionId: string, text: string) => Promise<void>;
}

export function PromptsBottomSheet({
  isOpen,
  onClose,
  prompts,
  onSubmitResponse,
}: PromptsBottomSheetProps) {
  return (
    <InteractionListBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Prompts"
      accent="answer"
      eyebrow="Short, sharp responses"
      emptyIcon="💡"
      emptyTitle="No prompts currently posted"
      emptyDescription="Check back later for prompts from the host"
      items={prompts}
      getItemId={(prompt) => prompt.id}
      renderListItem={(prompt, onSelect) => (
        <button onClick={onSelect} className="chaos-room-sheet-item">
          <div className="title">{prompt.question}</div>
          {prompt.description && <div className="subtitle">{prompt.description}</div>}
        </button>
      )}
      renderDetailView={(prompt, onBack) => (
        <div>
          <button
            onClick={onBack}
            className="px-6 py-3 text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to Prompts</span>
          </button>
          <RespondModal
            isOpen={true}
            onClose={onBack}
            question={prompt.question}
            onSubmit={(text) => onSubmitResponse(prompt.id, text)}
          />
        </div>
      )}
    />
  );
}

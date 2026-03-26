import { InteractionListBottomSheet } from './InteractionListBottomSheet';
import { TriviaModal } from '../interactions/TriviaModal';
import type { Interaction } from '../../../../domain/types/interaction.types';

interface TriviaBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  trivia: Interaction[];
  membershipId?: string;
}

export function TriviaBottomSheet({ isOpen, onClose, trivia, membershipId }: TriviaBottomSheetProps) {
  return (
    <InteractionListBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Trivia"
      items={trivia}
      emptyIcon="🧠"
      emptyTitle="No trivia questions available"
      emptyDescription="Check back later for brain-teasing questions!"
      getItemId={(triviaItem) => triviaItem.id}
      renderListItem={(triviaItem, onSelect) => (
        <button
          onClick={onSelect}
          className="w-full chaos-interaction-card px-4 py-4 text-left"
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">🧠</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg mb-1 line-clamp-2">
                {(triviaItem.settings as any)?.snapshot?.prompt || triviaItem.question}
              </h3>
              <div className="flex items-center gap-3 mt-2 text-xs opacity-80">
                <span>{(triviaItem.settings as any)?.snapshot?.categoryKey || 'General'}</span>
                <span className="text-yellow-500">
                  {(triviaItem.settings as any)?.snapshot?.difficulty || 'medium'}
                </span>
                <span>{triviaItem.responseCount} answers</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  triviaItem.status === 'active' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : triviaItem.status === 'results'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}>
                  {triviaItem.status === 'active' ? 'Answer Now' : 
                   triviaItem.status === 'results' ? 'View Results' : 'Closed'}
                </span>
              </div>
            </div>
          </div>
        </button>
      )}
      renderDetailView={(triviaItem, onBack) => (
        <div>
          <button
            onClick={onBack}
            className="px-6 py-3 text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to Trivia</span>
          </button>
          <TriviaModal
            interaction={triviaItem}
            membershipId={membershipId || null}
            isOpen={true}
            onClose={onBack}
          />
        </div>
      )}
    />
  );
}

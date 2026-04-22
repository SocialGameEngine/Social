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
      accent="answer"
      eyebrow="Pick the right answer"
      items={trivia}
      emptyIcon="🧠"
      emptyTitle="No trivia questions available"
      emptyDescription="Check back later for brain-teasing questions!"
      getItemId={(triviaItem) => triviaItem.id}
      renderListItem={(triviaItem, onSelect) => (
        <button onClick={onSelect} className="chaos-room-sheet-item">
          <div className="flex items-start gap-3">
            <div className="text-2xl leading-none">🧠</div>
            <div className="flex-1 min-w-0">
              <div className="title line-clamp-2">
                {(triviaItem.settings as any)?.snapshot?.prompt || triviaItem.question}
              </div>
              <div className="meta">
                <span>{(triviaItem.settings as any)?.snapshot?.categoryKey || 'General'}</span>
                <span>·</span>
                <span className="text-amber-300">
                  {(triviaItem.settings as any)?.snapshot?.difficulty || 'medium'}
                </span>
                <span>·</span>
                <span>{triviaItem.responseCount} answers</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-[0.18em] px-2 py-0.5 rounded-full ${
                    triviaItem.status === 'active'
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : triviaItem.status === 'results'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                  }`}
                >
                  {triviaItem.status === 'active'
                    ? 'Answer now'
                    : triviaItem.status === 'results'
                      ? 'View results'
                      : 'Closed'}
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

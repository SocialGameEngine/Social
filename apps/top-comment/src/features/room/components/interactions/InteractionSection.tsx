import { lazy, Suspense, useState, useCallback, useMemo } from 'react';
import { useInteractions } from '../../../../hooks/useInteractions';
import { useAuth } from '../../../../shared/providers/AuthContext';
import { interactionService } from '../../../../services/interactionService';
import { InteractionCard } from './InteractionCard';
import type { Interaction, RoomMembership, Room } from '../../../../shared/types';

const SendPromptModal = lazy(() => import('./SendPromptModal'));
const RespondModal = lazy(() => import('./RespondModal'));
const ResponsesDrawer = lazy(() => import('./ResponsesDrawer'));

interface InteractionSectionProps {
  room: Room | null;
  memberships: RoomMembership[] | null;
  hasActiveSession: boolean;
}

export function InteractionSection({
  room,
  memberships,
  hasActiveSession,
}: InteractionSectionProps) {
  const { user } = useAuth();
  const { interactions, createInteraction, closeInteraction } = useInteractions({
    roomId: room?.id,
  });

  const [showSendModal, setShowSendModal] = useState(false);
  const [respondingTo, setRespondingTo] = useState<Interaction | null>(null);
  const [viewingResponses, setViewingResponses] = useState<Interaction | null>(null);
  const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());

  const myMembership = useMemo(
    () => memberships?.find((m) => m.userId === user?.id) ?? null,
    [memberships, user?.id]
  );

  const isHost = myMembership?.isHost ?? false;
  const activeMemberCount = useMemo(
    () => memberships?.filter((m) => !m.isBanned).length ?? 0,
    [memberships]
  );

  const handleSendPrompt = useCallback(
    async (question: string, description?: string) => {
      await createInteraction(question, description);
    },
    [createInteraction]
  );

  const handleCloseInteraction = useCallback(
    async (interactionId: string) => {
      await closeInteraction(interactionId);
      setViewingResponses(null);
    },
    [closeInteraction]
  );

  const handleSubmitResponse = useCallback(
    async (interactionId: string, text: string) => {
      if (!myMembership) return;
      await interactionService.submitResponse(interactionId, myMembership.id, text);
      setRespondedIds((prev) => new Set(prev).add(interactionId));
    },
    [myMembership]
  );

  if (!room) return null;

  const showEmptyState = interactions.length === 0 && !hasActiveSession;

  return (
    <div
      className={`relative z-10 w-full max-w-2xl mx-auto mb-8`}
    >
      <div className="p-4">
      {showEmptyState ? (
        /* Empty State — matches PhaseCardButton disabled style */
        <button
          onClick={isHost ? () => setShowSendModal(true) : undefined}
          disabled={!isHost}
          className="w-full chaos-interaction-card px-3 py-6 sm:py-8 shadow-xl border-2 border-black/80 transform transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[100px] sm:min-h-[120px]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-shrink-0 w-16 sm:w-20">
              <span className="text-sm sm:text-base font-black uppercase tracking-wider text-black/70">
                Prompt
              </span>
              <div className="mt-1">
                <span className="text-black/40 font-black text-base">--</span>
              </div>
            </div>
            <div className="flex-1 min-w-0 text-center px-2">
              <p className="text-base sm:text-lg font-medium text-black/60">
                {isHost ? 'Tap to send a quick prompt' : 'Waiting for host...'}
              </p>
            </div>
            <div className="flex-shrink-0 w-12 sm:w-16 text-right flex flex-col items-end justify-center">
              {isHost && (
                <svg className="w-8 h-8 text-black/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          </div>
        </button>
      ) : (
        /* Active Interactions */
        <div className="space-y-3">
          {interactions.map((interaction) => (
            <InteractionCard
              key={interaction.id}
              interaction={interaction}
              isHost={isHost}
              hasResponded={respondedIds.has(interaction.id)}
              memberCount={activeMemberCount}
              onRespond={() => setRespondingTo(interaction)}
              onViewResponses={() => setViewingResponses(interaction)}
              onClose={() => handleCloseInteraction(interaction.id)}
            />
          ))}

          {isHost && (
            <button
              onClick={() => setShowSendModal(true)}
              className="w-full chaos-interaction-card px-3 py-4 shadow-xl border-2 border-black/80 transform transition-transform hover:scale-[1.02] active:scale-[0.98] opacity-60"
            >
              <p className="text-sm sm:text-base font-black text-black/60">
                + Send Another Prompt
              </p>
            </button>
          )}
        </div>
      )}

      <Suspense fallback={null}>
        {showSendModal && (
          <SendPromptModal
            isOpen={true}
            onClose={() => setShowSendModal(false)}
            onSend={handleSendPrompt}
          />
        )}

        {respondingTo && (
          <RespondModal
            isOpen={true}
            onClose={() => setRespondingTo(null)}
            question={respondingTo.question}
            onSubmit={(text) => handleSubmitResponse(respondingTo.id, text)}
          />
        )}

        {viewingResponses && (
          <ResponsesDrawer
            isOpen={true}
            onClose={() => setViewingResponses(null)}
            interaction={viewingResponses}
            onCloseInteraction={() => handleCloseInteraction(viewingResponses.id)}
            onSendAnother={() => {
              setViewingResponses(null);
              setShowSendModal(true);
            }}
          />
        )}
      </Suspense>
      </div>
    </div>
  );
}

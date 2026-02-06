import { lazy, Suspense, useState, useCallback } from 'react';
import { useInteractions } from '../../../hooks/useInteractions';
import { useTheme } from '../../../shared/providers/ThemeProvider';
import { Button, Card } from '@social/ui';
import type { Interaction, RoomMembership } from '../../../shared/types';

const SendPromptModal = lazy(() => import('../../room/components/interactions/SendPromptModal'));
const ResponsesDrawer = lazy(() => import('../../room/components/interactions/ResponsesDrawer'));

interface HostInteractionManagerProps {
  room: { id: string; code: string };
  memberships: RoomMembership[] | null;
}

export function HostInteractionManager({ room, memberships }: HostInteractionManagerProps) {
  const { isDark } = useTheme();
  const { interactions, createInteraction, closeInteraction } = useInteractions({ roomId: room.id });
  const [showSendModal, setShowSendModal] = useState(false);
  const [viewingResponses, setViewingResponses] = useState<Interaction | null>(null);

  const activeMemberCount = memberships?.filter((m) => !m.isBanned).length ?? 0;

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

  return (
    <Card className="flex flex-col gap-4" isDark={isDark}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className={`flex flex-col gap-1 ${!isDark ? 'text-slate-700' : 'text-cyan-100'}`}>
          <span className={`text-xs font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>
            Quick Prompts
          </span>
          <p className={`text-sm ${!isDark ? 'text-slate-500' : 'text-cyan-300'}`}>
            {interactions.length === 0
              ? 'Send a prompt to engage your room'
              : `${interactions.length} active prompt${interactions.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setShowSendModal(true)}
        >
          Send Prompt
        </Button>
      </div>

      {/* Active Interactions */}
      {interactions.length > 0 && (
        <div className="space-y-2">
          {interactions.map((interaction) => (
            <div
              key={interaction.id}
              className={`rounded-lg border px-3 py-3 ${!isDark ? 'border-slate-200 bg-slate-50' : 'border-slate-600 bg-slate-700'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${!isDark ? 'text-slate-900' : 'text-white'}`}>
                    {interaction.question}
                  </p>
                  <div className={`flex items-center gap-3 mt-1.5 text-xs ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span>{interaction.responseCount}/{activeMemberCount} responses</span>
                    <span>{getTimeAgo(interaction.createdAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setViewingResponses(interaction)}
                  >
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCloseInteraction(interaction.id)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          ))}
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
    </Card>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

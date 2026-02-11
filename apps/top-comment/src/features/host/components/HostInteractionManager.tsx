import { lazy, Suspense, useState, useCallback } from 'react';
import { useInteractions } from '../../../hooks/useInteractions';
import { useTheme } from '../../../shared/providers/ThemeProvider';
import { Button, Card } from '@social/ui';
import { interactionService } from '../../../services/interactionService';
import type { Interaction, RoomMembership } from '../../../shared/types';

const SendPromptModal = lazy(() => import('../../room/components/interactions/SendPromptModal'));
const SendHeadlineModal = lazy(() => import('../../room/components/interactions/SendHeadlineModal'));
const ResponsesDrawer = lazy(() => import('../../room/components/interactions/ResponsesDrawer'));

interface HostInteractionManagerProps {
  room: { id: string; code: string };
  memberships: RoomMembership[] | null;
}

export function HostInteractionManager({ room, memberships }: HostInteractionManagerProps) {
  const { isDark } = useTheme();
  const { interactions, createInteraction, closeInteraction } = useInteractions({ roomId: room.id });
  const [showSendModal, setShowSendModal] = useState(false);
  const [showHeadlineModal, setShowHeadlineModal] = useState(false);
  const [viewingResponses, setViewingResponses] = useState<Interaction | null>(null);

  const activeMemberCount = memberships?.filter((m) => !m.isBanned).length ?? 0;

  const handleSendPrompt = useCallback(
    async (question: string, description?: string) => {
      await createInteraction(question, description);
    },
    [createInteraction]
  );

  const handleSendHeadline = useCallback(
    async (params: {
      headlineId: string;
      headlineBlank: string;
      sourceName: string;
      publishedAt: string;
      answerSeconds?: number;
      votingSeconds?: number;
    }) => {
      await interactionService.createHeadlineInteraction({
        roomId: room.id,
        ...params,
      });
    },
    [room.id]
  );

  const handleCloseInteraction = useCallback(
    async (interactionId: string) => {
      await closeInteraction(interactionId);
      setViewingResponses(null);
    },
    [closeInteraction]
  );

  const handleStartVoting = useCallback(
    async (interactionId: string) => {
      await interactionService.advanceToVoting(interactionId, 300);
    },
    []
  );

  const handleShowResults = useCallback(
    async (interactionId: string) => {
      await interactionService.advanceToResults(interactionId);
    },
    []
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
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowHeadlineModal(true)}
          >
            🎭 Fibbage
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowSendModal(true)}
          >
            Send Prompt
          </Button>
        </div>
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
                    {interaction.type === 'headline_fibbage' 
                      ? `🎭 ${(interaction.settings as any)?.headlineBlank || interaction.question}`
                      : interaction.question
                    }
                  </p>
                  {interaction.type === 'headline_fibbage' && (
                    <p className={`text-xs ${!isDark ? 'text-slate-500' : 'text-slate-400'} mt-1`}>
                      {(interaction.settings as any)?.sourceName} • {(interaction.settings as any)?.publishedAt ? new Date((interaction.settings as any).publishedAt).toLocaleDateString() : ''}
                    </p>
                  )}
                  <div className={`flex items-center gap-3 mt-1.5 text-xs ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span>{interaction.responseCount}/{activeMemberCount} {interaction.type === 'headline_fibbage' ? 'lies' : 'responses'}</span>
                    {interaction.status === 'voting' && <span>{interaction.voteCount} votes</span>}
                    <span>{getTimeAgo(interaction.createdAt)}</span>
                    <span className={`font-bold ${
                      interaction.status === 'voting' ? 'text-cyan-600' : 
                      interaction.status === 'results' ? 'text-cyan-600' :
                      interaction.status === 'closed' ? 'text-gray-600' : 'text-green-600'
                    }`}>
                      {interaction.status === 'voting' ? 'Voting' : 
                       interaction.status === 'results' ? 'Results' :
                       interaction.status === 'closed' ? 'Closed' : 
                       interaction.type === 'headline_fibbage' ? 'Lie Submission' : 'Active'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {interaction.status === 'active' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStartVoting(interaction.id)}
                    >
                      Start Voting
                    </Button>
                  )}
                  {interaction.status === 'voting' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleShowResults(interaction.id)}
                    >
                      Show Results
                    </Button>
                  )}
                  {interaction.status === 'results' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setViewingResponses(interaction)}
                    >
                      View Results
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setViewingResponses(interaction)}
                  >
                    {interaction.status === 'voting' ? 'Votes' : 'View'}
                  </Button>
                  {(interaction.status === 'results' || interaction.status === 'voting') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCloseInteraction(interaction.id)}
                    >
                      Close
                    </Button>
                  )}
                  {interaction.status === 'active' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCloseInteraction(interaction.id)}
                    >
                      Close
                    </Button>
                  )}
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

        {showHeadlineModal && (
          <SendHeadlineModal
            isOpen={true}
            onClose={() => setShowHeadlineModal(false)}
            onSubmit={handleSendHeadline}
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

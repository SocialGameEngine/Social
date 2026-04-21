import { lazy, Suspense, useState, useCallback } from 'react';
import { useInteractions } from '../../../hooks/useInteractions';
import { useTheme } from '../../../shared/providers/ThemeProvider';
import { Button } from '@social/ui';
import { interactionService } from '../../../services/interactionService';
import type { Interaction, RoomMembership } from '../../../shared/types';
import type { TriviaInteractionSettings, TopicSortBy } from '../../../domain/types/interaction.types';

const HostSendPromptModal = lazy(() => import('../components/HostSendPromptModal'));
const HostSendHeadlineModal = lazy(() => import('../components/HostSendHeadlineModal'));
const ResponsesDrawer = lazy(() => import('../../room/components/interactions/ResponsesDrawer'));
const HostCreateTopicModal = lazy(() => import('../components/HostCreateTopicModal'));
const HostCreatePollModal = lazy(() => import('../components/HostCreatePollModal'));
const HostCreateTriviaModal = lazy(() => import('../components/HostCreateTriviaModal'));

interface HostInteractionManagerProps {
  room: { id: string; code: string };
  memberships: RoomMembership[] | null;
}

export function HostInteractionManager({ room, memberships }: HostInteractionManagerProps) {
  const { isDark } = useTheme();
  const { interactions, createInteraction, closeInteraction } = useInteractions({ roomId: room.id });
  const [showSendModal, setShowSendModal] = useState(false);
  const [showHeadlineModal, setShowHeadlineModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showTriviaModal, setShowTriviaModal] = useState(false);
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

  const handleCreateTopic = useCallback(
    async (question: string, description?: string, sortBy?: TopicSortBy) => {
      await interactionService.createTopic(room.id, question, description, sortBy);
    },
    [room.id]
  );

  const handleCreatePoll = useCallback(
    async (question: string, options: string[], description?: string) => {
      await interactionService.createPoll(room.id, question, options, description);
    },
    [room.id]
  );

  const handleCreateTrivia = useCallback(
    async (questionId: string, answerSeconds?: number, scoring?: TriviaInteractionSettings['scoring'], policy?: TriviaInteractionSettings['policy']) => {
      await interactionService.createTriviaInteraction({
        roomId: room.id,
        questionId,
        answerSeconds,
        scoring,
        policy,
      });
    },
    [room.id]
  );

  return (
    <div className="flex flex-col gap-4">
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
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowTopicModal(true)}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Topic
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowPollModal(true)}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Poll
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowTriviaModal(true)}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Trivia
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowHeadlineModal(true)}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4" />
            </svg>
            Fibbage
          </Button>
          <Button
            variant="secondary"
            size="sm"
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
                  <div className={`flex items-start gap-2 text-sm ${!isDark ? 'text-slate-700' : 'text-cyan-100'} line-clamp-2`}>
                    {interaction.type === 'headline_fibbage' && (
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4" />
                      </svg>
                    )}
                    {interaction.type === 'trivia' && (
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    )}
                    <span>
                      {interaction.type === 'headline_fibbage'
                        ? (interaction.settings as any)?.headlineBlank || interaction.question
                        : interaction.type === 'trivia'
                        ? (interaction.settings as any)?.snapshot?.prompt || interaction.question
                        : interaction.question
                      }
                    </span>
                  </div>
                  {interaction.type === 'headline_fibbage' && (
                    <p className={`text-xs ${!isDark ? 'text-slate-500' : 'text-slate-400'} mt-1`}>
                      {(interaction.settings as any)?.sourceName} • {(interaction.settings as any)?.publishedAt ? new Date((interaction.settings as any).publishedAt).toLocaleDateString() : ''}
                    </p>
                  )}
                  {interaction.type === 'trivia' && (
                    <p className={`text-xs ${!isDark ? 'text-slate-500' : 'text-slate-400'} mt-1`}>
                      {(interaction.settings as any)?.snapshot?.categoryKey || 'General'} • {(interaction.settings as any)?.snapshot?.difficulty || 'medium'}
                    </p>
                  )}
                  <div className={`flex items-center gap-3 mt-1.5 text-xs ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span>{interaction.responseCount}/{activeMemberCount} {interaction.type === 'headline_fibbage' ? 'lies' : interaction.type === 'trivia' ? 'answers' : 'responses'}</span>
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
                       interaction.type === 'headline_fibbage' ? 'Lie Submission' : 
                       interaction.type === 'trivia' ? 'Answer Phase' :
                       'Active'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {interaction.status === 'active' && (
                    <>
                      {interaction.type === 'trivia' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleShowResults(interaction.id)}
                        >
                          Show Results
                        </Button>
                      ) : interaction.type === 'headline_fibbage' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleStartVoting(interaction.id)}
                        >
                          Start Voting
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleStartVoting(interaction.id)}
                        >
                          Start Voting
                        </Button>
                      )}
                    </>
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
          <HostSendPromptModal
            isOpen={true}
            onClose={() => setShowSendModal(false)}
            onSend={handleSendPrompt}
          />
        )}

        {showHeadlineModal && (
          <HostSendHeadlineModal
            isOpen={true}
            onClose={() => setShowHeadlineModal(false)}
            onSubmit={handleSendHeadline}
          />
        )}

        {showTopicModal && (
          <HostCreateTopicModal
            isOpen={true}
            onClose={() => setShowTopicModal(false)}
            onSubmit={handleCreateTopic}
          />
        )}

        {showPollModal && (
          <HostCreatePollModal
            isOpen={true}
            onClose={() => setShowPollModal(false)}
            onSubmit={handleCreatePoll}
          />
        )}

        {showTriviaModal && (
          <HostCreateTriviaModal
            isOpen={true}
            onClose={() => setShowTriviaModal(false)}
            onSubmit={handleCreateTrivia}
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

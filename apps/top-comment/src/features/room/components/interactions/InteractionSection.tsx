import { lazy, Suspense, useState, useCallback, useMemo, useEffect } from 'react';
import { useInteractions } from '../../../../hooks/useInteractions';
import { useAuth } from '../../../../shared/providers/AuthContext';
import { useVotes } from '../../../../hooks/useVotes';
import { interactionService } from '../../../../services/interactionService';
import { InteractionCard } from './InteractionCard';
import { isCurrentUserModerator } from '../../../../shared/utils/moderatorUtils';
import type { Interaction, InteractionResponse, RoomMembership, Room } from '../../../../shared/types';

const SendPromptModal = lazy(() => import('./SendPromptModal'));
const TriviaResultsLeaderboard = lazy(() => import('./TriviaResultsLeaderboard').then(module => ({ default: module.TriviaResultsLeaderboard })));
const SendHeadlineModal = lazy(() => import('./SendHeadlineModal'));
const RespondModal = lazy(() => import('./RespondModal'));
const VoteModal = lazy(() => import('./VoteModal'));
const ResultsModal = lazy(() => import('./ResultsModal'));
const ResponsesDrawer = lazy(() => import('./ResponsesDrawer'));
const HeadlineRespondModal = lazy(() => import('./HeadlineRespondModal'));
const HeadlineVoteModal = lazy(() => import('./HeadlineVoteModal'));
const HeadlineResultsModal = lazy(() => import('./HeadlineResultsModal'));
const TopicModal = lazy(() => import('./TopicModal'));
const PollModal = lazy(() => import('./PollModal'));
const TriviaModal = lazy(() => import('./TriviaModal'));

interface InteractionSectionProps {
  room: Room | null;
  memberships: RoomMembership[] | null;
  hasActiveSession: boolean;
  session?: any; // Add session prop
}

export function InteractionSection({
  room,
  memberships,
  hasActiveSession,
  session: _session,
}: InteractionSectionProps) {
  const { user } = useAuth();
  const { interactions, createInteraction, closeInteraction } = useInteractions({ roomId: room?.id });

  const [showSendModal, setShowSendModal] = useState(false);
  const [showHeadlineModal, setShowHeadlineModal] = useState(false);
  const [respondingTo, setRespondingTo] = useState<Interaction | null>(null);
  const [respondingToHeadline, setRespondingToHeadline] = useState<Interaction | null>(null);
  const [votingFor, setVotingFor] = useState<Interaction | null>(null);
  const [votingForHeadline, setVotingForHeadline] = useState<Interaction | null>(null);
  const [existingResponse, setExistingResponse] = useState<string | null>(null);
  const [viewingResponses, setViewingResponses] = useState<Interaction | null>(null);
  const [viewingResults, setViewingResults] = useState<Interaction | null>(null);
  const [viewingHeadlineResults, setViewingHeadlineResults] = useState<Interaction | null>(null);
  const [viewingTopic, setViewingTopic] = useState<Interaction | null>(null);
  const [viewingPoll, setViewingPoll] = useState<Interaction | null>(null);
  const [viewingTrivia, setViewingTrivia] = useState<Interaction | null>(null);
  const [viewingTriviaLeaderboard, setViewingTriviaLeaderboard] = useState<Interaction | null>(null);
  
  // Store user's response texts locally by interaction ID
  const [userResponses, setUserResponses] = useState<Map<string, string>>(new Map());
  const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());
  
  // Track recent activity for each interaction
  const [recentActivity, setRecentActivity] = useState<Map<string, boolean>>(new Map());
  
  // Simulate recent activity on interactions (for demo purposes)
  useEffect(() => {
    if (!hasActiveSession) return;
    
    const interval = setInterval(() => {
      // Pick a random interaction to show activity
      if (interactions.length > 0) {
        const randomInteraction = interactions[Math.floor(Math.random() * interactions.length)];
        setRecentActivity(prev => new Map(prev).set(randomInteraction.id, true));
        
        // Clear activity after 3 seconds
        setTimeout(() => {
          setRecentActivity(prev => {
            const newMap = new Map(prev);
            newMap.delete(randomInteraction.id);
            return newMap;
          });
        }, 3000);
      }
    }, 5000); // Every 5 seconds
    
    return () => clearInterval(interval);
  }, [hasActiveSession, interactions]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [votingResponses, setVotingResponses] = useState<InteractionResponse[]>([]);
  const [resultsResponses, setResultsResponses] = useState<InteractionResponse[]>([]);
  const [triviaSubmissionIds, setTriviaSubmissionIds] = useState<Set<string>>(new Set());

  // Load votes for the interaction being voted on
  const { votes } = useVotes({
    interactionId: votingFor?.id,
  });

  // Load responses when opening vote modal
  useEffect(() => {
    if (!votingFor) {
      setVotingResponses([]);
      return;
    }
    interactionService.getResponses(votingFor.id).then(setVotingResponses);
  }, [votingFor]);

  const myMembership = useMemo(
    () => memberships?.find((m) => m.userId === user?.id) ?? null,
    [memberships, user?.id]
  );

  // Clear local response state when interaction phases change
  useEffect(() => {
    // Clear responses for interactions that are no longer in 'active' phase
    interactions.forEach(interaction => {
      if (interaction.status !== 'active') {
        setUserResponses(prev => {
          const newMap = new Map(prev);
          newMap.delete(interaction.id);
          return newMap;
        });
      }
    });
  }, [interactions]);

  // Get existing response from local state when opening respond modal
  useEffect(() => {
    if (!respondingTo) {
      setExistingResponse(null);
      return;
    }
    
    // Get response from local state - no database query needed
    const response = userResponses.get(respondingTo.id);
    setExistingResponse(response || null);
  }, [respondingTo, userResponses]);

  // Load responses when opening results modal
  useEffect(() => {
    if (!viewingResults) {
      setResultsResponses([]);
      return;
    }
    interactionService.getResponses(viewingResults.id).then(setResultsResponses);
  }, [viewingResults]);

  // Load trivia submissions for active interactions
  useEffect(() => {
    const triviaInteractions = interactions.filter(i => i.type === 'trivia' && i.status === 'active');
    
    triviaInteractions.forEach(async (interaction) => {
      try {
        const submission = await interactionService.getTriviaSubmission(interaction.id, myMembership?.id || '');
        if (submission) {
          setTriviaSubmissionIds(prev => new Set(prev).add(interaction.id));
        } else {
          setTriviaSubmissionIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(interaction.id);
            return newSet;
          });
        }
      } catch (error) {
        console.error('Failed to check trivia submission:', error);
      }
    });
  }, [interactions, myMembership]);

  const isModerator = isCurrentUserModerator(room, user);

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
      if (!room?.id) return;
      await interactionService.createHeadlineInteraction({
        roomId: room.id,
        ...params,
      });
    },
    [room?.id]
  );

  const handleSubmitResponse = useCallback(
    async (interactionId: string, text: string) => {
      if (!myMembership) return;
      await interactionService.submitResponse(interactionId, myMembership.id, text);
      setRespondedIds((prev) => new Set(prev).add(interactionId));
      
      // Store response in local state - no database queries needed for editing
      setUserResponses(prev => new Map(prev).set(interactionId, text));
    },
    [myMembership]
  );

  const handleSubmitVote = useCallback(
    async (interactionId: string, responseId: string) => {
      if (!myMembership) return;
      await interactionService.submitVote(interactionId, myMembership.id, responseId);
      setVotedIds((prev) => new Set(prev).add(interactionId));
    },
    [myMembership]
  );

  const handleCloseInteraction = useCallback(
    async (interactionId: string) => {
      try {
        await closeInteraction(interactionId);
      } catch (error) {
        console.error("Failed to close interaction:", error);
      }
    },
    [closeInteraction]
  );

  const handleAutoAdvanceToResults = useCallback(
    async (interactionId: string) => {
      try {
        await interactionService.advanceToResults(interactionId);
        // The hook should automatically refresh, but we might need to trigger it
        // For now, this will update the interaction status in the database
      } catch (error) {
        console.error("Failed to advance to results:", error);
      }
    },
    []
  );

  const hasInteractions = interactions.length > 0;
  const showEmptyHostCard = !hasInteractions && !hasActiveSession && isModerator;

  return (
    <div className="relative z-10 w-2xl mb-8">
      <div className="px-4 pb-4 pt-0 sm:p-4">
        {/* Empty state: only show for host when no interactions */}
        {showEmptyHostCard && (
          <div className="space-y-3">
            <button
              onClick={() => setShowSendModal(true)}
              className="w-full chaos-interaction-card px-3 py-6 sm:py-8 shadow-xl border-2 border-black/80 transform transition-transform hover:scale-[1.02] active:scale-[0.98] min-h-[100px] sm:min-h-[120px]"
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
                    Tap to send a quick prompt
                  </p>
                </div>
                <div className="flex-shrink-0 w-12 sm:w-16 text-right flex flex-col items-end justify-center">
                  <svg className="w-8 h-8 text-black/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setShowHeadlineModal(true)}
              className="w-full chaos-interaction-card px-3 py-6 sm:py-8 shadow-xl border-2 border-purple-500/80 transform transition-transform hover:scale-[1.02] active:scale-[0.98] min-h-[100px] sm:min-h-[120px]"
              style={{ transform: 'rotate(-1deg) scale(0.95)' }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-shrink-0 w-16 sm:w-20">
                  <span className="text-sm sm:text-base font-black uppercase tracking-wider text-purple-700">
                    Fibbage
                  </span>
                  <div className="mt-1">
                    <span className="text-purple-40 font-black text-base">🎭</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0 text-center px-2">
                  <p className="text-base sm:text-lg font-medium text-purple-600">
                    Start a headline fibbage game
                  </p>
                </div>
                <div className="flex-shrink-0 w-12 sm:w-16 text-right flex flex-col items-end justify-center">
                  <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Active/Voting/Results Interactions */}
        {hasInteractions && (
          <div className="space-y-6">
            {interactions
              .filter(interaction => interaction.status === 'active' || interaction.status === 'voting' || interaction.status === 'results')
              .map((interaction) => {
                const hasActed =
                  interaction.status === 'active'
                    ? interaction.type === 'trivia' 
                      ? triviaSubmissionIds.has(interaction.id)
                      : respondedIds.has(interaction.id)
                    : interaction.status === 'voting'
                      ? votedIds.has(interaction.id)
                      : false;

                // All interactions use InteractionCard for consistency
                return (
                  <div
                    key={interaction.id}
                    className={`flex w-full transition-all duration-200 items-center gap-4 ${hasActed ? "justify-end" : "justify-start"}`}
                  >
                    <InteractionCard
                      interaction={interaction}
                      isModerator={isModerator}
                      hasActed={hasActed}
                      hasRecentActivity={recentActivity.get(interaction.id) || false}
                      onRespond={() => {
                        if (interaction.type === 'headline_fibbage') {
                          setRespondingToHeadline(interaction);
                        } else if (interaction.type === 'topic') {
                          setViewingTopic(interaction);
                        } else if (interaction.type === 'poll') {
                          setViewingPoll(interaction);
                        } else if (interaction.type === 'trivia') {
                          setViewingTrivia(interaction);
                        } else {
                          setRespondingTo(interaction);
                        }
                      }}
                      onViewResults={() => {
                        if (interaction.type === 'trivia' && interaction.status === 'results') {
                          setViewingTriviaLeaderboard(interaction);
                        } else {
                          setViewingResults(interaction);
                        }
                      }}
                      onVote={() => {
                        if (interaction.type === 'headline_fibbage') {
                          setVotingForHeadline(interaction);
                        } else {
                          setVotingFor(interaction);
                        }
                      }}
                      onViewResponses={() => setViewingResponses(interaction)}
                                            onAutoAdvanceToResults={handleAutoAdvanceToResults}
                    />
                  </div>
                );
              })}

            {isModerator && (
              <button
                onClick={() => setShowSendModal(true)}
                className="w-full chaos-interaction-card pl-4 pr-2 py-2 shadow-xl border-2 border-black/80 transform transition-all hover:scale-[1.04] active:scale-[0.96] opacity-60"
                style={{ transform: 'rotate(2deg) scale(0.9)' }}
              >
                <p className="text-sm sm:text-base font-black text-black/60">
                  + Send Another Prompt
                </p>
              </button>
            )}
          </div>
        )}

        {/* Results Section (Host Only) */}
        {isModerator && interactions.some(i => i.status === 'results') && (
          <div className="mt-6">
            <h3 className="text-lg font-black text-black mb-3">📊 Results</h3>
            <div className="space-y-6">
              {interactions
                .filter(interaction => interaction.status === 'results')
                .map((interaction) => (
                <InteractionCard
                  key={interaction.id}
                  interaction={interaction}
                  isModerator={isModerator}
                  hasActed={interaction.type === 'trivia' ? triviaSubmissionIds.has(interaction.id) : respondedIds.has(interaction.id) || votedIds.has(interaction.id)}
                  hasRecentActivity={recentActivity.get(interaction.id) || false}
                  onRespond={() => setRespondingTo(interaction)}
                  onVote={() => setVotingFor(interaction)}
                  onViewResponses={() => setViewingResponses(interaction)}
                  onViewResults={() => {
                    if (interaction.type === 'headline_fibbage') {
                      setViewingHeadlineResults(interaction);
                    } else if (interaction.type === 'trivia') {
                      setViewingTrivia(interaction);
                    } else {
                      setViewingResults(interaction);
                    }
                  }}
                  onAutoAdvanceToResults={handleAutoAdvanceToResults}
                />
              ))}
            </div>
          </div>
        )}

        {/* Modals */}
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

          {respondingTo && (
            <RespondModal
              isOpen={true}
              onClose={() => setRespondingTo(null)}
              question={respondingTo.question}
              onSubmit={(text) => handleSubmitResponse(respondingTo.id, text)}
              existingResponse={existingResponse || undefined}
            />
          )}

          {respondingToHeadline && (
            <HeadlineRespondModal
              isOpen={true}
              onClose={() => setRespondingToHeadline(null)}
              interaction={respondingToHeadline}
              membership={myMembership}
            />
          )}

          {votingFor && (
          <VoteModal
            isOpen={true}
            onClose={() => setVotingFor(null)}
            interaction={votingFor}
            responses={votingResponses}
            myVote={votes.find(v => v.membershipId === myMembership?.id) || null}
            onSubmitVote={(responseId) => handleSubmitVote(votingFor.id, responseId)}
          />
        )}

        {votingForHeadline && (
          <HeadlineVoteModal
            isOpen={true}
            onClose={() => setVotingForHeadline(null)}
            interaction={votingForHeadline}
            membership={myMembership}
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

          {viewingResults && (
            <ResultsModal
              isOpen={true}
              onClose={() => setViewingResults(null)}
              interaction={viewingResults}
              responses={resultsResponses}
            />
          )}

          {viewingHeadlineResults && (
            <HeadlineResultsModal
              isOpen={true}
              onClose={() => setViewingHeadlineResults(null)}
              interaction={viewingHeadlineResults}
              membership={myMembership}
            />
          )}

          {viewingTopic && (
            <TopicModal
              isOpen={true}
              onClose={() => setViewingTopic(null)}
              interaction={viewingTopic}
              membershipId={myMembership?.id}
            />
          )}

          {viewingPoll && (
            <PollModal
              isOpen={true}
              onClose={() => setViewingPoll(null)}
              interaction={viewingPoll}
              membershipId={myMembership?.id}
            />
          )}

          {viewingTrivia && (
            <>
              {console.log('Rendering TriviaModal with interaction:', viewingTrivia)}
              <TriviaModal
                isOpen={true}
                onClose={() => setViewingTrivia(null)}
                interaction={viewingTrivia}
                membershipId={myMembership?.id || null}
              />
            </>
          )}

          {viewingTriviaLeaderboard && (
            <TriviaResultsLeaderboard
              isOpen={true}
              onClose={() => setViewingTriviaLeaderboard(null)}
              interaction={viewingTriviaLeaderboard}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}

// =============================================================================
// SOCIALE PLAYER VIEW
// =============================================================================
// Main component for player-side Sociale experience
// Optimized for mobile and provides player-specific interface

import { useState } from 'react';
import { clsx } from 'clsx';
import { useTheme } from '../../shared/providers/ThemeProvider';
import { Button, Card } from '@social/ui';
import type { Socialite, SocialeResponse, SocialeVote } from '../../domain/types/sociale.types';

interface SocialePlayerViewProps {
  sociale: {
    id: string;
    currentRoundId?: string;
    phaseEndsAt?: string | null;
    currentPhase?: string;
    title?: string;
    description?: string;
    settings: Record<string, any>;
  };
  currentRound?: {
    id: string;
    type: string;
    title?: string | null;
    content?: string | null;
    settings: Record<string, any>;
  } | null;
  currentSocialite: Socialite | null;
  socialites: Socialite[];
  responses: SocialeResponse[];
  votes: SocialeVote[];
  onSubmitResponse: (content: string) => void;
  onSubmitVote: (responseId: string) => void;
  onLeaveSociale: () => void;
  isDark?: boolean;
}

export function SocialePlayerView({
  sociale,
  currentRound,
  currentSocialite,
  socialites,
  responses,
  votes,
  onSubmitResponse,
  onSubmitVote,
  onLeaveSociale,
  isDark: propIsDark
}: SocialePlayerViewProps) {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark ?? themeIsDark;

  // Check if current player is active
  const isActivePlayer = currentSocialite?.isActive && !currentSocialite?.isBanned;
  
  // Check if current player has already responded
  const hasResponded = responses.some(r => r.socialiteId === currentSocialite?.id);
  
  // Check if current player has already voted
  const hasVoted = votes.some(v => v.socialiteId === currentSocialite?.id);

  // Player-specific phase components
  const renderPlayerPhase = () => {
    if (!isActivePlayer) {
      return (
        <Card className="text-center p-8" isDark={isDark}>
          <div className="text-6xl mb-4">🚫</div>
          <h2 className={clsx(
            'text-2xl font-bold mb-2',
            isDark ? 'text-white' : 'text-slate-900'
          )}>
            Not in Game
          </h2>
          <p className={clsx(
            'text-lg mb-6',
            isDark ? 'text-slate-300' : 'text-slate-600'
          )}>
            You're not an active player in this Sociale
          </p>
          <Button onClick={onLeaveSociale} variant="secondary">
            Leave
          </Button>
        </Card>
      );
    }

    // Determine phase and render player-specific version
    // Prefer the canonical DB-backed field so phase switches actually take effect.
    const currentPhase = sociale.currentPhase || 'lobby';
    
    switch (currentPhase) {
      case 'draft':
      case 'lobby':
        return (
          <SocialePlayerLobby
            sociale={sociale}
            currentSocialite={currentSocialite}
            socialites={socialites}
            isDark={isDark}
          />
        );

      case 'answer':
        return (
          <SocialePlayerAnswer
            currentRound={currentRound}
            currentSocialite={currentSocialite}
            hasResponded={hasResponded}
            onSubmitResponse={onSubmitResponse}
            isDark={isDark}
          />
        );

      case 'vote':
        return (
          <SocialePlayerVote
            currentRound={currentRound}
            currentSocialite={currentSocialite}
            responses={responses}
            votes={votes}
            hasVoted={hasVoted}
            onSubmitVote={onSubmitVote}
            isDark={isDark}
          />
        );

      case 'reveal':
        return (
          <SocialePlayerReveal
            currentRound={currentRound}
            currentSocialite={currentSocialite}
            responses={responses}
            votes={votes}
            isDark={isDark}
          />
        );

      case 'results':
        return (
          <SocialePlayerResults
            currentRound={currentRound}
            currentSocialite={currentSocialite}
            responses={responses}
            votes={votes}
            isDark={isDark}
          />
        );

      case 'ended':
        return (
          <SocialePlayerEnded
            sociale={sociale}
            currentSocialite={currentSocialite}
            socialites={socialites}
            onLeaveSociale={onLeaveSociale}
            isDark={isDark}
          />
        );

      default:
        return (
          <Card className="text-center p-8" isDark={isDark}>
            <div className="text-lg">Loading...</div>
          </Card>
        );
    }
  };

  return (
    <div className={clsx(
      'min-h-screen p-4',
      isDark ? 'bg-slate-900' : 'bg-white'
    )}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          {sociale.title && (
            <h1 className={clsx(
              'text-3xl font-bold mb-2',
              isDark ? 'text-white' : 'text-slate-900'
            )}>
              {sociale.title}
            </h1>
          )}
          
          {sociale.description && (
            <p className={clsx(
              'text-lg',
              isDark ? 'text-slate-300' : 'text-slate-600'
            )}>
              {sociale.description}
            </p>
          )}
        </div>

        {/* Player Status */}
        {currentSocialite && (
          <div className={clsx(
            'rounded-lg p-4 text-center',
            isDark 
              ? 'bg-slate-800 border border-slate-700' 
              : 'bg-slate-50 border border-slate-200'
          )}>
            <div className="flex items-center justify-center gap-4">
              <div>
                <div className={clsx(
                  'text-sm font-medium mb-1',
                  isDark ? 'text-slate-400' : 'text-slate-600'
                )}>
                  Playing as
                </div>
                <div className={clsx(
                  'text-xl font-bold',
                  isDark ? 'text-cyan-300' : 'text-cyan-600'
                )}>
                  {currentSocialite.displayName}
                </div>
              </div>
              
              <div className="text-2xl">
                {currentSocialite.mascotId ? '🎭' : '👤'}
              </div>
              
              <div>
                <div className={clsx(
                  'text-sm font-medium mb-1',
                  isDark ? 'text-slate-400' : 'text-slate-600'
                )}>
                  Score
                </div>
                <div className={clsx(
                  'text-2xl font-bold',
                  isDark ? 'text-green-300' : 'text-green-600'
                )}>
                  {currentSocialite.score}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase Content */}
        {renderPlayerPhase()}
      </div>
    </div>
  );
}

// =============================================================================
// PLAYER-SPECIFIC PHASE COMPONENTS
// =============================================================================

// Player Lobby View
function SocialePlayerLobby({
  sociale,
  currentSocialite,
  socialites,
  isDark
}: {
  sociale: any;
  currentSocialite: Socialite | null;
  socialites: Socialite[];
  isDark: boolean;
}) {
  const activePlayers = socialites.filter(s => s.isActive && !s.isBanned);
  
  return (
    <Card className="p-6" isDark={isDark}>
      <div className="text-center space-y-6">
        <div className="text-6xl">🎮</div>
        
        <div>
          <h2 className={clsx(
            'text-2xl font-bold mb-2',
            isDark ? 'text-white' : 'text-slate-900'
          )}>
            Get Ready!
          </h2>
          <p className={clsx(
            'text-lg',
            isDark ? 'text-slate-300' : 'text-slate-600'
          )}>
            The game will start soon
          </p>
        </div>

        <div className={clsx(
          'rounded-lg p-4',
          isDark ? 'bg-slate-800' : 'bg-slate-100'
        )}>
          <div className="text-sm font-medium mb-2">
            Players in Game
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {activePlayers.map(player => (
              <div
                key={player.id}
                className={clsx(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  player.id === currentSocialite?.id
                    ? 'bg-cyan-500 text-white'
                    : isDark
                      ? 'bg-slate-700 text-slate-300'
                      : 'bg-slate-200 text-slate-700'
                )}
              >
                {player.displayName}
              </div>
            ))}
          </div>
        </div>

        <div className="text-sm opacity-75">
          Waiting for the host to start the game...
        </div>
      </div>
    </Card>
  );
}

// Player Answer View — format-aware for trivia (MC + written answer)
function SocialePlayerAnswer({
  currentRound,
  currentSocialite,
  hasResponded,
  onSubmitResponse,
  isDark
}: {
  currentRound: any;
  currentSocialite: Socialite | null;
  hasResponded: boolean;
  onSubmitResponse: (content: string) => void;
  isDark: boolean;
}) {
  const [response, setResponse] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const isTriviaRound = currentRound?.type === 'trivia';
  const triviaFormat = currentRound?.settings?.format;
  const snapshot = currentRound?.settings?.snapshot;
  const validationError = currentRound?.settings?.validationError;
  const isMC = isTriviaRound && triviaFormat === 'multiple_choice';
  const isWrittenAnswer = isTriviaRound && triviaFormat === 'written_answer';

  const handleSubmit = () => {
    if (isMC && selectedOptionId) {
      onSubmitResponse(selectedOptionId);
      setSelectedOptionId(null);
    } else {
      const trimmedResponse = response.trim();
      if (trimmedResponse.length > 0) {
        onSubmitResponse(trimmedResponse);
        setResponse('');
      }
    }
  };

  if (hasResponded) {
    return (
      <Card className="p-6" isDark={isDark}>
        <div className="text-center space-y-4">
          <div className="text-6xl">✅</div>
          <h2 className={clsx(
            'text-2xl font-bold',
            isDark ? 'text-white' : 'text-slate-900'
          )}>
            {isTriviaRound ? 'Answer Submitted!' : 'Response Submitted!'}
          </h2>
          <p className={clsx(
            'text-lg',
            isDark ? 'text-slate-300' : 'text-slate-600'
          )}>
            Waiting for other players to respond...
          </p>
        </div>
      </Card>
    );
  }

  // Show validation error for invalid trivia questions
  if (isTriviaRound && validationError) {
    return (
      <Card className="p-6" isDark={isDark}>
        <div className="text-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <h2 className={clsx(
            'text-xl font-bold',
            isDark ? 'text-red-300' : 'text-red-700'
          )}>
            Invalid Question
          </h2>
          <p className={clsx(
            'text-sm',
            isDark ? 'text-slate-400' : 'text-slate-600'
          )}>
            {validationError}
          </p>
          <p className={clsx(
            'text-xs',
            isDark ? 'text-slate-500' : 'text-slate-500'
          )}>
            The host will skip this round.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6" isDark={isDark}>
      <div className="space-y-6">
        {/* Question prompt */}
        <div className="text-center">
          {currentRound?.title ? (
            <h2 className={clsx(
              'text-2xl font-bold mb-2',
              isDark ? 'text-white' : 'text-slate-900'
            )}>
              {currentRound.title}
            </h2>
          ) : (
            <div className={clsx(
              'text-2xl font-bold mb-2 animate-pulse',
              isDark ? 'text-white' : 'text-slate-900'
            )}>
              Loading prompt...
            </div>
          )}
          
          {currentRound?.content ? (
            <div className={clsx(
              'p-4 rounded-lg text-lg',
              isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'
            )}>
              {currentRound.content}
            </div>
          ) : (
            <div className={clsx(
              'p-8 rounded-lg text-lg text-center animate-pulse',
              isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'
            )}>
              Loading prompt from library...
            </div>
          )}
        </div>

        {/* Multiple choice options */}
        {isMC && snapshot?.multipleChoice?.options ? (
          <div className="space-y-3">
            {snapshot.multipleChoice.options.map((opt: any, i: number) => (
              <button
                key={opt.id}
                onClick={() => setSelectedOptionId(opt.id)}
                className={clsx(
                  'w-full p-4 rounded-lg text-left transition-colors border-2',
                  selectedOptionId === opt.id
                    ? isDark
                      ? 'bg-cyan-900/50 border-cyan-500 text-white'
                      : 'bg-cyan-50 border-cyan-500 text-slate-900'
                    : isDark
                      ? 'bg-slate-800 border-slate-700 text-white hover:border-slate-500'
                      : 'bg-white border-slate-200 text-slate-900 hover:border-slate-400'
                )}
              >
                <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt.text}
              </button>
            ))}
            
            <Button
              onClick={handleSubmit}
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!selectedOptionId}
            >
              {selectedOptionId ? 'Lock In Answer' : 'Select an option'}
            </Button>
          </div>
        ) : (
          /* Written answer or non-trivia text input */
          <div className="space-y-4">
            <label className={clsx(
              'block text-sm font-medium',
              isDark ? 'text-slate-300' : 'text-slate-700'
            )}>
              {isWrittenAnswer ? 'Your Answer' : 'Your Response'}
            </label>
            
            {isWrittenAnswer ? (
              <input
                type="text"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Type your answer..."
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                className={clsx(
                  'w-full p-3 rounded-lg border',
                  'focus:outline-none focus:ring-2 focus:ring-cyan-500',
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                )}
              />
            ) : (
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Type your response here..."
                className={clsx(
                  'w-full p-3 rounded-lg border resize-none',
                  'focus:outline-none focus:ring-2 focus:ring-cyan-500',
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                )}
                rows={4}
              />
            )}
            
            <Button
              onClick={handleSubmit}
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!response.trim()}
            >
              {isWrittenAnswer ? 'Submit Answer' : 'Submit Response'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

// Player Vote View
function SocialePlayerVote({
  currentRound,
  currentSocialite,
  responses,
  votes,
  hasVoted,
  onSubmitVote,
  isDark
}: {
  currentRound: any;
  currentSocialite: Socialite | null;
  responses: SocialeResponse[];
  votes: SocialeVote[];
  hasVoted: boolean;
  onSubmitVote: (responseId: string) => void;
  isDark: boolean;
}) {
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);

  const getVoteCount = (responseId: string) => {
    return votes.filter(v => v.targetResponseId === responseId).length;
  };

  const sortedResponses = [...responses].sort((a, b) => {
    const votesA = getVoteCount(a.id);
    const votesB = getVoteCount(b.id);
    return votesB - votesA;
  });

  if (hasVoted) {
    return (
      <Card className="p-6" isDark={isDark}>
        <div className="text-center space-y-4">
          <div className="text-6xl">🗳️</div>
          <h2 className={clsx(
            'text-2xl font-bold',
            isDark ? 'text-white' : 'text-slate-900'
          )}>
            Vote Cast!
          </h2>
          <p className={clsx(
            'text-lg',
            isDark ? 'text-slate-300' : 'text-slate-600'
          )}>
            Waiting for other players to vote...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6" isDark={isDark}>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className={clsx(
            'text-2xl font-bold mb-2',
            isDark ? 'text-white' : 'text-slate-900'
          )}>
            Vote for the Best Response
          </h2>
          
          {currentRound?.content && (
            <div className={clsx(
              'p-4 rounded-lg text-lg',
              isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'
            )}>
              {currentRound.content}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {sortedResponses.map((response) => {
            const voteCount = getVoteCount(response.id);
            const isSelected = selectedResponse === response.id;
            
            return (
              <div
                key={response.id}
                onClick={() => setSelectedResponse(response.id)}
                className={clsx(
                  'p-4 rounded-lg border cursor-pointer transition-all',
                  'hover:border-cyan-500 hover:shadow-md',
                  isSelected
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                    : isDark
                      ? 'border-slate-700 bg-slate-800'
                      : 'border-slate-200 bg-white'
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className={clsx(
                      'text-lg',
                      isDark ? 'text-white' : 'text-slate-900'
                    )}>
                      {typeof response.value === 'string' ? response.value : JSON.stringify(response.value)}
                    </p>
                  </div>
                  
                  <div className="ml-4 text-center">
                    <div className={clsx(
                      'text-2xl font-bold',
                      isDark ? 'text-cyan-300' : 'text-cyan-600'
                    )}>
                      {voteCount}
                    </div>
                    <div className={clsx(
                      'text-xs',
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    )}>
                      votes
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          onClick={() => selectedResponse && onSubmitVote(selectedResponse)}
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!selectedResponse}
        >
          Cast Vote
        </Button>
      </div>
    </Card>
  );
}

// Player Reveal View
function SocialePlayerReveal({
  currentRound,
  currentSocialite,
  responses,
  votes,
  isDark
}: {
  currentRound: any;
  currentSocialite: Socialite | null;
  responses: SocialeResponse[];
  votes: SocialeVote[];
  isDark: boolean;
}) {
  const getVoteCount = (responseId: string) => {
    if (!Array.isArray(votes)) return 0;
    return votes.filter(v => v && v.targetResponseId === responseId).length;
  };

  // Find the top response for topic rounds
  const topResponse = Array.isArray(responses) && responses.length > 0 
    ? responses.reduce((top, r) => {
        if (!r || !r.id) return top;
        const topVotes = getVoteCount(top.id);
        const rVotes = getVoteCount(r.id);
        return rVotes > topVotes ? r : top;
      }, responses[0])
    : null;

  const topVotes = topResponse ? getVoteCount(topResponse.id) : 0;

  return (
    <Card className="p-6" isDark={isDark}>
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className={clsx(
            'text-2xl font-bold mb-4',
            isDark ? 'text-white' : 'text-slate-900'
          )}>
            {currentRound?.type === 'trivia' ? 'Correct Answer' : 'Most Popular Response'}
          </h2>

          {currentRound?.type === 'trivia' ? (() => {
            const snap = currentRound?.settings?.snapshot;
            let correctText = currentRound?.content || 'No answer available';
            let explanation: string | null = null;

            if (snap && 'multipleChoice' in snap && snap.multipleChoice) {
              const correctOpt = snap.multipleChoice.options?.find(
                (o: any) => o.id === snap.multipleChoice.correctOptionId
              );
              correctText = correctOpt?.text || correctText;
              explanation = snap.explanation || null;
            } else if (snap && 'writtenAnswer' in snap && snap.writtenAnswer) {
              correctText = snap.writtenAnswer.correctAnswer || snap.writtenAnswer.acceptedAnswers?.[0] || correctText;
              explanation = snap.explanation || null;
            }

            return (
              <div className={clsx(
                'p-6 rounded-lg',
                isDark ? 'bg-slate-800' : 'bg-slate-100'
              )}>
                <div className={clsx(
                  'text-xl font-bold',
                  isDark ? 'text-cyan-300' : 'text-cyan-600'
                )}>
                  {correctText}
                </div>
                {explanation && (
                  <div className={clsx(
                    'mt-3 text-sm italic',
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  )}>
                    {explanation}
                  </div>
                )}
              </div>
            );
          })() : topResponse ? (
            <div className={clsx(
              'p-6 rounded-lg',
              isDark ? 'bg-slate-800' : 'bg-slate-100'
            )}>
              <div className={clsx(
                'text-xl font-bold mb-2',
                isDark ? 'text-cyan-300' : 'text-cyan-600'
              )}>
                {typeof topResponse.value === 'string' ? topResponse.value : JSON.stringify(topResponse.value)}
              </div>
              <div className={clsx(
                'text-sm',
                isDark ? 'text-slate-400' : 'text-slate-600'
              )}>
                {topVotes} vote{topVotes !== 1 ? 's' : ''}
              </div>
            </div>
          ) : (
            <div className={clsx(
              'p-6 rounded-lg',
              isDark ? 'bg-slate-800' : 'bg-slate-100'
            )}>
              <div className={clsx(
                'text-lg',
                isDark ? 'text-slate-400' : 'text-slate-600'
              )}>
                No responses to reveal
              </div>
            </div>
          )}
        </div>

        <div className={clsx(
          'text-center text-sm',
          isDark ? 'text-slate-400' : 'text-slate-600'
        )}>
          Get ready for the results...
        </div>
      </div>
    </Card>
  );
}

// Player Results View
function SocialePlayerResults({
  currentRound,
  currentSocialite,
  responses,
  votes,
  isDark
}: {
  currentRound: any;
  currentSocialite: Socialite | null;
  responses: SocialeResponse[];
  votes: SocialeVote[];
  isDark: boolean;
}) {
  const getVoteCount = (responseId: string) => {
    return votes.filter(v => v.targetResponseId === responseId).length;
  };

  const sortedResponses = [...responses].sort((a, b) => {
    const votesA = getVoteCount(a.id);
    const votesB = getVoteCount(b.id);
    return votesB - votesA;
  });

  const winner = sortedResponses[0];
  const playerResponse = responses.find(r => r.socialiteId === currentSocialite?.id);
  const playerVotes = playerResponse ? getVoteCount(playerResponse.id) : 0;

  return (
    <Card className="p-6" isDark={isDark}>
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          
          {winner && (
            <div>
              <h2 className={clsx(
                'text-2xl font-bold mb-2',
                isDark ? 'text-white' : 'text-slate-900'
              )}>
                Round Complete!
              </h2>
              
              <div className={clsx(
                'p-4 rounded-lg',
                isDark ? 'bg-slate-800' : 'bg-slate-100'
              )}>
                <div className="text-lg mb-2">Winner:</div>
                <div className={clsx(
                  'text-xl font-bold',
                  isDark ? 'text-cyan-300' : 'text-cyan-600'
                )}>
                  {typeof winner.value === 'string' ? winner.value : JSON.stringify(winner.value)}
                </div>
                <div className="text-sm mt-1">
                  {getVoteCount(winner.id)} votes
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Player's Performance */}
        <div className={clsx(
          'rounded-lg p-4',
          isDark ? 'bg-slate-800' : 'bg-slate-100'
        )}>
          <div className="text-sm font-medium mb-2">Your Response</div>
          {playerResponse ? (
            <div className="space-y-2">
              <p className={clsx(
                'text-lg',
                isDark ? 'text-white' : 'text-slate-900'
              )}>
                {typeof playerResponse.value === 'string' ? playerResponse.value : JSON.stringify(playerResponse.value)}
              </p>
              <div className={clsx(
                'text-sm',
                isDark ? 'text-slate-400' : 'text-slate-600'
              )}>
                You got {playerVotes} vote{playerVotes !== 1 ? 's' : ''}
              </div>
            </div>
          ) : (
            <p className={clsx(
              'text-sm',
              isDark ? 'text-slate-400' : 'text-slate-600'
            )}>
              You didn't respond this round
            </p>
          )}
        </div>

        {/* All Results */}
        <div className="space-y-3">
          <div className="text-sm font-medium">All Responses</div>
          {sortedResponses.map((response, index) => {
            const voteCount = getVoteCount(response.id);
            const isWinner = index === 0;
            
            return (
              <div
                key={response.id}
                className={clsx(
                  'flex items-center justify-between p-3 rounded-lg',
                  isWinner
                    ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                    : isDark
                      ? 'bg-slate-800'
                      : 'bg-slate-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                    isWinner
                      ? 'bg-amber-400 text-amber-900'
                      : isDark
                        ? 'bg-slate-700 text-slate-300'
                        : 'bg-slate-200 text-slate-700'
                  )}>
                    {index + 1}
                  </div>
                  
                  <p className={clsx(
                    'flex-1',
                    isDark ? 'text-white' : 'text-slate-900'
                  )}>
                    {typeof response.value === 'string' ? response.value : JSON.stringify(response.value)}
                  </p>
                </div>
                
                <div className="text-center">
                  <div className={clsx(
                    'text-lg font-bold',
                    isDark ? 'text-cyan-300' : 'text-cyan-600'
                  )}>
                    {voteCount}
                  </div>
                  <div className={clsx(
                    'text-xs',
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  )}>
                    votes
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center text-sm opacity-75">
          Waiting for the next round...
        </div>
      </div>
    </Card>
  );
}

// Player Ended View
function SocialePlayerEnded({
  sociale,
  currentSocialite,
  socialites,
  onLeaveSociale,
  isDark
}: {
  sociale: any;
  currentSocialite: Socialite | null;
  socialites: Socialite[];
  onLeaveSociale: () => void;
  isDark: boolean;
}) {
  const sortedSocialites = [...socialites]
    .filter(s => s.isActive && !s.isBanned)
    .sort((a, b) => b.score - a.score);
  
  const playerRank = sortedSocialites.findIndex(s => s.id === currentSocialite?.id) + 1;
  const winner = sortedSocialites[0];

  return (
    <Card className="p-6" isDark={isDark}>
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          
          <h2 className={clsx(
            'text-2xl font-bold mb-2',
            isDark ? 'text-white' : 'text-slate-900'
          )}>
            Game Complete!
          </h2>
          
          {sociale.title && (
            <p className={clsx(
              'text-lg',
              isDark ? 'text-slate-300' : 'text-slate-600'
            )}>
              {sociale.title}
            </p>
          )}
        </div>

        {/* Winner */}
        {winner && (
          <div className={clsx(
            'text-center p-6 rounded-lg',
            isDark 
              ? 'bg-gradient-to-br from-amber-900/50 to-amber-800/30 border border-amber-400/30' 
              : 'bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200'
          )}>
            <div className="text-6xl mb-2">👑</div>
            <h3 className={clsx(
              'text-xl font-bold mb-1',
              isDark ? 'text-amber-300' : 'text-amber-600'
            )}>
              {winner.displayName}
            </h3>
            <p className={clsx(
              'text-lg',
              isDark ? 'text-amber-200' : 'text-amber-700'
            )}>
              Winner with {winner.score} points!
            </p>
          </div>
        )}

        {/* Your Performance */}
        {currentSocialite && (
          <div className={clsx(
            'rounded-lg p-4',
            isDark ? 'bg-slate-800' : 'bg-slate-100'
          )}>
            <div className="text-center">
              <div className="text-sm font-medium mb-2">Your Final Score</div>
              <div className={clsx(
                'text-4xl font-bold mb-2',
                isDark ? 'text-cyan-300' : 'text-cyan-600'
              )}>
                {currentSocialite.score}
              </div>
              <div className={clsx(
                'text-sm',
                isDark ? 'text-slate-400' : 'text-slate-600'
              )}>
                {playerRank} of {sortedSocialites.length} place
              </div>
            </div>
          </div>
        )}

        {/* Final Leaderboard */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-center">Final Scores</div>
          {sortedSocialites.map((socialite, index) => {
            const isCurrentPlayer = socialite.id === currentSocialite?.id;
            const isWinner = index === 0;
            
            return (
              <div
                key={socialite.id}
                className={clsx(
                  'flex items-center justify-between p-3 rounded-lg',
                  isCurrentPlayer
                    ? 'bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800'
                    : isWinner
                      ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                      : isDark
                        ? 'bg-slate-800'
                        : 'bg-slate-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                    isWinner
                      ? 'bg-amber-400 text-amber-900'
                      : isCurrentPlayer
                        ? 'bg-cyan-400 text-cyan-900'
                        : isDark
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-slate-200 text-slate-700'
                  )}>
                    {index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <div className={clsx(
                      'font-medium',
                      isDark ? 'text-white' : 'text-slate-900'
                    )}>
                      {socialite.displayName}
                    </div>
                    {socialite.isHost && (
                      <div className={clsx(
                        'text-xs',
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      )}>
                        Host
                      </div>
                    )}
                  </div>
                </div>
                
                <div className={clsx(
                  'text-lg font-bold',
                  isDark ? 'text-cyan-300' : 'text-cyan-600'
                )}>
                  {socialite.score}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button onClick={onLeaveSociale} variant="primary" size="lg">
            Leave Game
          </Button>
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// SOCIALE RESULTS PHASE COMPONENT
// =============================================================================
// Results phase for Sociale games - show round results and scores

import { clsx } from 'clsx';
import { useTheme } from '../../../shared/providers/ThemeProvider';
import { Button } from '@social/ui';
import { 
  SocialeTimer, 
  SocialePhaseProgress, 
  SocialiteCard,
  ResponseCard,
  ScoreAnimation,
  ScoreChangeIndicator
} from './components';
import type { Socialite, SocialeResponse, SocialeVote } from '../../../domain/types/sociale.types';

interface SocialeResultsPhaseProps {
  sociale: {
    id: string;
    currentRoundId?: string;
    phaseEndsAt?: string | null;
    currentPhase?: string;
  };
  currentRound?: {
    id: string;
    type: string;
    title?: string | null;
    content?: string | null;
    settings: Record<string, any>;
  } | null;
  socialites: Socialite[];
  responses: SocialeResponse[];
  votes: SocialeVote[];
  currentSocialite?: Socialite | null;
  onAdvancePhase: () => void;
  isCurrentPlayerHost: boolean;
  isDark?: boolean;
}

export function SocialeResultsPhase({
  sociale,
  currentRound,
  socialites,
  responses,
  votes,
  currentSocialite,
  onAdvancePhase,
  isCurrentPlayerHost,
  isDark: propIsDark
}: SocialeResultsPhaseProps) {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark ?? themeIsDark;

  // Calculate results
  const getVoteCount = (responseId: string) => {
    return votes.filter(v => v.targetResponseId === responseId).length;
  };

  // Sort responses by votes (descending)
  const sortedResponses = [...responses].sort((a, b) => {
    const votesA = getVoteCount(a.id);
    const votesB = getVoteCount(b.id);
    return votesB - votesA;
  });

  // Calculate score changes
  const calculateScoreChanges = () => {
    const changes: Record<string, number> = {};
    
    // Award points to winners
    const maxVotes = Math.max(...responses.map(r => getVoteCount(r.id)));
    const winners = responses.filter(r => getVoteCount(r.id) === maxVotes);
    
    winners.forEach(winner => {
      const points = (winner as any).type === 'trivia' ? 100 : 50; // Trivia worth more
      changes[winner.socialiteId] = (changes[winner.socialiteId] || 0) + points;
    });

    return changes;
  };

  const scoreChanges = calculateScoreChanges();

  // Update socialites with new scores
  const socialitesWithScores = socialites.map(socialite => ({
    ...socialite,
    newScore: socialite.score + (scoreChanges[socialite.id] || 0)
  }));

  // Sort socialites by new score
  const sortedSocialites = [...socialitesWithScores].sort((a, b) => {
    if (a.isHost && !b.isHost) return -1;
    if (!a.isHost && b.isHost) return 1;
    return b.newScore - a.newScore;
  });

  // Get round type display name
  const getRoundTypeDisplay = (type: string) => {
    switch (type) {
      case 'prompt': return 'Prompt Results';
      case 'trivia': return 'Trivia Results';
      case 'topic': return 'Hot Topic Results';
      case 'poll': return 'Poll Results';
      default: type;
    }
  };

  // Get phase duration for progress bar
  const getPhaseDuration = () => {
    // Results phase typically shorter
    return 15;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className={clsx(
          'text-3xl font-bold',
          isDark ? 'text-white' : 'text-slate-900'
        )}>
          {getRoundTypeDisplay(currentRound?.type || 'unknown')}
        </h1>
        
        {currentRound?.title ? (
          <p className={clsx(
            'text-xl font-medium',
            isDark ? 'text-cyan-300' : 'text-cyan-600'
          )}>
            {currentRound.title}
          </p>
        ) : (
          <div className={clsx(
            'text-xl font-medium animate-pulse',
            isDark ? 'text-cyan-300' : 'text-cyan-600'
          )}>
            Loading prompt...
          </div>
        )}

        {currentRound?.content ? (
          <div className={clsx(
            'max-w-2xl mx-auto p-4 rounded-lg text-lg',
            isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'
          )}>
            {currentRound.content}
          </div>
        ) : (
          <div className={clsx(
            'max-w-2xl mx-auto p-8 rounded-lg text-lg text-center animate-pulse',
            isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'
          )}>
            Loading prompt from library...
          </div>
        )}
      </div>

      {/* Timer and Progress */}
      <div className="space-y-4">
        {sociale.phaseEndsAt && (
          <div className="flex justify-center">
            <SocialeTimer
              phaseEndsAt={sociale.phaseEndsAt}
              phase={sociale.currentPhase || 'results'}
              isPaused={false}
              size="lg"
              showLabel={true}
              position="inline"
            />
          </div>
        )}

        <div className="max-w-md mx-auto">
          <SocialePhaseProgress
            phaseEndsAt={sociale.phaseEndsAt || undefined}
            phaseDuration={getPhaseDuration()}
            isPaused={false}
            showLabel={true}
          />
        </div>
      </div>

      {/* Winner Announcement */}
      {sortedResponses.length > 0 && (
        <div className={clsx(
          'text-center p-6 rounded-lg',
          isDark 
            ? 'bg-gradient-to-br from-amber-900/50 to-amber-800/30 border border-amber-400/30' 
            : 'bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200'
        )}>
          <div className="text-6xl mb-2">👑</div>
          <h2 className={clsx(
            'text-2xl font-bold mb-2',
            isDark ? 'text-amber-300' : 'text-amber-600'
          )}>
            Winner{sortedResponses.filter(r => getVoteCount(r.id) === getVoteCount(sortedResponses[0].id)).length > 1 ? 's' : ''}
          </h2>
          <p className={clsx(
            'text-lg',
            isDark ? 'text-amber-200' : 'text-amber-700'
          )}>
            {getVoteCount(sortedResponses[0].id)} vote{getVoteCount(sortedResponses[0].id) !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Results List */}
      <div className="space-y-3">
        <h2 className={clsx(
          'text-xl font-semibold',
          isDark ? 'text-white' : 'text-slate-900'
        )}>
          Results
        </h2>

        <div className="space-y-3">
          {sortedResponses.map((response, index) => {
            const socialite = socialites.find(s => s.id === response.socialiteId);
            const voteCount = getVoteCount(response.id);
            const isWinner = index === 0 && voteCount > 0;
            const points = scoreChanges[response.socialiteId] || 0;

            if (!socialite) return null;

            return (
              <div key={response.id} className="space-y-2">
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
                  
                  <SocialiteCard
                    socialite={socialite}
                    isCurrentPlayer={socialite.id === currentSocialite?.id}
                    isHighlighted={socialite.isHost || isWinner}
                    showScore={false}
                    size="sm"
                    isDark={isDark}
                  />

                  <div className="flex-1 flex items-center gap-2">
                    <span className={clsx(
                      'text-sm font-medium',
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    )}>
                      {voteCount} vote{voteCount !== 1 ? 's' : ''}
                    </span>
                    
                    {points > 0 && (
                      <ScoreChangeIndicator
                        oldScore={socialite.score}
                        newScore={socialite.score + points}
                        isDark={isDark}
                      />
                    )}
                  </div>
                </div>
                
                <ResponseCard
                  response={response}
                  socialite={socialite}
                  votes={votes}
                  isWinner={isWinner}
                  isVotedByCurrentUser={false}
                  showVotes={true}
                  size="md"
                  isDark={isDark}
                />
              </div>
            );
          })}
        </div>

        {responses.length === 0 && (
          <div className={clsx(
            'text-center py-8 rounded-lg border-2 border-dashed',
            isDark 
              ? 'border-slate-700 text-slate-400' 
              : 'border-slate-300 text-slate-500'
          )}>
            <p className="text-lg">No responses</p>
          </div>
        )}
      </div>

      {/* Scoreboard */}
      <div className="space-y-3">
        <h2 className={clsx(
          'text-xl font-semibold',
          isDark ? 'text-white' : 'text-slate-900'
        )}>
          Updated Scores
        </h2>

        <div className="grid gap-2">
          {sortedSocialites.map((socialite, index) => {
            const scoreChange = scoreChanges[socialite.id] || 0;
            
            return (
              <div key={socialite.id} className="flex items-center gap-3">
                <div className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                  index === 0
                    ? 'bg-amber-400 text-amber-900'
                    : isDark
                      ? 'bg-slate-700 text-slate-300'
                      : 'bg-slate-200 text-slate-700'
                )}>
                  {index + 1}
                </div>
                
                <SocialiteCard
                  socialite={socialite}
                  isCurrentPlayer={socialite.id === currentSocialite?.id}
                  isHighlighted={socialite.isHost}
                  showScore={true}
                  size="sm"
                  isDark={isDark}
                />

                {scoreChange > 0 && (
                  <ScoreChangeIndicator
                    oldScore={socialite.score}
                    newScore={socialite.newScore}
                    isDark={isDark}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Host Controls */}
      {isCurrentPlayerHost && (
        <div className="space-y-3">
          <div className={clsx(
            'rounded-lg p-4 text-sm',
            isDark 
              ? 'bg-slate-800 border border-slate-700 text-slate-300' 
              : 'bg-slate-50 border border-slate-200 text-slate-600'
          )}>
            <h3 className="font-semibold mb-2">Host Controls</h3>
            <ul className="space-y-1">
              <li>• Review the round results</li>
              <li>• Scores have been updated</li>
              <li>• Timer will automatically advance to next round</li>
            </ul>
          </div>
          
          <div className="flex justify-center">
            <Button
              onClick={onAdvancePhase}
              variant="primary"
              size="lg"
            >
              Next Round
            </Button>
          </div>
        </div>
      )}

      {/* Player View */}
      {!isCurrentPlayerHost && (
        <div className={clsx(
          'rounded-lg p-4 text-center',
          isDark 
            ? 'bg-slate-800 border border-slate-700 text-slate-300' 
            : 'bg-slate-50 border border-slate-200 text-slate-600'
        )}>
          <p>Waiting for the next round...</p>
          {scoreChanges[currentSocialite?.id || 0] > 0 && (
            <p className="mt-2 font-bold text-green-400">
              You earned {scoreChanges[currentSocialite?.id || 0]} points!
            </p>
          )}
        </div>
      )}

      {/* Score Animations */}
      {Object.entries(scoreChanges).map(([socialiteId, points]) => {
        if (points <= 0) return null;
        const socialite = socialites.find(s => s.id === socialiteId);
        if (!socialite) return null;
        
        return (
          <ScoreAnimation
            key={socialiteId}
            points={points}
            reason={points === 100 ? 'Correct Answer!' : 'Best Response!'}
            socialiteName={socialite.displayName}
            duration={2000}
          />
        );
      })}
    </div>
  );
}

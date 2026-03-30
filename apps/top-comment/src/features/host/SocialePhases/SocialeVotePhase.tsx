// =============================================================================
// SOCIALE VOTE PHASE COMPONENT
// =============================================================================
// Vote phase for Sociale games - players vote on responses

import { clsx } from 'clsx';
import { useTheme } from '../../../shared/providers/ThemeProvider';
import { Button } from '@social/ui';
import { 
  SocialeTimer, 
  SocialePhaseProgress, 
  SocialiteCard,
  ResponseCard
} from './components';
import type { Socialite, SocialeResponse, SocialeVote } from '../../../domain/types/sociale.types';

interface SocialeVotePhaseProps {
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

export function SocialeVotePhase({
  sociale,
  currentRound,
  socialites,
  responses,
  votes,
  currentSocialite,
  onAdvancePhase,
  isCurrentPlayerHost,
  isDark: propIsDark
}: SocialeVotePhaseProps) {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark ?? themeIsDark;

  // Calculate voting status
  const activePlayers = socialites.filter(s => s.isActive && !s.isBanned);
  const votedPlayers = new Set(votes.map(v => v.socialiteId));
  const voteCount = votedPlayers.size;
  const waitingCount = activePlayers.length - voteCount;

  // Calculate votes for each response
  const getVoteCount = (responseId: string) => {
    return votes.filter(v => v.targetResponseId === responseId).length;
  };

  // Get round type display name
  const getRoundTypeDisplay = (type: string) => {
    switch (type) {
      case 'prompt': return 'Vote for Best Response';
      case 'trivia': return 'Vote for Most Creative';
      case 'topic': return 'Vote for Best Take';
      case 'poll': return 'Cast Your Vote';
      default: return 'Vote';
    }
  };

  // Get phase duration for progress bar
  const getPhaseDuration = () => {
    // Default durations in seconds
    switch (currentRound?.type) {
      case 'trivia': return 30;
      case 'prompt': return 45;
      case 'topic': return 30;
      case 'poll': return 20;
      default: return 45;
    }
  };

  // Sort responses by votes
  const sortedResponses = [...responses].sort((a, b) => {
    const votesA = getVoteCount(a.id);
    const votesB = getVoteCount(b.id);
    return votesB - votesA;
  });

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
        
        {currentRound?.title && (
          <p className={clsx(
            'text-xl font-medium',
            isDark ? 'text-cyan-300' : 'text-cyan-600'
          )}>
            {currentRound.title}
          </p>
        )}

        {currentRound?.content && (
          <div className={clsx(
            'max-w-2xl mx-auto p-4 rounded-lg text-lg',
            isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'
          )}>
            {currentRound.content}
          </div>
        )}
      </div>

      {/* Timer and Progress */}
      <div className="space-y-4">
        {sociale.phaseEndsAt && (
          <div className="flex justify-center">
            <SocialeTimer
              phaseEndsAt={sociale.phaseEndsAt}
              phase={sociale.currentPhase || 'vote'}
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

      {/* Voting Status */}
      <div className={clsx(
        'rounded-lg p-4 text-center',
        isDark 
          ? 'bg-slate-800 border border-slate-700' 
          : 'bg-slate-50 border border-slate-200'
      )}>
        <div className="text-2xl font-bold mb-2">
          <span className={clsx(
            isDark ? 'text-cyan-300' : 'text-cyan-600'
          )}>
            {voteCount}
          </span>
          <span className={clsx(
            'mx-2',
            isDark ? 'text-slate-400' : 'text-slate-500'
          )}>
            /
          </span>
          <span className={clsx(
            isDark ? 'text-white' : 'text-slate-900'
          )}>
            {activePlayers.length}
          </span>
        </div>
        <p className={clsx(
          'text-sm',
          isDark ? 'text-slate-300' : 'text-slate-600'
        )}>
          {waitingCount > 0 
            ? `Waiting for ${waitingCount} vote${waitingCount !== 1 ? 's' : ''}...`
            : 'All votes cast!'
          }
        </p>
      </div>

      {/* Responses with Votes */}
      <div className="space-y-3">
        <h2 className={clsx(
          'text-xl font-semibold',
          isDark ? 'text-white' : 'text-slate-900'
        )}>
          Responses
        </h2>

        <div className="space-y-3">
          {sortedResponses.map((response) => {
            const socialite = socialites.find(s => s.id === response.socialiteId);
            const voteCount = getVoteCount(response.id);
            const isWinner = voteCount === Math.max(...responses.map(r => getVoteCount(r.id)));
            // Note: hasVoted variable was declared but not used - voting status handled in ResponseCard

            if (!socialite) return null;

            return (
              <div key={response.id} className="space-y-2">
                <SocialiteCard
                  socialite={socialite}
                  isCurrentPlayer={socialite.id === currentSocialite?.id}
                  isHighlighted={socialite.isHost}
                  showScore={false}
                  size="sm"
                  isDark={isDark}
                />
                
                <ResponseCard
                  response={response}
                  socialite={socialite}
                  votes={votes}
                  isWinner={isWinner}
                  isVotedByCurrentUser={votes.some(v => 
                    v.socialiteId === currentSocialite?.id && 
                    v.targetResponseId === response.id
                  )}
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
            <p className="text-lg">No responses yet</p>
          </div>
        )}
      </div>

      {/* Players Voting Status */}
      <div className="space-y-3">
        <h2 className={clsx(
          'text-xl font-semibold',
          isDark ? 'text-white' : 'text-slate-900'
        )}>
          Players
        </h2>

        <div className="grid gap-2">
          {socialites
            .filter(s => s.isActive && !s.isBanned)
            .sort((a, b) => {
              if (a.isHost && !b.isHost) return -1;
              if (!a.isHost && b.isHost) return 1;
              return 0;
            })
            .map((socialite) => {
              const hasVoted = votedPlayers.has(socialite.id);
              
              return (
                <SocialiteCard
                  key={socialite.id}
                  socialite={socialite}
                  isCurrentPlayer={socialite.id === currentSocialite?.id}
                  isHighlighted={socialite.isHost}
                  showScore={false}
                  size="sm"
                  isDark={isDark}
                />
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
              <li>• Wait for players to vote</li>
              <li>• Timer will automatically advance when it ends</li>
              <li>• You can manually advance to results</li>
            </ul>
          </div>
          
          <div className="flex justify-center">
            <Button
              onClick={onAdvancePhase}
              variant="primary"
              size="lg"
              disabled={voteCount === 0}
            >
              {voteCount === 0 
                ? 'Waiting for votes...' 
                : voteCount === activePlayers.length 
                  ? 'All Ready - Show Results'
                  : `Advance (${voteCount}/${activePlayers.length} voted)`
              }
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
          {votedPlayers.has(currentSocialite?.id || '') 
            ? 'Vote cast! Waiting for other players...'
            : 'Cast your vote on your device'
          }
        </div>
      )}
    </div>
  );
}

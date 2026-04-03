// =============================================================================
// SOCIALE REVEAL PHASE COMPONENT
// =============================================================================
// Reveal phase for Sociale games - show the answer or most voted response

import { clsx } from 'clsx';
import { Button } from '@social/ui';
import { 
  SocialeTimer, 
  SocialiteCard
} from './components';
import type { Socialite, SocialeResponse, SocialeVote } from '../../../domain/types/sociale.types';

interface SocialeRevealPhaseProps {
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
  onSkipPhase?: () => void;
  onSkipRound?: () => void;
  isCurrentPlayerHost: boolean;
  isDark?: boolean;
}

export function SocialeRevealPhase({
  sociale,
  currentRound,
  socialites,
  responses,
  votes,
  currentSocialite,
  onAdvancePhase,
  onSkipPhase,
  onSkipRound,
  isCurrentPlayerHost,
  isDark = false,
}: SocialeRevealPhaseProps) {
  const getRoundTypeDisplay = (type: string) => {
    switch (type) {
      case 'topic':
        return 'Hot Topic';
      case 'trivia':
        return 'Trivia Question';
      case 'prompt':
        return 'Prompt';
      default:
        return 'Round';
    }
  };

  const getRevealContent = () => {
    if (!currentRound) return null;

    if (currentRound.type === 'topic') {
      // For topics, find the most voted response
      const responseVotes = new Map<string, number>();
      
      votes.forEach(vote => {
        const currentCount = responseVotes.get(vote.targetResponseId) || 0;
        responseVotes.set(vote.targetResponseId, currentCount + 1);
      });

      // Find the response with the most votes
      let topResponse: SocialeResponse | null = null;
      let maxVotes = 0;

      responses.forEach(response => {
        const voteCount = responseVotes.get(response.id) || 0;
        if (voteCount > maxVotes) {
          maxVotes = voteCount;
          topResponse = response;
        }
      });

      if (!topResponse) {
        return {
          title: 'Most Popular Response',
          content: 'No responses received',
          author: null,
          voteCount: 0,
        };
      }

      return {
        title: 'Most Popular Response',
        content: topResponse.content,
        author: socialites.find(s => s.id === topResponse.socialiteId),
        voteCount: maxVotes,
      };
    } else if (currentRound.type === 'trivia') {
      // For trivia, show the correct answer
      return {
        title: 'Correct Answer',
        content: currentRound.content || 'No answer available',
        author: null,
        voteCount: null,
      };
    }

    return null;
  };

  const revealContent = getRevealContent();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className={clsx(
          'text-3xl font-bold',
          isDark ? 'text-white' : 'text-slate-900'
        )}>
          Reveal
        </h1>
        
        <div className={clsx(
          'text-xl font-medium',
          isDark ? 'text-cyan-300' : 'text-cyan-600'
        )}>
          {getRoundTypeDisplay(currentRound?.type || 'unknown')}
        </div>
      </div>

      {/* Timer */}
      {sociale.phaseEndsAt && (
        <div className="flex justify-center">
          <SocialeTimer
            phaseEndsAt={sociale.phaseEndsAt}
            phase="reveal"
          />
        </div>
      )}

      {/* Reveal Content */}
      {revealContent ? (
        <div className={clsx(
          'max-w-2xl mx-auto p-8 rounded-lg text-center',
          isDark ? 'bg-slate-800' : 'bg-white border border-slate-200'
        )}>
          <div className={clsx(
            'text-lg font-semibold mb-4',
            isDark ? 'text-cyan-300' : 'text-cyan-600'
          )}>
            {revealContent.title}
          </div>
          
          <div className={clsx(
            'text-2xl font-bold mb-6',
            isDark ? 'text-white' : 'text-slate-900'
          )}>
            {revealContent.content}
          </div>

          {revealContent.author && (
            <div className="space-y-2">
              <div className={clsx(
                'text-sm',
                isDark ? 'text-slate-400' : 'text-slate-600'
              )}>
                Submitted by:
              </div>
              <div className={clsx(
                'font-medium',
                isDark ? 'text-white' : 'text-slate-900'
              )}>
                {revealContent.author.displayName}
              </div>
            </div>
          )}

          {revealContent.voteCount !== null && (
            <div className={clsx(
              'mt-4 text-sm',
              isDark ? 'text-slate-400' : 'text-slate-600'
            )}>
              Received {revealContent.voteCount} vote{revealContent.voteCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      ) : (
        <div className={clsx(
          'max-w-2xl mx-auto p-8 rounded-lg text-center',
          isDark ? 'bg-slate-800' : 'bg-white border border-slate-200'
        )}>
          <div className={clsx(
            'text-lg',
            isDark ? 'text-slate-400' : 'text-slate-600'
          )}>
            No content to reveal
          </div>
        </div>
      )}

      {/* Host Controls */}
      {isCurrentPlayerHost && (
        <div className="flex justify-center space-x-4">
          {onSkipPhase && (
            <Button
              onClick={onSkipPhase}
              variant="secondary"
              size="sm"
              isDark={isDark}
            >
              Skip Phase
            </Button>
          )}
          {onSkipRound && (
            <Button
              onClick={onSkipRound}
              variant="secondary"
              size="sm"
              isDark={isDark}
            >
              Skip Round
            </Button>
          )}
        </div>
      )}

      {/* Players List */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {socialites.map((socialite) => (
          <SocialiteCard
            key={socialite.id}
            socialite={socialite}
            isCurrentPlayer={socialite.id === currentSocialite?.id}
            isDark={isDark}
          />
        ))}
      </div>
    </div>
  );
}

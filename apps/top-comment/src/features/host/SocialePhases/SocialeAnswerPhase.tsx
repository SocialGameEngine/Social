// =============================================================================
// SOCIALE ANSWER PHASE COMPONENT
// =============================================================================
// Answer phase for Sociale games - players submit responses

import { clsx } from 'clsx';
import { useTheme } from '../../../shared/providers/ThemeProvider';
import { Button } from '@social/ui';
import { 
  SocialeTimer, 
  SocialePhaseProgress, 
  SocialiteCard,
  ResponseCard
} from './components';
import type { Socialite, SocialeResponse } from '../../../domain/types/sociale.types';

interface SocialeAnswerPhaseProps {
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
  currentSocialite?: Socialite | null;
  onAdvancePhase: () => void;
  onSkipPhase?: () => void;
  onSkipRound?: () => void;
  isCurrentPlayerHost: boolean;
  isDark?: boolean;
}

export function SocialeAnswerPhase({
  sociale,
  currentRound,
  socialites,
  responses,
  currentSocialite,
  onAdvancePhase,
  onSkipPhase,
  onSkipRound,
  isCurrentPlayerHost,
  isDark: propIsDark
}: SocialeAnswerPhaseProps) {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark ?? themeIsDark;

  // Calculate response status
  const activePlayers = socialites.filter(s => s.isActive && !s.isBanned);
  const respondedPlayers = new Set(responses.map(r => r.socialiteId));
  const responseCount = respondedPlayers.size;
  const waitingCount = activePlayers.length - responseCount;

  // Get round type display name
  const getRoundTypeDisplay = (type: string) => {
    switch (type) {
      case 'prompt': return 'Prompt';
      case 'trivia': return 'Trivia';
      case 'topic': return 'Hot Topic';
      case 'poll': return 'Poll';
      default: return type;
    }
  };

  // Get phase duration for progress bar
  const getPhaseDuration = () => {
    // Default durations in seconds
    switch (currentRound?.type) {
      case 'trivia': return 30;
      case 'prompt': return 60;
      case 'topic': return 45;
      case 'poll': return 30;
      default: return 60;
    }
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
              phase={sociale.currentPhase || 'answer'}
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

      {/* Response Status */}
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
            {responseCount}
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
            ? `Waiting for ${waitingCount} player${waitingCount !== 1 ? 's' : ''}...`
            : 'All players responded!'
          }
        </p>
      </div>

      {/* Players List with Response Status */}
      <div className="space-y-3">
        <h2 className={clsx(
          'text-xl font-semibold',
          isDark ? 'text-white' : 'text-slate-900'
        )}>
          Players
        </h2>

        <div className="grid gap-3">
          {socialites
            .filter(s => s.isActive && !s.isBanned)
            .sort((a, b) => {
              if (a.isHost && !b.isHost) return -1;
              if (!a.isHost && b.isHost) return 1;
              return 0;
            })
            .map((socialite) => {
              const hasResponded = respondedPlayers.has(socialite.id);
              const response = responses.find(r => r.socialiteId === socialite.id);
              
              return (
                <div key={socialite.id} className="space-y-2">
                  <SocialiteCard
                    socialite={socialite}
                    isCurrentPlayer={socialite.id === currentSocialite?.id}
                    isHighlighted={socialite.isHost}
                    showScore={false}
                    size="md"
                    isDark={isDark}
                  />
                  
                  {response && (
                    <ResponseCard
                      response={response}
                      socialite={socialite}
                      votes={[]}
                      isWinner={false}
                      isVotedByCurrentUser={false}
                      showVotes={false}
                      size="sm"
                      isDark={isDark}
                    />
                  )}
                  
                  {!hasResponded && (
                    <div className={clsx(
                      'ml-12 text-sm italic',
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    )}>
                      Thinking...
                    </div>
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
              <li>• Wait for players to submit responses</li>
              <li>• Timer will automatically advance when it ends</li>
              <li>• You can manually advance to voting phase</li>
              <li>• Skip phase or round if needed</li>
            </ul>
          </div>
          
          <div className="flex justify-center gap-3">
            <Button
              onClick={onSkipPhase}
              variant="secondary"
              size="lg"
            >
              Skip Phase
            </Button>
            
            <Button
              onClick={onSkipRound}
              variant="secondary"
              size="lg"
            >
              Skip Round
            </Button>
            
            <Button
              onClick={onAdvancePhase}
              variant="primary"
              size="lg"
              disabled={responseCount === 0}
            >
              {responseCount === 0 
                ? 'Waiting for responses...' 
                : responseCount === activePlayers.length 
                  ? 'All Ready - Start Voting'
                  : `Advance (${responseCount}/${activePlayers.length} responded)`
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
          {respondedPlayers.has(currentSocialite?.id || '') 
            ? 'Response submitted! Waiting for other players...'
            : 'Submit your response on your device'
          }
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SOCIALE ENDED PHASE COMPONENT
// =============================================================================
// Final phase for Sociale games - show final scores and game summary

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { useTheme } from '../../../shared/providers/ThemeProvider';
import { Button } from '@social/ui';
import { SocialiteCard } from './components';
import { WrappedRecap } from '../../share/WrappedRecap';
import { transformSocialeToSessionData } from '../../share/hooks/useWrappedRecap';
import { generateStoryCards } from '../../../domain/share/generateStoryCards';
import { supabase } from '../../../supabase/client';
import type { Socialite } from '../../../domain/types/sociale.types';
import type { StoryCard } from '../../../domain/share/generateStoryCards';

interface SocialeEndedPhaseProps {
  sociale: {
    id: string;
    title?: string;
    description?: string;
    endedAt?: string | null;
    settings: {
      totalRounds: number;
      mode: string;
    };
  };
  socialites: Socialite[];
  currentSocialite?: Socialite | null;
  onCreateNewSociale: () => void;
  onReturnToLobby: () => void;
  isCurrentPlayerHost: boolean;
  isDark?: boolean;
}

export function SocialeEndedPhase({
  sociale,
  socialites,
  currentSocialite,
  onCreateNewSociale,
  onReturnToLobby,
  isCurrentPlayerHost,
  isDark: propIsDark
}: SocialeEndedPhaseProps) {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark ?? themeIsDark;

  const [showRecap, setShowRecap] = useState(false);
  const [recapCards, setRecapCards] = useState<StoryCard[]>([]);

  // Pre-fetch recap data for the current player on mount
  useEffect(() => {
    if (!currentSocialite || !sociale.id) return;

    const fetchRecapData = async () => {
      const [{ data: responses }, { data: votes }, { data: scoreEvents }] = await Promise.all([
        supabase
          .from('sociale_responses')
          .select('id, round_index, is_correct, response_time_ms, category')
          .eq('sociale_id', sociale.id)
          .eq('socialite_id', currentSocialite.id)
          .eq('is_practice', false),
        supabase
          .from('sociale_votes')
          .select('voted_for_response_id')
          .eq('sociale_id', sociale.id)
          .eq('socialite_id', currentSocialite.id),
        supabase
          .from('sociale_score_events')
          .select('round_index, points')
          .eq('sociale_id', sociale.id)
          .eq('socialite_id', currentSocialite.id),
      ]);

      if (!responses) return;

      const myRank = [...socialites]
        .filter(s => s.isActive && !s.isBanned)
        .sort((a, b) => b.score - a.score)
        .findIndex(s => s.id === currentSocialite.id) + 1;

      const socialeContext = {
        current_round_index: sociale.settings.totalRounds,
        rank_position: myRank,
        total_players: socialites.filter(s => s.isActive && !s.isBanned).length,
        created_at: new Date().toISOString(),
      };

      const sessionData = transformSocialeToSessionData(
        socialeContext,
        responses,
        votes ?? [],
        scoreEvents ?? []
      );

      setRecapCards(generateStoryCards(sessionData));
    };

    fetchRecapData().catch(console.error);
  }, [currentSocialite, sociale.id, sociale.settings.totalRounds, socialites]);

  // Sort socialites by final score
  const sortedSocialites = [...socialites]
    .filter(s => s.isActive && !s.isBanned)
    .sort((a, b) => {
      if (a.isHost && !b.isHost) return -1;
      if (!a.isHost && b.isHost) return 1;
      return b.score - a.score;
    });

  // Calculate statistics
  const totalPlayers = sortedSocialites.length;
  const averageScore = totalPlayers > 0 
    ? Math.round(sortedSocialites.reduce((sum, s) => sum + s.score, 0) / totalPlayers)
    : 0;
  const winner = sortedSocialites[0];
  const scoreGap = winner && totalPlayers > 1 
    ? winner.score - (sortedSocialites[1]?.score || 0)
    : 0;

  // Get duration - Note: Function defined but not currently used
  // const getGameDuration = () => {
  //   if (!sociale.endedAt) return null;
  //   
  //   // This would need to be calculated from when the game started
  //   // For now, just show it ended
  //   return 'Game Complete';
  // };

  if (showRecap && recapCards.length > 0 && currentSocialite) {
    return (
      <WrappedRecap
        cards={recapCards}
        playerName={currentSocialite.displayName || 'Player'}
        onClose={() => setShowRecap(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="text-6xl">🎉</div>
        <h1 className={clsx(
          'text-4xl font-bold',
          isDark ? 'text-white' : 'text-slate-900'
        )}>
          Game Complete!
        </h1>
        
        {sociale.title && (
          <p className={clsx(
            'text-2xl font-medium',
            isDark ? 'text-cyan-300' : 'text-cyan-600'
          )}>
            {sociale.title}
          </p>
        )}

        {sociale.description && (
          <p className={clsx(
            'text-lg',
            isDark ? 'text-slate-300' : 'text-slate-600'
          )}>
            {sociale.description}
          </p>
        )}

        <div className="flex items-center justify-center gap-4 text-sm">
          <span className={clsx(
            'px-3 py-1 rounded-full',
            isDark ? 'bg-slate-800 text-cyan-300' : 'bg-slate-100 text-slate-700'
          )}>
            {sociale.settings.mode}
          </span>
          <span className={clsx(
            'px-3 py-1 rounded-full',
            isDark ? 'bg-slate-800 text-cyan-300' : 'bg-slate-100 text-slate-700'
          )}>
            {sociale.settings.totalRounds} Rounds
          </span>
          <span className={clsx(
            'px-3 py-1 rounded-full',
            isDark ? 'bg-slate-800 text-cyan-300' : 'bg-slate-100 text-slate-700'
          )}>
            {totalPlayers} Players
          </span>
        </div>
      </div>

      {/* Winner Celebration */}
      {winner && (
        <div className={clsx(
          'text-center p-8 rounded-lg',
          isDark 
            ? 'bg-gradient-to-br from-amber-900/50 to-amber-800/30 border border-amber-400/30' 
            : 'bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200'
        )}>
          <div className="text-6xl mb-4">👑</div>
          <h2 className={clsx(
            'text-3xl font-bold mb-2',
            isDark ? 'text-amber-300' : 'text-amber-600'
          )}>
            {winner.displayName}
          </h2>
          <p className={clsx(
            'text-xl mb-4',
            isDark ? 'text-amber-200' : 'text-amber-700'
          )}>
            Winner with {winner.score} points!
          </p>
          
          {scoreGap > 0 && (
            <p className={clsx(
              'text-sm',
              isDark ? 'text-amber-300' : 'text-amber-600'
            )}>
              Won by {scoreGap} point{scoreGap !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Game Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={clsx(
          'rounded-lg p-4 text-center',
          isDark 
            ? 'bg-slate-800 border border-slate-700' 
            : 'bg-slate-50 border border-slate-200'
        )}>
          <div className={clsx(
            'text-2xl font-bold',
            isDark ? 'text-cyan-300' : 'text-cyan-600'
          )}>
            {totalPlayers}
          </div>
          <p className={clsx(
            'text-sm mt-1',
            isDark ? 'text-slate-300' : 'text-slate-600'
          )}>
            Players
          </p>
        </div>

        <div className={clsx(
          'rounded-lg p-4 text-center',
          isDark 
            ? 'bg-slate-800 border border-slate-700' 
            : 'bg-slate-50 border border-slate-200'
        )}>
          <div className={clsx(
            'text-2xl font-bold',
            isDark ? 'text-cyan-300' : 'text-cyan-600'
          )}>
            {averageScore}
          </div>
          <p className={clsx(
            'text-sm mt-1',
            isDark ? 'text-slate-300' : 'text-slate-600'
          )}>
            Average Score
          </p>
        </div>

        <div className={clsx(
          'rounded-lg p-4 text-center',
          isDark 
            ? 'bg-slate-800 border border-slate-700' 
            : 'bg-slate-50 border border-slate-200'
        )}>
          <div className={clsx(
            'text-2xl font-bold',
            isDark ? 'text-cyan-300' : 'text-cyan-600'
          )}>
            {sociale.settings.totalRounds}
          </div>
          <p className={clsx(
            'text-sm mt-1',
            isDark ? 'text-slate-300' : 'text-slate-600'
          )}>
            Rounds Played
          </p>
        </div>
      </div>

      {/* Final Scoreboard */}
      <div className="space-y-3">
        <h2 className={clsx(
          'text-2xl font-semibold text-center',
          isDark ? 'text-white' : 'text-slate-900'
        )}>
          Final Scores
        </h2>

        <div className="space-y-2">
          {sortedSocialites.map((socialite, index) => {
            const isWinner = index === 0;
            const isCurrentPlayer = socialite.id === currentSocialite?.id;
            
            return (
              <div key={socialite.id} className="flex items-center gap-3">
                <div className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold',
                  isWinner
                    ? 'bg-amber-400 text-amber-900 text-lg'
                    : isCurrentPlayer
                      ? 'bg-cyan-400 text-cyan-900'
                      : isDark
                        ? 'bg-slate-700 text-slate-300'
                        : 'bg-slate-200 text-slate-700'
                )}>
                  {index + 1}
                </div>
                
                <SocialiteCard
                  socialite={socialite}
                  isCurrentPlayer={isCurrentPlayer}
                  isHighlighted={socialite.isHost || isWinner}
                  showScore={true}
                  size="md"
                  isDark={isDark}
                />

                {isWinner && (
                  <div className="text-2xl">👑</div>
                )}
              </div>
            );
          })}
        </div>

        {sortedSocialites.length === 0 && (
          <div className={clsx(
            'text-center py-8 rounded-lg border-2 border-dashed',
            isDark 
              ? 'border-slate-700 text-slate-400' 
              : 'border-slate-300 text-slate-500'
          )}>
            <p className="text-lg">No players participated</p>
          </div>
        )}
      </div>

      {/* Duration */}
      {sociale.endedAt && (
        <div className={clsx(
          'text-center text-sm',
          isDark ? 'text-slate-400' : 'text-slate-500'
        )}>
          Game ended at {new Date(sociale.endedAt).toLocaleString()}
        </div>
      )}

      {/* Host Controls */}
      {isCurrentPlayerHost && (
        <div className="space-y-3">
          <div className={clsx(
            'rounded-lg p-4 text-sm',
            isDark 
              ? 'bg-slate-800 border border-slate-700 text-slate-300' 
              : 'bg-slate-50 border border-slate-200 text-slate-600'
          )}>
            <h3 className="font-semibold mb-2">Host Options</h3>
            <ul className="space-y-1">
              <li>• Create a new game with the same players</li>
              <li>• Return to the lobby to start fresh</li>
              <li>• Players can rejoin with a new game code</li>
            </ul>
          </div>
          
          <div className="flex justify-center gap-3">
            <Button
              onClick={onCreateNewSociale}
              variant="primary"
              size="lg"
            >
              New Game
            </Button>
            
            <Button
              onClick={onReturnToLobby}
              variant="secondary"
              size="lg"
            >
              Back to Lobby
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
          <p className="mb-3">Thanks for playing!</p>
          <p>Wait for the host to start a new game...</p>
          
          {currentSocialite && (
            <div className="mt-4">
              <p className={clsx(
                'text-lg font-bold',
                isDark ? 'text-cyan-300' : 'text-cyan-600'
              )}>
                Your Final Score: {currentSocialite.score}
              </p>

              <p className="text-sm mt-1">
                {sortedSocialites.findIndex(s => s.id === currentSocialite.id) + 1} of {totalPlayers} place
              </p>

              {recapCards.length > 0 && (
                <button
                  onClick={() => setShowRecap(true)}
                  className={clsx(
                    'mt-4 px-6 py-2 rounded-lg font-semibold text-sm transition-colors',
                    isDark
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-white'
                  )}
                >
                  ✨ View Your Recap
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

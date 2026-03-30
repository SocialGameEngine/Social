// =============================================================================
// SOCIALE LOBBY PHASE COMPONENT
// =============================================================================
// Lobby phase for Sociale games - waiting for players to join

import { useMemo } from 'react';
import { clsx } from 'clsx';
import { useTheme } from '../../../shared/providers/ThemeProvider';
import { Button } from '@social/ui';
import { 
  SocialeTimer, 
  SocialeRoundProgress, 
  SocialiteCard
} from './components';
import type { Socialite } from '../../../domain/types/sociale.types';

interface SocialeLobbyPhaseProps {
  sociale: {
    id: string;
    title?: string;
    description?: string;
    phaseEndsAt?: string | null;
    settings: {
      totalRounds: number;
      mode: string;
    };
  };
  socialites: Socialite[];
  currentSocialite?: Socialite | null;
  onStartSociale: () => void;
  onCreateSociale?: () => void;
  onLoadSociale?: () => void;
  onSettings?: () => void;
  onCloseSociale?: () => void;
  isCurrentPlayerHost: boolean;
  isDark?: boolean;
}

export function SocialeLobbyPhase({
  sociale,
  socialites,
  currentSocialite,
  onStartSociale,
  onCreateSociale,
  onLoadSociale,
  onSettings,
  onCloseSociale,
  isCurrentPlayerHost,
  isDark: propIsDark
}: SocialeLobbyPhaseProps) {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark ?? themeIsDark;

  // Sort socialites: host first, then by score, then by join time
  const sortedSocialites = useMemo(() => {
    return [...socialites].sort((a, b) => {
      // Host always first
      if (a.isHost && !b.isHost) return -1;
      if (!a.isHost && b.isHost) return 1;
      
      // Then by score (descending)
      if (a.score !== b.score) return b.score - a.score;
      
      // Then by join time
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [socialites]);

  const activePlayers = sortedSocialites.filter(s => s.isActive && !s.isBanned);
  const playerCount = activePlayers.length;

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <h3 className={clsx(
          'text-xl font-semibold',
          isDark ? 'text-white' : 'text-slate-900'
        )}>
          Sociale
        </h3>
        <div className="flex gap-2">
          {/* Sociale Controls */}
          {isCurrentPlayerHost && (
            <div className="flex flex-wrap gap-2">
              {onCreateSociale && (
                <Button variant="secondary" onClick={onCreateSociale}>
                  Create Sociale
                </Button>
              )}
              {onLoadSociale && (
                <Button variant="ghost" onClick={onLoadSociale}>
                  Load Sociale
                </Button>
              )}
              {onSettings && (
                <Button variant="ghost" onClick={onSettings}>
                  Settings
                </Button>
              )}
              {onCloseSociale && (
                <Button variant="ghost" onClick={onCloseSociale}>
                  Close Sociale
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Game Info */}
      <div className="text-center space-y-2">
        <h1 className={clsx(
          'text-3xl font-bold',
          isDark ? 'text-white' : 'text-slate-900'
        )}>
          {sociale.title || 'Social Game'}
        </h1>
        
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
        </div>
      </div>

      {/* Timer (if auto-start is enabled) */}
      {sociale.phaseEndsAt && (
        <div className="flex justify-center">
          <SocialeTimer
            phaseEndsAt={sociale.phaseEndsAt}
            phase="Starting"
            isPaused={false}
            size="lg"
            showLabel={true}
            position="inline"
          />
        </div>
      )}

      {/* Progress */}
      <div className="max-w-md mx-auto">
        <SocialeRoundProgress
          currentRound={0}
          totalRounds={sociale.settings.totalRounds}
          showLabel={true}
        />
      </div>

      {/* Players List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className={clsx(
            'text-xl font-semibold',
            isDark ? 'text-white' : 'text-slate-900'
          )}>
            Players ({playerCount})
          </h2>
          
          {isCurrentPlayerHost && playerCount >= 1 && (
            <Button
              onClick={onStartSociale}
              variant="primary"
              size="lg"
            >
              Start Game
            </Button>
          )}
        </div>

        <div className="grid gap-3">
          {sortedSocialites.map((socialite) => (
            <SocialiteCard
              key={socialite.id}
              socialite={socialite}
              isCurrentPlayer={socialite.id === currentSocialite?.id}
              isHighlighted={socialite.isHost}
              showScore={false}
              size="md"
              isDark={isDark}
            />
          ))}
        </div>

        {playerCount === 0 && (
          <div className={clsx(
            'text-center py-8 rounded-lg border-2 border-dashed',
            isDark 
              ? 'border-slate-700 text-slate-400' 
              : 'border-slate-300 text-slate-500'
          )}>
            <p className="text-lg">No players yet</p>
            <p className="text-sm mt-1">
              Share the room code to get started!
            </p>
          </div>
        )}
      </div>

      {/* Host Instructions */}
      {isCurrentPlayerHost && (
        <div className={clsx(
          'rounded-lg p-4 text-sm',
          isDark 
            ? 'bg-slate-800 border border-slate-700 text-slate-300' 
            : 'bg-slate-50 border border-slate-200 text-slate-600'
        )}>
          <h3 className="font-semibold mb-2">Host Controls</h3>
          <ul className="space-y-1">
            <li>• Wait for players to join</li>
            <li>• Start the game when ready</li>
            <li>• Game will auto-start if timer is set</li>
          </ul>
        </div>
      )}

      {/* Player Instructions */}
      {!isCurrentPlayerHost && (
        <div className={clsx(
          'rounded-lg p-4 text-sm text-center',
          isDark 
            ? 'bg-slate-800 border border-slate-700 text-slate-300' 
            : 'bg-slate-50 border border-slate-200 text-slate-600'
        )}>
          <p>Waiting for the host to start the game...</p>
        </div>
      )}
    </div>
  );
}

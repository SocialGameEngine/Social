// =============================================================================
// SOCIALES PANEL
// =============================================================================
// Panel for managing Sociales (replaces SessionsPanel for Sociales)

import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { Button, Card } from '@social/ui';
import {
  useSociale,
  useCreateSociale,
  useSocialites,
} from '../../../features/sociale';
import type { Sociale, CreateSocialeRequest } from '../../../features/sociale';
import { returnSocialeToLobby, cancelSociale, endSociale } from '../../../features/sociale/socialeService';
import { roomService } from '../../../services/roomService';
import { SocialePhaseRenderer } from './SocialePhaseRenderer';
import { SocialeTimer, SocialeRoundProgress, SocialiteCard } from '../SocialePhases/components';

interface SocialesPanelProps {
  isDark: boolean;
  roomId: string;
  userId?: string;
  primarySocialeId?: string | null;
  onSocialeChange?: (socialeId: string | null) => void;
  /** Opens Sociale create/settings (upsert). */
  onOpenSocialeSettings?: () => void;
  /** Opens Load Sociale modal. */
  onOpenLoadSociale?: () => void;
}

export function SocialesPanel({
  isDark,
  roomId,
  userId,
  primarySocialeId,
  onSocialeChange,
  onOpenSocialeSettings,
  onOpenLoadSociale,
}: SocialesPanelProps) {
  const queryClient = useQueryClient();

  // Match Session behavior: only show the room's current Sociale (via primarySocialeId)
  // Don't fetch all Sociales - that causes "whack-a-mole" behavior where closing one shows another
  const { data: sociale, isLoading, error } = useSociale(primarySocialeId ?? undefined);

  const { data: socialites = [] } = useSocialites(sociale?.id);

  const createSociale = useCreateSociale();
  const [isCancelingSocialeId, setIsCancelingSocialeId] = useState<string | null>(null);

  const lastSocialeIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const currentSocialeId = sociale?.id || null;
    if (lastSocialeIdRef.current !== currentSocialeId) {
      lastSocialeIdRef.current = currentSocialeId;
      onSocialeChange?.(currentSocialeId);
    }
  }, [sociale?.id, onSocialeChange]);

  const isSocialeHost = Boolean(userId && sociale && userId === sociale.createdBy);

  const sortedSocialites = useMemo(() => {
    return [...socialites].sort((a, b) => {
      if (a.isHost && !b.isHost) return -1;
      if (!a.isHost && b.isHost) return 1;
      if (a.score !== b.score) return b.score - a.score;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [socialites]);

  const activePlayers = sortedSocialites.filter((s) => s.isActive && !s.isBanned);
  const playerCount = activePlayers.length;
  const currentSocialite = userId ? socialites.find((s) => s.userId === userId) ?? null : null;

  const handleCreateSociale = async (request: CreateSocialeRequest) => {
    try {
      await createSociale.mutateAsync(request);
    } catch (err) {
      console.error('Failed to create Sociale:', err);
    }
  };

  const invalidateSocialeQueries = async (socialeId?: string | null) => {
    const queries = [
      queryClient.invalidateQueries({ queryKey: ['room', roomId] }),
      queryClient.invalidateQueries({ queryKey: ['sociales', 'room', roomId] }),
    ];

    if (socialeId) {
      queries.push(
        queryClient.invalidateQueries({ queryKey: ['sociale', socialeId] }),
        queryClient.invalidateQueries({ queryKey: ['socialites', socialeId] }),
        queryClient.invalidateQueries({ queryKey: ['sociale-rounds', socialeId] })
      );
    }

    await Promise.all(queries);
  };

  const handleStartSociale = async (id: string) => {
    try {
      await roomService.startSocialeInRoom({
        roomId,
        socialeSettings: { id },
      });

      await invalidateSocialeQueries(id);
    } catch (err) {
      console.error('Failed to start Sociale:', err);
    }
  };

  const handleCloseSociale = async (s: Sociale) => {
    if (
      !confirm(
        'Close (cancel) this Sociale? Players will no longer see or participate in it. This cannot be undone.'
      )
    ) {
      return;
    }
    try {
      setIsCancelingSocialeId(s.id);

      // Use different service based on whether this is the current active Sociale
      if (primarySocialeId === s.id) {
        // This is the current active Sociale - use room service to clear pointer
        await roomService.endSocialeInRoom({
          roomId,
          socialeId: s.id,
          mode: 'cancel',
        });
      } else {
        // This is a draft/lobby Sociale - use cancel function
        await cancelSociale(s.id);
      }

      await invalidateSocialeQueries(s.id);
      onSocialeChange?.(null);
    } catch (err) {
      console.error('Failed to cancel Sociale:', err);
    } finally {
      setIsCancelingSocialeId(null);
    }
  };

  const handleEndSociale = async (socialeId: string) => {
    const confirmed = window.confirm(
      'End this Sociale for all players? They will no longer see or participate in this game.'
    );
    if (!confirmed) return;

    try {
      // Use different service based on whether this is the current active Sociale
      if (primarySocialeId === socialeId) {
        // This is the current active Sociale - use room service to clear pointer
        await roomService.endSocialeInRoom({
          roomId,
          socialeId,
          mode: 'end',
        });
      } else {
        // This is a draft/lobby Sociale - use direct Sociale service
        await endSociale(socialeId);
      }
      
      await invalidateSocialeQueries(socialeId);
      onSocialeChange?.(null);
    } catch (err) {
      console.error('Failed to end Sociale:', err);
    }
  };

  const handleReturnSocialeToLobby = async (socialeId: string) => {
    try {
      await returnSocialeToLobby(socialeId);

      await invalidateSocialeQueries(socialeId);
      onSocialeChange?.(socialeId);
    } catch (err) {
      console.error('Failed to return Sociale to lobby:', err);
    }
  };

  const renderDraftLobby = (s: Sociale) => (
    <div className="space-y-6 text-left">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className={clsx('text-lg font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
          Sociale
        </h3>
        {isSocialeHost && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={onOpenSocialeSettings}>
              {sociale ? 'Sociale Settings' : 'Create Sociale'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => sociale && void handleCloseSociale(sociale)}
              disabled={!sociale || isCancelingSocialeId === sociale.id}
            >
              Close Sociale
            </Button>
          </div>
        )}
      </div>

      <div className="text-center space-y-2">
        <h1 className={clsx('text-2xl font-bold sm:text-3xl', isDark ? 'text-white' : 'text-slate-900')}>
          {s.title || 'Social Game'}
        </h1>
        {s.description && (
          <p className={clsx('text-base sm:text-lg', isDark ? 'text-slate-300' : 'text-slate-600')}>
            {s.description}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <span
            className={clsx(
              'px-3 py-1 rounded-full',
              isDark ? 'bg-slate-800 text-cyan-300' : 'bg-slate-100 text-slate-700'
            )}
          >
            {s.mode.replace(/_/g, ' ')}
          </span>
          <span
            className={clsx(
              'px-3 py-1 rounded-full',
              isDark ? 'bg-slate-800 text-cyan-300' : 'bg-slate-100 text-slate-700'
            )}
          >
            {s.totalRounds} Rounds
          </span>
        </div>
      </div>

      {s.phaseEndsAt && (
        <div className="flex justify-center">
          <SocialeTimer
            phaseEndsAt={s.phaseEndsAt}
            phase="Starting"
            isPaused={false}
            size="lg"
            showLabel={true}
            position="inline"
          />
        </div>
      )}

      <div className="max-w-md mx-auto">
        <SocialeRoundProgress currentRound={0} totalRounds={s.totalRounds} showLabel={true} />
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className={clsx('text-lg font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
            Players ({playerCount})
          </h2>
          {isSocialeHost && playerCount >= 1 && (
            <Button variant="primary" size="lg" onClick={() => void handleStartSociale(s.id)}>
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
          <div
            className={clsx(
              'text-center py-8 rounded-lg border-2 border-dashed',
              isDark ? 'border-slate-600 text-slate-400' : 'border-slate-300 text-slate-500'
            )}
          >
            <p className="text-lg">No players yet</p>
            <p className="text-sm mt-1">Share the room code to get started!</p>
          </div>
        )}
      </div>

      {isSocialeHost && (
        <div
          className={clsx(
            'rounded-lg p-4 text-sm',
            isDark
              ? 'bg-slate-800/80 border border-slate-600 text-slate-300'
              : 'bg-white border border-slate-200 text-slate-600'
          )}
        >
          <h3 className="font-semibold mb-2">Host Controls</h3>
          <ul className="space-y-1">
            <li>• Wait for players to join</li>
            <li>• Start the game when ready (header Start works anytime; Start Game appears with players)</li>
            <li>• Game will auto-start if a start timer is set</li>
          </ul>
        </div>
      )}
    </div>
  );

  if (error) {
    return (
      <Card className="space-y-5 p-4" isDark={isDark}>
        <div className="text-red-500">Error loading Sociales: {error.message}</div>
      </Card>
    );
  }

  return (
    <>
      <Card className="space-y-5" isDark={isDark}>
        <div className={`border-t pt-5 ${!isDark ? 'border-slate-200' : 'border-cyan-400/20'}`}>
          <div className="mb-3 flex items-center justify-between">
            <h4
              className={`text-sm font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}
            >
              Sociales
            </h4>
            <div className="flex gap-2">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                !isDark 
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-400/30' 
                  : 'bg-pink-500/20 text-pink-400 border border-pink-400/30'
              }`}>
                {sociale ? 'Active' : 'No Sociale'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4">
                <div
                  className={`text-lg font-semibold mb-2 ${!isDark ? 'text-slate-900' : 'text-cyan-400'}`}
                >
                  Loading Sociales...
                </div>
              </div>
            ) : !sociale ? (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div
                    className={`text-lg font-semibold mb-2 ${!isDark ? 'text-slate-900' : 'text-cyan-400'}`}
                  >
                    No Active Sociale
                  </div>
                  <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                    Create a new Sociale or load an existing one to get started
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={onOpenSocialeSettings} variant="outline" size="sm" disabled={createSociale.isPending}>
                      {createSociale.isPending ? 'Creating...' : 'Create Sociale'}
                    </Button>
                    <Button onClick={onOpenLoadSociale} variant="ghost" size="sm">
                      Load Sociale
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4
                      className={`font-medium mb-1 ${!isDark ? 'text-slate-900' : 'text-cyan-100'}`}
                    >
                      {sociale.title || `Sociale ${sociale.id.slice(0, 8)}`}
                    </h4>
                    <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                      Mode: {sociale.mode} • {sociale.totalRounds} rounds
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {sociale.status === 'draft' && (
                      <Button
                        onClick={() => void handleStartSociale(sociale.id)}
                        variant="primary"
                        size="sm"
                      >
                        Start
                      </Button>
                    )}
                    {sociale.status === 'active' && (
                      <Button
                        onClick={() => handleEndSociale(sociale.id)}
                        variant="secondary"
                        size="sm"
                      >
                        End
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      !isDark
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-pink-500/20 text-pink-400 border border-pink-400/30'
                    }`}
                  >
                    {sociale.status === 'draft'
                      ? 'In Draft'
                      : sociale.status === 'active'
                        ? 'In Progress'
                        : sociale.status === 'paused'
                          ? 'Paused'
                          : sociale.status === 'completed'
                            ? 'Completed'
                            : sociale.status}
                  </span>
                </div>

                <div
                  className={`rounded-lg border ${
                    !isDark ? 'bg-gray-50 border-gray-200' : 'bg-slate-700 border-slate-600'
                  } ${sociale.status === 'draft' || sociale.status === 'lobby' ? 'p-4' : 'p-2 sm:p-4'}`}
                >
                  {sociale.status === 'draft' || sociale.status === 'lobby' ? (
                    renderDraftLobby(sociale)
                  ) : (
                    <SocialePhaseRenderer
                      socialeId={sociale.id}
                      userId={userId}
                      isDark={isDark}
                      onCreateNewSociale={onOpenSocialeSettings}
                      onReturnToLobby={() => void handleReturnSocialeToLobby(sociale.id)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </>
  );
}

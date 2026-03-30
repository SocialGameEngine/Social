/**
 * HostActionBar - Sticky bottom action bar for host controls
 * 
 * Implements the bottom primary action bar with:
 * - Large primary action button (44-48px height)
 * - 2-4 secondary icon buttons
 * - Safe-area bottom padding
 * - Keyboard avoidance via --vv-offset
 * 
 * Features:
 * - WCAG 2.2 compliant touch targets (≥44×44px)
 * - Clear pending/confirmed/failed states
 * - Disabled states with tooltips
 */

import { Button } from '@social/ui';
import { useMemo } from 'react';
import type { Session } from '../../../../shared/types';
import { PHASE_ACTION_LABELS } from '../../types/host-panel.types';

interface HostActionBarProps {
  session: Session | null;
  playerCount: number;
  isPerformingAction: boolean;
  isPausingSession: boolean;
  isEndingSession: boolean;
  hasRoom: boolean;
  timer?: number;
  onPrimaryAction: () => void;
  onPauseToggle: () => void;
  onEndSession: () => void;
  onCreateSession: () => void;
  onParticipantsOpen?: () => void;
  onModerationOpen?: () => void;
  onChatOpen?: () => void;
}

// Format timer display
const formatTimer = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function HostActionBar({
  session,
  playerCount,
  isPerformingAction,
  isPausingSession,
  isEndingSession,
  hasRoom,
  timer,
  onPrimaryAction,
  onPauseToggle,
  onEndSession,
  onCreateSession,
  onParticipantsOpen,
  onModerationOpen,
  onChatOpen,
}: HostActionBarProps) {
  // No controls needed if no room
  if (!hasRoom) {
    return null;
  }

  // No session - show create session button
  if (!session) {
    return (
      <div className="host-action-bar-container">
        <Button
          onClick={onCreateSession}
          className="w-full h-14 text-lg font-bold"
        >
          Create Session
        </Button>
      </div>
    );
  }

  // Session ended - show new session button
  if (session.status === 'ended') {
    return (
      <div className="host-action-bar-container">
        <Button
          onClick={onCreateSession}
          className="w-full h-14 text-lg font-bold"
        >
          New Session
        </Button>
      </div>
    );
  }

  // Active session - show phase controls
  const isLobby = session.status === 'lobby';
  const isActivePhase = ['answer', 'vote', 'results'].includes(session.status);
  const canStartGame = isLobby && playerCount > 0;
  const isPaused = session.paused ?? false;

  // Get primary action label
  const primaryLabel = PHASE_ACTION_LABELS[session.status] || 'Continue';

  // Get phase duration for progress bar
  const phaseDuration = useMemo(() => {
    if (!session) return 30;
    
    const settings = session.settings;
    const phase = session.status;
    
    if (phase === 'answer' && settings?.answerSecs) {
      return settings.answerSecs;
    }
    if (phase === 'vote' && settings?.voteSecs) {
      return settings.voteSecs;
    }
    if (phase === 'results' && settings?.resultsSecs) {
      return settings.resultsSecs;
    }
    
    // Default durations
    const defaults = {
      answer: 60,
      vote: 30,
      results: 15,
    };
    
    return defaults[phase as keyof typeof defaults] || 30;
  }, [session?.status, session?.settings]);

  return (
    <div className="host-action-bar-container">
      {/* Status indicator row */}
      <div className="flex items-center justify-between px-1 py-2 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <span 
            className={`w-2 h-2 rounded-full ${
              isPaused ? 'bg-yellow-400' : 'bg-green-400'
            } ${!isPaused && 'animate-pulse'}`} 
            aria-hidden="true"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-cyan-300 uppercase tracking-wide">
              {timer !== undefined && timer > 0 ? formatTimer(timer) : isPaused ? 'Paused' : session.status}
            </span>
            {timer !== undefined && (
              <span className="text-xs text-slate-400">Time Remaining</span>
            )}
          </div>
        </div>
        <span className="text-xs text-slate-400">
          Round {session.roundIndex + 1}
          {session.settings?.totalRounds ? ` / ${session.settings.totalRounds}` : ''}
        </span>
      </div>

      {/* Timer progress bar */}
      {timer !== undefined && timer > 0 && (
        <div className="px-1 py-2">
          <div className="relative w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-linear ${
                timer <= 10 ? 'bg-red-500' : timer <= (phaseDuration * 0.33) ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${(timer / phaseDuration) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Control buttons row */}
      <div className="flex items-center gap-3 pt-3">
        {/* Secondary actions - icon buttons */}
        <div className="flex gap-2">
          {/* Pause/Resume button - only during active phases */}
          {isActivePhase && (
            <button
              onClick={onPauseToggle}
              disabled={isPausingSession}
              className="host-icon-button"
              aria-label={isPaused ? 'Resume session' : 'Pause session'}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              )}
            </button>
          )}

          {/* Participants button */}
          {onParticipantsOpen && (
            <button
              onClick={onParticipantsOpen}
              className="host-icon-button"
              aria-label="View participants"
              title="Participants"
            >
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {playerCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-pink-500 rounded-full">
                  {playerCount > 99 ? '99+' : playerCount}
                </span>
              )}
            </button>
          )}

          {/* Chat button */}
          {onChatOpen && (
            <button
              onClick={onChatOpen}
              className="host-icon-button"
              aria-label="Open chat"
              title="Chat"
            >
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          )}

          {/* End session button - danger action */}
          {(isLobby || isActivePhase) && (
            <button
              onClick={onEndSession}
              disabled={isEndingSession}
              className="host-icon-button hover:bg-rose-600/80 active:bg-rose-500"
              aria-label="End session"
              title="End Session"
            >
              <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Primary action button - takes remaining space */}
        <Button
          onClick={onPrimaryAction}
          disabled={isPerformingAction || (isLobby && !canStartGame)}
          isLoading={isPerformingAction}
          className="flex-1 h-12 text-base font-bold min-w-0"
          title={isLobby && !canStartGame ? 'Waiting for players to join' : undefined}
        >
          {primaryLabel}
        </Button>
      </div>

      {/* Disabled state hint */}
      {isLobby && !canStartGame && (
        <p className="text-xs text-slate-400 text-center mt-2">
          Waiting for players to join...
        </p>
      )}
    </div>
  );
}

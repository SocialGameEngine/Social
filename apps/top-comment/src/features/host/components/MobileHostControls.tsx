/**
 * MobileHostControls - Sticky bottom control bar for mobile host view
 * 
 * Provides thumb-friendly access to critical host actions:
 * - Primary action (Start Game / Lock Answers / Lock Votes / Next Round)
 * - Pause/Resume toggle
 * - End Session
 * 
 * Designed for one-handed operation during live sessions.
 */

import { Button } from '@social/ui';
import { actionLabel } from '../../../shared/constants';
import type { Session } from '../../../shared/types';

interface MobileHostControlsProps {
  session: Session | null;
  onPrimaryAction: () => void;
  onPauseToggle: () => void;
  onEndSession: () => void;
  onCreateSession: () => void;
  isPerformingAction: boolean;
  isPausingSession: boolean;
  isEndingSession: boolean;
  playerCount: number;
  hasRoom: boolean;
}

export function MobileHostControls({
  session,
  onPrimaryAction,
  onPauseToggle,
  onEndSession,
  onCreateSession,
  isPerformingAction,
  isPausingSession,
  isEndingSession,
  playerCount,
  hasRoom,
}: MobileHostControlsProps) {
  // No controls needed if no room
  if (!hasRoom) {
    return null;
  }

  // No session - show create session button
  if (!session) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-sm border-t border-cyan-400/20 px-4 py-3 pb-safe">
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
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-sm border-t border-cyan-400/20 px-4 py-3 pb-safe">
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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-sm border-t border-cyan-400/20 safe-area-bottom">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${session.paused ? 'bg-yellow-400' : 'bg-green-400'} ${!session.paused && 'animate-pulse'}`} />
          <span className="text-xs font-medium text-cyan-300 uppercase tracking-wide">
            {session.paused ? 'Paused' : session.status}
          </span>
        </div>
        <span className="text-xs text-slate-400">
          Round {session.roundIndex + 1}
        </span>
      </div>

      {/* Control buttons */}
      <div className="flex items-center gap-3 px-4 py-3 pb-safe">
        {/* Secondary actions */}
        <div className="flex gap-2">
          {isActivePhase && (
            <button
              onClick={onPauseToggle}
              disabled={isPausingSession}
              className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:opacity-50 transition-colors"
              aria-label={session.paused ? 'Resume' : 'Pause'}
            >
              {session.paused ? (
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
          
          {(isLobby || isActivePhase) && (
            <button
              onClick={onEndSession}
              disabled={isEndingSession}
              className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-700 hover:bg-rose-600/80 active:bg-rose-500 disabled:opacity-50 transition-colors"
              aria-label="End Session"
            >
              <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Primary action - takes remaining space */}
        <Button
          onClick={onPrimaryAction}
          disabled={isPerformingAction || (isLobby && !canStartGame)}
          isLoading={isPerformingAction}
          className="flex-1 h-12 text-base font-bold"
        >
          {actionLabel[session.status]}
        </Button>
      </div>
    </div>
  );
}

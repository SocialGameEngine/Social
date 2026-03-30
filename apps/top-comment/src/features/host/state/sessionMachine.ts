/**
 * Session State Machine
 * 
 * Hook-based state machine representing session phases with substates for:
 * - paused
 * - reconnecting
 * - offline
 * 
 * Controls UI overlays and gates actions based on current state.
 * Can be upgraded to XState in the future if needed.
 */

import { useReducer, useCallback, useMemo } from 'react';
import type { SessionStatus, Session } from '../../../shared/types';

// ============================================================================
// Context & Event Types
// ============================================================================

export interface SessionMachineContext {
  sessionId: string | null;
  phase: SessionStatus;
  phaseVersion: number;
  isPaused: boolean;
  isOffline: boolean;
  isReconnecting: boolean;
  playerCount: number;
  roundIndex: number;
  totalRounds: number;
  error: string | null;
  lastActionTimestamp: number | null;
}

export type SessionMachineEvent =
  | { type: 'SYNC'; session: Partial<SessionMachineContext> }
  | { type: 'ADVANCE' }
  | { type: 'ADVANCE_SUCCESS'; phase: SessionStatus; phaseVersion: number }
  | { type: 'ADVANCE_FAILURE'; error: string }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'PAUSE_SUCCESS'; isPaused: boolean }
  | { type: 'PAUSE_FAILURE'; error: string }
  | { type: 'END_SESSION' }
  | { type: 'END_SESSION_SUCCESS' }
  | { type: 'END_SESSION_FAILURE'; error: string }
  | { type: 'GO_OFFLINE' }
  | { type: 'GO_ONLINE' }
  | { type: 'RECONNECTING' }
  | { type: 'RECONNECTED' }
  | { type: 'PLAYER_JOINED'; playerCount: number }
  | { type: 'PLAYER_LEFT'; playerCount: number }
  | { type: 'RESET' };

// ============================================================================
// Initial Context
// ============================================================================

const initialContext: SessionMachineContext = {
  sessionId: null,
  phase: 'lobby',
  phaseVersion: 0,
  isPaused: false,
  isOffline: false,
  isReconnecting: false,
  playerCount: 0,
  roundIndex: 0,
  totalRounds: 5,
  error: null,
  lastActionTimestamp: null,
};

// ============================================================================
// Guards
// ============================================================================

const guards = {
  canAdvance: (context: SessionMachineContext) => {
    // Cannot advance if paused or offline
    if (context.isPaused || context.isOffline) return false;
    // Cannot advance from ended state
    if (context.phase === 'ended') return false;
    // Cannot start game with no players
    if (context.phase === 'lobby' && context.playerCount === 0) return false;
    return true;
  },
  canPause: (context: SessionMachineContext) => {
    // Can only pause during active phases
    return ['answer', 'vote', 'results'].includes(context.phase) && !context.isOffline;
  },
  canResume: (context: SessionMachineContext) => {
    return context.isPaused && !context.isOffline;
  },
  canEndSession: (context: SessionMachineContext) => {
    return context.phase !== 'ended' && !context.isOffline;
  },
  isOnline: (context: SessionMachineContext) => !context.isOffline,
  isOffline: (context: SessionMachineContext) => context.isOffline,
};

// ============================================================================
// Reducer
// ============================================================================

type MachineState = 'idle' | 'active' | 'advancing' | 'pausing' | 'resuming' | 'ending' | 'offline' | 'reconnecting' | 'ended';

interface FullState {
  machineState: MachineState;
  context: SessionMachineContext;
}

function sessionReducer(state: FullState, event: SessionMachineEvent): FullState {
  const { machineState, context } = state;

  switch (event.type) {
    case 'SYNC':
      return {
        machineState: machineState === 'idle' ? 'active' : machineState,
        context: {
          ...context,
          sessionId: event.session.sessionId ?? context.sessionId,
          phase: event.session.phase ?? context.phase,
          phaseVersion: event.session.phaseVersion ?? context.phaseVersion,
          isPaused: event.session.isPaused ?? context.isPaused,
          playerCount: event.session.playerCount ?? context.playerCount,
          roundIndex: event.session.roundIndex ?? context.roundIndex,
          totalRounds: event.session.totalRounds ?? context.totalRounds,
        },
      };

    case 'ADVANCE':
      if (!guards.canAdvance(context)) return state;
      return { ...state, machineState: 'advancing' };

    case 'ADVANCE_SUCCESS':
      return {
        machineState: 'active',
        context: {
          ...context,
          phase: event.phase,
          phaseVersion: event.phaseVersion,
          lastActionTimestamp: Date.now(),
          error: null,
        },
      };

    case 'ADVANCE_FAILURE':
      return {
        machineState: 'active',
        context: { ...context, error: event.error },
      };

    case 'PAUSE':
      if (!guards.canPause(context)) return state;
      return { ...state, machineState: 'pausing' };

    case 'RESUME':
      if (!guards.canResume(context)) return state;
      return { ...state, machineState: 'resuming' };

    case 'PAUSE_SUCCESS':
      return {
        machineState: 'active',
        context: {
          ...context,
          isPaused: event.isPaused,
          lastActionTimestamp: Date.now(),
          error: null,
        },
      };

    case 'PAUSE_FAILURE':
      return {
        machineState: 'active',
        context: { ...context, error: event.error },
      };

    case 'END_SESSION':
      if (!guards.canEndSession(context)) return state;
      return { ...state, machineState: 'ending' };

    case 'END_SESSION_SUCCESS':
      return {
        machineState: 'ended',
        context: {
          ...context,
          phase: 'ended',
          lastActionTimestamp: Date.now(),
          error: null,
        },
      };

    case 'END_SESSION_FAILURE':
      return {
        machineState: 'active',
        context: { ...context, error: event.error },
      };

    case 'GO_OFFLINE':
      return {
        machineState: 'offline',
        context: { ...context, isOffline: true, isReconnecting: false },
      };

    case 'GO_ONLINE':
      return {
        machineState: 'active',
        context: { ...context, isOffline: false, isReconnecting: false },
      };

    case 'RECONNECTING':
      return {
        machineState: 'reconnecting',
        context: { ...context, isReconnecting: true },
      };

    case 'RECONNECTED':
      return {
        machineState: 'active',
        context: { ...context, isReconnecting: false, isOffline: false },
      };

    case 'PLAYER_JOINED':
    case 'PLAYER_LEFT':
      return {
        ...state,
        context: { ...context, playerCount: event.playerCount },
      };

    case 'RESET':
      return { machineState: 'idle', context: initialContext };

    default:
      return state;
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useSessionMachine(session?: Session | null, playerCount = 0) {
  const [state, dispatch] = useReducer(sessionReducer, {
    machineState: session ? 'active' : 'idle',
    context: {
      ...initialContext,
      sessionId: session?.id ?? null,
      phase: session?.status ?? 'lobby',
      isPaused: session?.paused ?? false,
      roundIndex: session?.roundIndex ?? 0,
      totalRounds: session?.settings?.totalRounds ?? 5,
      playerCount,
    },
  });

  const send = useCallback((event: SessionMachineEvent) => {
    dispatch(event);
  }, []);

  const syncSession = useCallback((sessionData: Partial<SessionMachineContext>) => {
    dispatch({ type: 'SYNC', session: sessionData });
  }, []);

  const canAdvance = useMemo(() => guards.canAdvance(state.context), [state.context]);
  const canPause = useMemo(() => guards.canPause(state.context), [state.context]);
  const canResume = useMemo(() => guards.canResume(state.context), [state.context]);
  const canEndSession = useMemo(() => guards.canEndSession(state.context), [state.context]);

  const isPerformingAction = useMemo(() => 
    ['advancing', 'pausing', 'resuming', 'ending'].includes(state.machineState),
    [state.machineState]
  );

  return {
    state: state.machineState,
    context: state.context,
    send,
    syncSession,
    canAdvance,
    canPause,
    canResume,
    canEndSession,
    isPerformingAction,
    isOffline: state.context.isOffline,
    isReconnecting: state.context.isReconnecting,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getNextPhase(currentPhase: SessionStatus): SessionStatus | null {
  const phaseOrder: SessionStatus[] = ['lobby', 'answer', 'vote', 'results'];
  const currentIndex = phaseOrder.indexOf(currentPhase);
  
  if (currentIndex === -1 || currentIndex === phaseOrder.length - 1) {
    // Results goes back to answer for next round, or ended if all rounds complete
    if (currentPhase === 'results') {
      return 'answer'; // Will be 'ended' if all rounds complete - handled by server
    }
    return null;
  }
  
  return phaseOrder[currentIndex + 1];
}

export function canPerformAction(
  context: SessionMachineContext,
  action: 'advance' | 'pause' | 'resume' | 'end'
): boolean {
  switch (action) {
    case 'advance':
      return guards.canAdvance(context);
    case 'pause':
      return guards.canPause(context);
    case 'resume':
      return guards.canResume(context);
    case 'end':
      return guards.canEndSession(context);
    default:
      return false;
  }
}

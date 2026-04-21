/**
 * Host Panel State Management
 * 
 * Exports state machine and related utilities for host panel.
 */

export {
  useSessionMachine,
  getNextPhase,
  canPerformAction,
  type SessionMachineContext,
  type SessionMachineEvent,
} from './sessionMachine';

export {
  useOfflineQueue,
  useOfflineQueueWithConnection,
  createOfflineQueue,
  type QueuedAction,
  type QueuedActionType,
  type OfflineQueueState,
} from './offlineQueue';

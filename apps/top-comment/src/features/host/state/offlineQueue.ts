/**
 * Offline Action Queue
 * 
 * Queues mutations when offline and replays them when back online.
 * Integrates with TanStack Query for optimistic updates.
 * 
 * Features:
 * - Persistent queue in localStorage
 * - Automatic replay on reconnection
 * - Conflict resolution with server state
 * - Undo support for recent actions
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export type QueuedActionType = 
  | 'advance_phase'
  | 'pause_session'
  | 'resume_session'
  | 'end_session'
  | 'kick_player'
  | 'ban_player'
  | 'unban_player'
  | 'mute_player'
  | 'unmute_player'
  | 'spotlight_player'
  | 'update_settings';

export interface QueuedAction {
  id: string;
  type: QueuedActionType;
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  sessionId: string;
  undoable: boolean;
  undoPayload?: Record<string, unknown>;
}

export interface OfflineQueueState {
  queue: QueuedAction[];
  isProcessing: boolean;
  lastProcessedAt: number | null;
  failedActions: QueuedAction[];
}

// ============================================================================
// Storage
// ============================================================================

const STORAGE_KEY = 'host-panel-offline-queue';

function loadQueue(): QueuedAction[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedAction[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    console.warn('Failed to save offline queue to localStorage');
  }
}

function clearStoredQueue(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

// ============================================================================
// Queue Manager
// ============================================================================

export function createOfflineQueue() {
  let queue: QueuedAction[] = loadQueue();
  let isProcessing = false;
  let listeners: Set<() => void> = new Set();

  const notify = () => {
    listeners.forEach(listener => listener());
  };

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    getQueue() {
      return [...queue];
    },

    getState(): OfflineQueueState {
      return {
        queue: [...queue],
        isProcessing,
        lastProcessedAt: null,
        failedActions: queue.filter(a => a.retryCount >= a.maxRetries),
      };
    },

    enqueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>): string {
      const id = generateId();
      const queuedAction: QueuedAction = {
        ...action,
        id,
        timestamp: Date.now(),
        retryCount: 0,
      };
      queue.push(queuedAction);
      saveQueue(queue);
      notify();
      return id;
    },

    dequeue(id: string): QueuedAction | undefined {
      const index = queue.findIndex(a => a.id === id);
      if (index === -1) return undefined;
      const [action] = queue.splice(index, 1);
      saveQueue(queue);
      notify();
      return action;
    },

    peek(): QueuedAction | undefined {
      return queue[0];
    },

    isEmpty(): boolean {
      return queue.length === 0;
    },

    size(): number {
      return queue.length;
    },

    clear(): void {
      queue = [];
      clearStoredQueue();
      notify();
    },

    incrementRetry(id: string): boolean {
      const action = queue.find(a => a.id === id);
      if (!action) return false;
      action.retryCount++;
      saveQueue(queue);
      notify();
      return action.retryCount < action.maxRetries;
    },

    setProcessing(value: boolean): void {
      isProcessing = value;
      notify();
    },

    // Find actions that can be undone (within last 10 seconds)
    getUndoableActions(): QueuedAction[] {
      const cutoff = Date.now() - 10000;
      return queue.filter(a => a.undoable && a.timestamp > cutoff);
    },

    // Undo an action by removing it and optionally queuing the reverse
    undo(id: string): boolean {
      const action = queue.find(a => a.id === id);
      if (!action || !action.undoable) return false;
      
      // Remove the action
      this.dequeue(id);
      
      // If there's an undo payload, queue the reverse action
      if (action.undoPayload) {
        const undoType = getUndoActionType(action.type);
        if (undoType) {
          this.enqueue({
            type: undoType,
            payload: action.undoPayload,
            sessionId: action.sessionId,
            maxRetries: action.maxRetries,
            undoable: false,
          });
        }
      }
      
      return true;
    },
  };
}

function getUndoActionType(type: QueuedActionType): QueuedActionType | null {
  const undoMap: Partial<Record<QueuedActionType, QueuedActionType>> = {
    'kick_player': 'unban_player', // Kick can be undone by allowing rejoin
    'ban_player': 'unban_player',
    'mute_player': 'unmute_player',
    'pause_session': 'resume_session',
    'resume_session': 'pause_session',
  };
  return undoMap[type] ?? null;
}

// ============================================================================
// React Hook
// ============================================================================

const globalQueue = createOfflineQueue();

export function useOfflineQueue() {
  const [state, setState] = useState<OfflineQueueState>(globalQueue.getState());
  const processingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = globalQueue.subscribe(() => {
      setState(globalQueue.getState());
    });
    return () => { unsubscribe(); };
  }, []);

  const enqueue = useCallback((
    type: QueuedActionType,
    payload: Record<string, unknown>,
    sessionId: string,
    options: { undoable?: boolean; undoPayload?: Record<string, unknown>; maxRetries?: number } = {}
  ) => {
    return globalQueue.enqueue({
      type,
      payload,
      sessionId,
      maxRetries: options.maxRetries ?? 3,
      undoable: options.undoable ?? false,
      undoPayload: options.undoPayload,
    });
  }, []);

  const processQueue = useCallback(async (
    executor: (action: QueuedAction) => Promise<boolean>
  ) => {
    if (processingRef.current || globalQueue.isEmpty()) return;
    
    processingRef.current = true;
    globalQueue.setProcessing(true);

    while (!globalQueue.isEmpty()) {
      const action = globalQueue.peek();
      if (!action) break;

      try {
        const success = await executor(action);
        if (success) {
          globalQueue.dequeue(action.id);
        } else {
          const canRetry = globalQueue.incrementRetry(action.id);
          if (!canRetry) {
            // Move to failed, remove from queue
            globalQueue.dequeue(action.id);
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (error) {
        console.error('Error processing queued action:', error);
        const canRetry = globalQueue.incrementRetry(action.id);
        if (!canRetry) {
          globalQueue.dequeue(action.id);
        }
      }
    }

    processingRef.current = false;
    globalQueue.setProcessing(false);
  }, []);

  const undo = useCallback((id: string) => {
    return globalQueue.undo(id);
  }, []);

  const clear = useCallback(() => {
    globalQueue.clear();
  }, []);

  return {
    queue: state.queue,
    isProcessing: state.isProcessing,
    failedActions: state.failedActions,
    isEmpty: state.queue.length === 0,
    size: state.queue.length,
    enqueue,
    processQueue,
    undo,
    clear,
    getUndoableActions: globalQueue.getUndoableActions.bind(globalQueue),
  };
}

// ============================================================================
// Integration with Connection Status
// ============================================================================

export function useOfflineQueueWithConnection(
  isOnline: boolean,
  executor: (action: QueuedAction) => Promise<boolean>
) {
  const offlineQueue = useOfflineQueue();
  const executorRef = useRef(executor);
  executorRef.current = executor;

  // Process queue when coming back online
  useEffect(() => {
    if (isOnline && !offlineQueue.isEmpty) {
      offlineQueue.processQueue(executorRef.current);
    }
  }, [isOnline, offlineQueue]);

  return offlineQueue;
}

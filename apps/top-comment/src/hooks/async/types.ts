/**
 * Async State Architecture - Type Definitions
 * 
 * Standardized async state vocabulary and contracts for the Social Game Engine.
 * Based on the Async State Architecture Implementation Plan.
 */

export type AsyncStatus =
  | "booting"
  | "loading"
  | "joining"
  | "submitting"
  | "syncing"
  | "reconnecting"
  | "recovering"
  | "stale"
  | "degraded"
  | "empty"
  | "error"
  | "ready";

export interface AsyncQueryResult<T> {
  status: AsyncStatus;
  data: T | null;
  error: Error | null;
  retry: () => void;
  lastUpdatedAt: number | null;
  isStale: boolean;
  canInteract: boolean;
}

export interface AsyncMutationResult<TData, TVars> {
  mutate: (vars: TVars) => Promise<TData>;
  status: "idle" | "submitting" | "success" | "error";
  error: Error | null;
  reset: () => void;
}

export type ConnectionStatus = 
  | "connecting" 
  | "connected" 
  | "disconnected" 
  | "reconnecting" 
  | "error";

export interface AsyncSubscriptionResult<T> extends AsyncQueryResult<T> {
  connectionStatus: ConnectionStatus;
  reconnect: () => void;
  subscriptionError: Error | null;
}

export interface BootState {
  status: "booting" | "auth_resolving" | "venue_loading" | "ready" | "auth_required" | "error";
  error: Error | null;
}

export interface RecoveryState {
  status: "checking_storage" | "validating" | "recovered" | "expired" | "corrupted";
  error: Error | null;
}

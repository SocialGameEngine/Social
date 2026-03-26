/**
 * Async State Architecture - Query Hook
 * 
 * Standardized wrapper for data fetching operations.
 * Provides consistent loading, error, and stale state handling.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { AsyncQueryResult, AsyncStatus } from "./types";

interface UseAsyncQueryOptions<TData, TError = Error> 
  extends Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn"> {
  staleThreshold?: number;
}

export function useAsyncQuery<TData>(
  queryKey: unknown[],
  queryFn: () => Promise<TData>,
  options?: UseAsyncQueryOptions<TData>
): AsyncQueryResult<TData> {
  const staleThreshold = options?.staleThreshold ?? 30000;

  const query = useQuery({
    queryKey,
    queryFn,
    ...options,
  });

  const getStatus = (): AsyncStatus => {
    if (query.isLoading && !query.data) return "loading";
    if (query.isError) return "error";
    if (query.data === null || query.data === undefined) return "empty";
    if (query.isFetching && query.data) return "syncing";
    if (query.isStale) return "stale";
    return "ready";
  };

  const isStale = query.dataUpdatedAt 
    ? Date.now() - query.dataUpdatedAt > staleThreshold
    : false;

  const canInteract = !query.isLoading || !!query.data;

  return {
    status: getStatus(),
    data: query.data ?? null,
    error: query.error,
    retry: () => query.refetch(),
    lastUpdatedAt: query.dataUpdatedAt || null,
    isStale,
    canInteract,
  };
}

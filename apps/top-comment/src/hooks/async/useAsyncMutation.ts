/**
 * Async State Architecture - Mutation Hook
 * 
 * Standardized wrapper for user actions and mutations.
 * Provides consistent submitting, success, and error state handling.
 */

import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import type { AsyncMutationResult } from "./types";

export function useAsyncMutation<TData, TVars>(
  mutationFn: (variables: TVars) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, Error, TVars>, "mutationFn">
): AsyncMutationResult<TData, TVars> {
  const mutation = useMutation({
    mutationFn,
    ...options,
  });

  const getStatus = () => {
    if (mutation.isPending) return "submitting" as const;
    if (mutation.isSuccess) return "success" as const;
    if (mutation.isError) return "error" as const;
    return "idle" as const;
  };

  return {
    mutate: mutation.mutateAsync,
    status: getStatus(),
    error: mutation.error,
    reset: mutation.reset,
  };
}

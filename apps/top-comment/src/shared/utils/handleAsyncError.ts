// =============================================================================
// UNIFIED ASYNC ERROR HANDLER
// =============================================================================
// Standardized error handling for async operations across the application.

import type { Toast } from '../hooks/useToast';
import { logger } from './logger';

export interface AsyncErrorOptions {
  /** Toast function for user notifications */
  toast?: Toast;
  /** Whether to log the error (default: true) */
  log?: boolean;
  /** Context string for logging (e.g., "createSession", "joinSociale") */
  context?: string;
  /** Custom user-facing message (default: derived from error) */
  userMessage?: string;
  /** Whether to rethrow the error after handling (default: false) */
  rethrow?: boolean;
}

/**
 * Handle async errors with consistent logging and user notification
 * 
 * @example
 * ```ts
 * try {
 *   await someAsyncOperation();
 * } catch (error) {
 *   handleAsyncError(error, {
 *     toast,
 *     context: 'someAsyncOperation',
 *     userMessage: 'Failed to complete operation'
 *   });
 * }
 * ```
 */
export function handleAsyncError(
  error: unknown,
  options: AsyncErrorOptions = {}
): void {
  const {
    toast,
    log = true,
    context = 'operation',
    userMessage,
    rethrow = false,
  } = options;

  // Extract error message
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
    ? error 
    : 'An unknown error occurred';

  // Log the error
  if (log) {
    logger.error(`Error in ${context}: ${errorMessage}`);
  }

  // Show user notification
  if (toast) {
    toast({
      title: userMessage || `Failed to ${context}`,
      description: errorMessage,
      variant: 'error',
    });
  }

  // Rethrow if requested
  if (rethrow) {
    throw error;
  }
}

/**
 * Handle Supabase-specific errors with PGRST116 (no rows) handling
 * 
 * @example
 * ```ts
 * const { data, error } = await supabase.from('table').select().single();
 * if (error) {
 *   handleSupabaseError(error, {
 *     toast,
 *     context: 'fetchData',
 *     allowNoRows: true, // Return null instead of throwing
 *   });
 *   return null;
 * }
 * ```
 */
export function handleSupabaseError(
  error: { code?: string; message?: string },
  options: AsyncErrorOptions & { allowNoRows?: boolean } = {}
): void {
  const { allowNoRows = false, ...asyncOptions } = options;

  // Handle PGRST116 (no rows found) gracefully if allowed
  if (allowNoRows && (error.code === 'PGRST116' || /0 rows/i.test(error.message || ''))) {
    return;
  }

  handleAsyncError(error, asyncOptions);
}

/**
 * Wrap an async function with error handling
 * 
 * @example
 * ```ts
 * const safeCreateSession = withAsyncErrorHandling(
 *   createSession,
 *   { toast, context: 'createSession' }
 * );
 * 
 * await safeCreateSession(payload);
 * ```
 */
export function withAsyncErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: AsyncErrorOptions
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleAsyncError(error, options);
    }
  }) as T;
}

// =============================================================================
// UNIFIED ERROR HANDLING UTILITY
// =============================================================================
// Standardized error handling with logging and user feedback.

import { logger } from './logger';
import { getErrorMessage } from './errors';
import type { Toast } from '../hooks/useToast';

export type { Toast };

export interface ErrorHandlingOptions {
  /** Toast function for user feedback */
  toast?: Toast;
  /** Logger instance (defaults to shared logger) */
  logger?: typeof logger;
  /** Context string for logging (e.g., 'CreateSession', 'KickPlayer') */
  context?: string;
  /** Custom user-facing message (defaults to error message) */
  userMessage?: string;
  /** Log level to use */
  logLevel?: 'error' | 'warn' | 'info';
  /** Whether to show toast notification */
  showToast?: boolean;
}

/**
 * Handle async errors with consistent logging and user feedback
 * 
 * @example
 * ```ts
 * try {
 *   await createSession(data);
 * } catch (error) {
 *   await handleAsyncError(error, {
 *     toast,
 *     context: 'CreateSession',
 *     userMessage: 'Failed to create session',
 *   });
 * }
 * ```
 */
export async function handleAsyncError(
  error: unknown,
  options: ErrorHandlingOptions = {}
): Promise<void> {
  const {
    toast,
    logger: log = logger,
    context = 'Unknown',
    userMessage,
    logLevel = 'error',
    showToast = true,
  } = options;

  const errorMessage = getErrorMessage(error);
  
  // Log to console/service
  if (log) {
    log[logLevel](`[${context}] ${errorMessage}`, { error });
  }
  
  // Show user toast
  if (toast && showToast) {
    toast({
      title: userMessage || errorMessage,
      variant: 'error',
    });
  }
}

/**
 * Handle sync errors with consistent logging and user feedback
 * Same as handleAsyncError but synchronous
 */
export function handleError(
  error: unknown,
  options: ErrorHandlingOptions = {}
): void {
  const {
    toast,
    logger: log = logger,
    context = 'Unknown',
    userMessage,
    logLevel = 'error',
    showToast = true,
  } = options;

  const errorMessage = getErrorMessage(error);
  
  // Log to console/service
  if (log) {
    log[logLevel](`[${context}] ${errorMessage}`, { error });
  }
  
  // Show user toast
  if (toast && showToast) {
    toast({
      title: userMessage || errorMessage,
      variant: 'error',
    });
  }
}

/**
 * Wrap an async function with error handling
 * 
 * @example
 * ```ts
 * const safeCreateSession = withErrorHandling(
 *   createSession,
 *   { toast, context: 'CreateSession' }
 * );
 * await safeCreateSession(data);
 * ```
 */
export function withErrorHandling<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: ErrorHandlingOptions
): (...args: TArgs) => Promise<TReturn | undefined> {
  return async (...args: TArgs): Promise<TReturn | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      await handleAsyncError(error, options);
      return undefined;
    }
  };
}

/**
 * Create a standardized error with context
 */
export function createError(message: string, context?: string, cause?: unknown): Error {
  const error = new Error(context ? `[${context}] ${message}` : message);
  if (cause) {
    (error as Error & { cause?: unknown }).cause = cause;
  }
  return error;
}

/**
 * Assert a condition and throw a standardized error if false
 */
export function assert(condition: unknown, message: string, context?: string): asserts condition {
  if (!condition) {
    throw createError(message, context);
  }
}

/**
 * Handle success with optional toast notification
 */
export function handleSuccess(
  message: string,
  options: {
    toast?: Toast;
    logger?: typeof logger;
    context?: string;
  } = {}
): void {
  const { toast, logger: log = logger, context } = options;
  
  if (log && context) {
    log.info(`[${context}] ${message}`);
  }
  
  if (toast) {
    toast({
      title: message,
      variant: 'success',
    });
  }
}

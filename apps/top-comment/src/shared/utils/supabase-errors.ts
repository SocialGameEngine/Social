// =============================================================================
// SUPABASE ERROR HANDLING UTILITIES
// =============================================================================
// Standardized error handling for Supabase operations.

export const SUPABASE_ERROR_CODES = {
  NO_ROWS: 'PGRST116',
  UNAUTHORIZED: 'PGRST301',
  FORBIDDEN: 'PGRST302',
  NOT_FOUND: 'PGRST106',
  CONFLICT: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
} as const;

export type SupabaseErrorCode = typeof SUPABASE_ERROR_CODES[keyof typeof SUPABASE_ERROR_CODES];

/**
 * Check if error is a "no rows returned" error (PGRST116)
 */
export function isNoRowsError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  return (error as { code?: string }).code === SUPABASE_ERROR_CODES.NO_ROWS;
}

/**
 * Check if error is an unauthorized error (PGRST301)
 */
export function isUnauthorizedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  return (error as { code?: string }).code === SUPABASE_ERROR_CODES.UNAUTHORIZED;
}

/**
 * Check if error is a forbidden error (PGRST302)
 */
export function isForbiddenError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  return (error as { code?: string }).code === SUPABASE_ERROR_CODES.FORBIDDEN;
}

/**
 * Check if error is a conflict error (duplicate key)
 */
export function isConflictError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  return (error as { code?: string }).code === SUPABASE_ERROR_CODES.CONFLICT;
}

/**
 * Handle Supabase errors with common patterns
 * 
 * @example
 * ```ts
 * const { data, error } = await supabase.from('table').select().single();
 * if (error) {
 *   return handleSupabaseError(error, { returnOnNoRows: null });
 * }
 * ```
 */
export function handleSupabaseError<T>(
  error: unknown,
  options: {
    /** Value to return if error is PGRST116 (no rows) */
    returnOnNoRows?: T;
    /** Whether to throw on no rows error instead of returning */
    throwOnNoRows?: boolean;
    /** Custom error message */
    message?: string;
  } = {}
): T | never {
  const { returnOnNoRows, throwOnNoRows = false, message } = options;

  // Handle no rows error
  if (isNoRowsError(error)) {
    if (throwOnNoRows) {
      throw new Error(message || 'No rows found');
    }
    if (returnOnNoRows !== undefined) {
      return returnOnNoRows;
    }
  }

  // Handle unauthorized
  if (isUnauthorizedError(error)) {
    throw new Error(message || 'Unauthorized access');
  }

  // Handle forbidden
  if (isForbiddenError(error)) {
    throw new Error(message || 'Access forbidden');
  }

  // Re-throw original error
  throw error;
}

/**
 * Safe wrapper for Supabase queries that may return no rows
 * Returns null instead of throwing on PGRST116
 */
export async function safeSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>
): Promise<T | null> {
  const { data, error } = await queryFn();
  
  if (error) {
    if (isNoRowsError(error)) {
      return null;
    }
    throw error;
  }
  
  return data;
}

/**
 * Extract error message from Supabase error object
 */
export function getSupabaseErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error';
  
  if (typeof error === 'string') return error;
  
  if (typeof error === 'object') {
    const err = error as { message?: string; hint?: string; details?: string };
    return err.message || err.hint || err.details || 'Unknown error';
  }
  
  return String(error);
}

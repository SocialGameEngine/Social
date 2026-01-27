/**
 * Error handling utilities for VIBox operations
 */

export interface QueueErrorHandler {
  (error: unknown, operation: string, toast: (options: { title: string; variant: "success" | "error" | "info" }) => void): void;
}

/**
 * Standardized error handler for queue operations
 * @param error - The error that occurred
 * @param operation - Description of the operation that failed
 * @param toast - Toast notification function
 */
export const handleQueueError: QueueErrorHandler = (error, operation, toast) => {
  console.error(`Error ${operation}:`, error);
  
  toast({ 
    title: `Failed to ${operation}`, 
    variant: "error" 
  });
};

/**
 * Standardized success handler for queue operations
 * @param message - Success message
 * @param toast - Toast notification function
 */
export const handleQueueSuccess = (
  message: string, 
  toast: (options: { title: string; variant: "success" | "error" | "info" }) => void
) => {
  toast({ 
    title: message, 
    variant: "success" 
  });
};

/**
 * Standardized info handler for queue operations
 * @param message - Info message
 * @param toast - Toast notification function
 */
export const handleQueueInfo = (
  message: string, 
  toast: (options: { title: string; variant: "success" | "error" | "info" }) => void
) => {
  toast({ 
    title: message, 
    variant: "info" 
  });
};

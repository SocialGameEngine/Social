/**
 * Error State Component
 * 
 * Reusable error display with retry functionality.
 * Provides contextual messaging and recovery options.
 */

import { motion } from "framer-motion";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  onCancel?: () => void;
  cancelLabel?: string;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  onCancel,
  cancelLabel = "Go back",
  className = "",
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center p-8 space-y-4 ${className}`}
    >
      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-white/80 max-w-md">{message}</p>
      </div>

      <div className="flex space-x-3 mt-4">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors backdrop-blur-sm"
          >
            {retryLabel}
          </button>
        )}
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors backdrop-blur-sm"
          >
            {cancelLabel}
          </button>
        )}
      </div>
    </motion.div>
  );
}

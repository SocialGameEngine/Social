/**
 * Room Loading State Component
 * 
 * Shows contextual loading states for room resolution,
 * including retry messaging for better UX.
 */

import { motion } from 'framer-motion';

interface RoomLoadingStateProps {
  roomCode?: string;
  isRetrying?: boolean;
  retryAttempt?: number;
  maxRetries?: number;
}

export function RoomLoadingState({
  roomCode,
  isRetrying = false,
  retryAttempt = 0,
  maxRetries = 3,
}: RoomLoadingStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 p-8"
      >
        {/* Animated loader */}
        <div className="flex justify-center">
          <motion.div
            className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        {/* Loading text */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">
            {isRetrying ? 'Looking for room...' : 'Loading room...'}
          </h2>
          
          {roomCode && (
            <p className="text-cyan-300 font-mono text-lg">
              {roomCode}
            </p>
          )}

          {isRetrying && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-slate-400 text-sm"
            >
              Attempt {retryAttempt} of {maxRetries}
            </motion.p>
          )}
        </div>

        {/* Subtle hint */}
        <p className="text-slate-500 text-sm max-w-xs mx-auto">
          {isRetrying 
            ? "The room may still be setting up. We'll keep trying..."
            : "Please wait while we connect you to the room."
          }
        </p>
      </motion.div>
    </div>
  );
}

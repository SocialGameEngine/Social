/**
 * Connection Status Indicator
 * 
 * Visual indicator for real-time subscription connection status.
 * Shows a subtle dot/badge that indicates connection health.
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { ConnectionStatus as ConnectionStatusType } from '../../hooks/async/types';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  /** Show text label alongside indicator */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Position for fixed placement */
  position?: 'top-right' | 'bottom-right' | 'inline';
}

const STATUS_CONFIG: Record<ConnectionStatusType, {
  color: string;
  bgColor: string;
  label: string;
  pulse: boolean;
}> = {
  connecting: {
    color: 'bg-yellow-400',
    bgColor: 'bg-yellow-400/20',
    label: 'Connecting...',
    pulse: true,
  },
  connected: {
    color: 'bg-green-400',
    bgColor: 'bg-green-400/20',
    label: 'Connected',
    pulse: false,
  },
  disconnected: {
    color: 'bg-slate-400',
    bgColor: 'bg-slate-400/20',
    label: 'Disconnected',
    pulse: false,
  },
  reconnecting: {
    color: 'bg-orange-400',
    bgColor: 'bg-orange-400/20',
    label: 'Reconnecting...',
    pulse: true,
  },
  error: {
    color: 'bg-red-400',
    bgColor: 'bg-red-400/20',
    label: 'Connection Error',
    pulse: false,
  },
};

export function ConnectionStatusIndicator({
  status,
  showLabel = false,
  size = 'sm',
  position = 'inline',
}: ConnectionStatusProps) {
  const config = STATUS_CONFIG[status];
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  
  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'inline': 'inline-flex',
  };

  // Don't show indicator when connected (clean UI)
  if (status === 'connected' && !showLabel) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={`${positionClasses[position]} flex items-center gap-2`}
      >
        <div className={`${config.bgColor} rounded-full p-1.5 flex items-center gap-2`}>
          {/* Status dot */}
          <div className="relative">
            <div className={`${dotSize} ${config.color} rounded-full`} />
            {config.pulse && (
              <div 
                className={`absolute inset-0 ${dotSize} ${config.color} rounded-full animate-ping opacity-75`} 
              />
            )}
          </div>
          
          {/* Label */}
          {showLabel && (
            <span className="text-xs font-medium text-white/80 pr-1">
              {config.label}
            </span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook to determine if connection status should be shown to user
 */
export function useShowConnectionStatus(status: ConnectionStatusType): boolean {
  // Only show non-connected states
  return status !== 'connected';
}

/**
 * Stale Data Banner Component
 * 
 * Shows when data is outdated but still usable.
 * Provides manual refresh option.
 */

import { motion } from "framer-motion";

interface StaleDataBannerProps {
  lastUpdated?: number | null;
  onRefresh?: () => void;
  className?: string;
}

export function StaleDataBanner({ lastUpdated, onRefresh, className = "" }: StaleDataBannerProps) {
  const getTimeAgo = () => {
    if (!lastUpdated) return "some time ago";
    
    const seconds = Math.floor((Date.now() - lastUpdated) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 flex items-center justify-between ${className}`}
    >
      <div className="flex items-center space-x-2">
        <svg
          className="w-5 h-5 text-yellow-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm text-yellow-100">
          Data updated {getTimeAgo()}
        </span>
      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          className="px-3 py-1 text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-100 rounded transition-colors flex items-center space-x-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>Refresh</span>
        </button>
      )}
    </motion.div>
  );
}

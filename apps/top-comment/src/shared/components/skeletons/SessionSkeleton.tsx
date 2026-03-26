/**
 * Session Skeleton Component
 * 
 * Loading skeleton for session content area.
 * Shows placeholder for game phase content.
 */

import { motion } from "framer-motion";

export function SessionSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white/10 backdrop-blur-sm rounded-lg p-8 space-y-6"
    >
      <div className="text-center space-y-4">
        <div className="h-8 bg-white/20 rounded w-2/3 mx-auto animate-pulse" />
        <div className="h-4 bg-white/20 rounded w-1/2 mx-auto animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/10 rounded-lg p-4 space-y-3">
            <div className="h-4 bg-white/20 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-white/20 rounded w-1/2 animate-pulse" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

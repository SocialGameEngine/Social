/**
 * Room Skeleton Component
 * 
 * Loading skeleton for room page while data loads.
 * Shows placeholder for room header, session area, and player list.
 */

import { motion } from "framer-motion";

export function RoomSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-6 space-y-4"
        >
          <div className="h-8 bg-white/20 rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-white/20 rounded w-1/2 animate-pulse" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-8 space-y-6"
        >
          <div className="h-12 bg-white/20 rounded w-3/4 mx-auto animate-pulse" />
          <div className="h-6 bg-white/20 rounded w-1/2 mx-auto animate-pulse" />
          <div className="grid grid-cols-2 gap-4 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-white/20 rounded animate-pulse" />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-6 space-y-4"
        >
          <div className="h-6 bg-white/20 rounded w-1/4 animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full animate-pulse" />
                <div className="flex-1 h-4 bg-white/20 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

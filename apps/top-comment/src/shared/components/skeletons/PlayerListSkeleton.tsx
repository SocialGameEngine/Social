/**
 * Player List Skeleton Component
 * 
 * Loading skeleton for player list.
 * Shows placeholder for player cards.
 */

import { motion } from "framer-motion";

interface PlayerListSkeletonProps {
  count?: number;
}

export function PlayerListSkeleton({ count = 5 }: PlayerListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-3"
        >
          <div className="w-10 h-10 bg-white/20 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/20 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-white/20 rounded w-1/2 animate-pulse" />
          </div>
          <div className="w-16 h-8 bg-white/20 rounded animate-pulse" />
        </motion.div>
      ))}
    </div>
  );
}

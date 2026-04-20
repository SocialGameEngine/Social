import { motion } from 'framer-motion';

export function HostSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header skeleton */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-24 rounded-2xl bg-slate-800/60 animate-pulse"
        />
        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <motion.div className="h-64 rounded-2xl bg-slate-800/60 animate-pulse" />
            <motion.div className="h-48 rounded-2xl bg-slate-800/60 animate-pulse" />
          </div>
          <div className="space-y-6">
            <motion.div className="h-40 rounded-2xl bg-slate-800/60 animate-pulse" />
            <motion.div className="h-32 rounded-2xl bg-slate-800/60 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

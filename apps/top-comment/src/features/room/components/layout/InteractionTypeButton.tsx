import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface InteractionTypeButtonProps {
  icon: ReactNode;
  label: string;
  count?: number;
  variant: 'interaction' | 'social' | 'misc' | 'session';
  onClick: () => void;
  isLive?: boolean;
  participantCount?: number;
  hasRecentActivity?: boolean;
}

export function InteractionTypeButton({
  icon,
  label,
  count,
  variant,
  onClick,
  isLive,
  participantCount,
  hasRecentActivity,
}: InteractionTypeButtonProps) {
  const variantClass = `section-button--${variant}`;

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`section-button ${variantClass} relative`}
    >
      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-2 right-2">
          <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            <div className="w-2 h-2 bg-white rounded-full" />
            LIVE
          </div>
        </div>
      )}
      
      {/* Participant count */}
      {participantCount && participantCount > 0 && !isLive && (
        <div className="absolute top-2 right-2 bg-slate-800/90 text-white px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
          {participantCount}
        </div>
      )}
      
      {/* Recent activity pulse */}
      {hasRecentActivity && !isLive && (
        <div className="absolute inset-0 rounded-[24px] border-2 border-cyan-400 animate-pulse pointer-events-none" />
      )}
      
      <div className="section-button__icon flex items-center justify-center text-white">
        {icon}
      </div>
      <div className="section-button__label">{label}</div>
      {count !== undefined && count > 0 && (
        <div className="section-button__count">{count}</div>
      )}
    </motion.button>
  );
}

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {icon && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={shouldReduceMotion ? 
            { duration: 0.3 } : 
            { type: 'spring', damping: 20, stiffness: 300 }
          }
          className="text-6xl mb-4 opacity-40"
        >
          {icon}
        </motion.div>
      )}
      
      <h3 className="text-xl font-bold text-slate-200 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-slate-400 max-w-xs">
          {description}
        </p>
      )}
    </motion.div>
  );
}

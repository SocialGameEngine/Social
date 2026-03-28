import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  showCloseButton?: boolean;
  disableDrag?: boolean;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  disableDrag = false,
}: BottomSheetProps) {
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 300], [0.8, 0]);
  const [showHint, setShowHint] = useState(true);
  const hasUsedAnyExit = useRef(false);
  const shouldReduceMotion = useReducedMotion();

  // Auto-hide hint after 3 seconds
  useEffect(() => {
    if (showHint && isOpen) {
      const timer = setTimeout(() => {
        setShowHint(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showHint, isOpen]);

  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const shouldClose = info.velocity.y > 500 || (info.velocity.y >= 0 && info.offset.y > 100);
    
    if (shouldClose) {
      handleExit();
    }
  };

  const handleExit = () => {
    if (!hasUsedAnyExit.current) {
      hasUsedAnyExit.current = true;
      setShowHint(false);
    }
    onClose();
  };

  if (!isOpen) return null;

  // iOS Safari: dvh tracks the *visible* viewport as the URL bar shows/hides.
  // Safe-area insets keep the sheet below the status island and above the home indicator.
  const sheetMaxHeight =
    'min(90dvh, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)))';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        style={{ opacity }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        variants={{
          hidden: { y: 300 },
          visible: { y: 0 },
        }}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={shouldReduceMotion ? 
          { duration: 0.3 } : 
          { type: 'spring', damping: 30, stiffness: 300 }
        }
        drag={disableDrag ? false : "y"}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={!disableDrag ? handleDragEnd : undefined}
        style={{ y, height: sheetMaxHeight, maxHeight: sheetMaxHeight }}
        onClick={(e) => e.stopPropagation()}
        className="relative box-border flex w-full max-w-full flex-col overflow-hidden rounded-t-3xl bg-slate-900 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
      >
        {/* Header with grab handle and close button */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Grab handle - communicates "drag me" */}
              <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
              {title && (
                <h2 id="bottom-sheet-title" className="text-lg font-semibold text-white">
                  {title}
                </h2>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={handleExit}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                aria-label={title ? `Close ${title}` : 'Close'}
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* flex-col so nested room sheets can use flex-1 / min-h-0; safe-area pb clears the home indicator */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom,0px)]">
          {children}
        </div>

        {/* Auto-fading contextual hint */}
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute bottom-[max(2rem,env(safe-area-inset-bottom,0px))] left-1/2 z-20 -translate-x-1/2 transform rounded-full bg-slate-800 px-4 py-2 text-sm text-white shadow-lg"
          >
            Swipe down to close • Tap X to exit
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

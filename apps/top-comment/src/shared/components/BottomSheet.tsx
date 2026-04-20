import { motion, useMotionValue, useTransform, useAnimation, type PanInfo } from 'framer-motion';
import { useEffect, useState, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import type FocusTrapType from 'focus-trap-react';
const FocusTrap = require('focus-trap-react') as typeof FocusTrapType;

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  showCloseButton?: boolean;
  disableDrag?: boolean;
  /** Enable half-open snap point (default: false) */
  enableHalfSnap?: boolean;
  /** Initial snap point: 'full' or 'half' (default: 'full') */
  initialSnap?: 'full' | 'half';
}

// Snap points configuration
const SNAP_POINTS = {
  FULL: 0,      // Fully open
  HALF: 0.5,    // Half open (50% of max height)
  CLOSED: 1,    // Fully closed
};
const DISMISS_THRESHOLD = 150; // px offset to trigger dismiss
const VELOCITY_THRESHOLD = 500; // px/s velocity to trigger dismiss
const HALF_SNAP_THRESHOLD = 100; // px to snap to half instead of full

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  disableDrag = false,
  enableHalfSnap = false,
  initialSnap = 'full',
}: BottomSheetProps) {
  const y = useMotionValue(0);
  const controls = useAnimation();
  const opacity = useTransform(y, [0, 300], [0.6, 0]);
  const [showHint, setShowHint] = useState(true);
  const hasUsedAnyExit = useRef(false);
  const shouldReduceMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const isDraggingSheet = useRef(false);
  const isClosing = useRef(false);
  
  // Current snap point state
  const [currentSnap, setCurrentSnap] = useState<'full' | 'half'>(initialSnap);
  const sheetHeight = useRef(0);

  // Track if content is scrolled to top (for scroll/drag arbitration)
  const [isScrolledToTop, setIsScrolledToTop] = useState(true);
  
  // Measure sheet height for snap point calculations
  useEffect(() => {
    if (sheetRef.current && isOpen) {
      sheetHeight.current = sheetRef.current.offsetHeight;
    }
  }, [isOpen]);

  // Auto-hide hint after 3 seconds
  useEffect(() => {
    if (showHint && isOpen) {
      const timer = setTimeout(() => {
        setShowHint(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showHint, isOpen]);

  // Body scroll lock with proper cleanup
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      isClosing.current = false;
      y.set(0);
      controls.start({ y: 0 });
      setIsScrolledToTop(true);
    }
  }, [isOpen, y, controls]);

  const handleExit = useCallback(() => {
    if (isClosing.current) return;
    isClosing.current = true;
    
    if (!hasUsedAnyExit.current) {
      hasUsedAnyExit.current = true;
      setShowHint(false);
    }
    
    // Animate out before calling onClose
    controls.start({
      y: 500,
      transition: shouldReduceMotion
        ? { duration: 0.2 }
        : { type: 'spring', damping: 30, stiffness: 300 }
    }).then(() => {
      onClose();
    });
  }, [controls, onClose, shouldReduceMotion]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing.current) {
        handleExit();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleExit]);

  // Track scroll position for drag arbitration
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setIsScrolledToTop(target.scrollTop <= 0);
  }, []);

  const handleDragStart = useCallback(() => {
    isDraggingSheet.current = true;
  }, []);

  const handleDrag = useCallback((_: any, info: PanInfo) => {
    // Prevent upward drag past the open position
    if (info.offset.y < 0) {
      y.set(0);
    }
  }, [y]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    isDraggingSheet.current = false;
    
    const offsetY = info.offset.y;
    const velocityY = info.velocity.y;
    const height = sheetHeight.current || 400;
    const halfPoint = height * SNAP_POINTS.HALF;
    
    // Dismiss conditions:
    // 1. Fast downward flick (velocity-based)
    // 2. Dragged past threshold with any downward velocity
    // 3. Dragged significantly past threshold
    const shouldDismiss = 
      velocityY > VELOCITY_THRESHOLD ||
      (offsetY > DISMISS_THRESHOLD && velocityY >= 0 && !enableHalfSnap) ||
      (enableHalfSnap && offsetY > halfPoint + DISMISS_THRESHOLD) ||
      offsetY > DISMISS_THRESHOLD * 1.5;
    
    if (shouldDismiss) {
      handleExit();
    } else if (enableHalfSnap) {
      // Snap to nearest point: full, half, or dismiss
      const snapToHalf = offsetY > HALF_SNAP_THRESHOLD && offsetY < halfPoint;
      const snapToFull = offsetY <= HALF_SNAP_THRESHOLD || (currentSnap === 'half' && velocityY < -200);
      
      if (snapToFull) {
        setCurrentSnap('full');
        controls.start({
          y: 0,
          transition: shouldReduceMotion
            ? { duration: 0.2 }
            : { type: 'spring', damping: 30, stiffness: 400 }
        });
      } else if (snapToHalf) {
        setCurrentSnap('half');
        controls.start({
          y: halfPoint,
          transition: shouldReduceMotion
            ? { duration: 0.2 }
            : { type: 'spring', damping: 30, stiffness: 400 }
        });
      } else {
        // Snap back to current position
        controls.start({
          y: currentSnap === 'half' ? halfPoint : 0,
          transition: shouldReduceMotion
            ? { duration: 0.2 }
            : { type: 'spring', damping: 30, stiffness: 400 }
        });
      }
    } else {
      // Snap back to open position with spring physics
      controls.start({
        y: 0,
        transition: shouldReduceMotion
          ? { duration: 0.2 }
          : { type: 'spring', damping: 30, stiffness: 400 }
      });
    }
  }, [controls, shouldReduceMotion, enableHalfSnap, currentSnap, handleExit]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    handleExit();
  }, [handleExit]);

  if (!isOpen) return null;

  // iOS Safari: dvh tracks the *visible* viewport as the URL bar shows/hides.
  const sheetMaxHeight =
    'min(90dvh, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)))';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-end justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop with opacity tied to drag position */}
      <motion.div
        style={{ opacity }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        ref={sheetRef}
        initial={{ y: 300 }}
        animate={controls}
        transition={shouldReduceMotion 
          ? { duration: 0.3 } 
          : { type: 'spring', damping: 30, stiffness: 300 }
        }
        drag={disableDrag ? false : "y"}
        dragConstraints={{ top: 0, bottom: 500 }}
        dragElastic={{ top: 0, bottom: 0.3 }}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={!disableDrag ? handleDragEnd : undefined}
        style={{ y, height: sheetMaxHeight, maxHeight: sheetMaxHeight }}
        onClick={(e) => e.stopPropagation()}
        className="relative box-border flex w-full sm:max-w-lg sm:mx-auto flex-col overflow-hidden rounded-t-3xl bg-slate-900 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
      >
        <FocusTrap focusTrapOptions={{ initialFocus: false, escapeDeactivates: false, allowOutsideClick: true }}>
          <div className="flex flex-col h-full">
            {/* Drag handle area - larger touch target */}
            <div 
              ref={dragHandleRef}
              className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 touch-none cursor-grab active:cursor-grabbing"
              style={{ touchAction: 'none' }}
            >
              {/* Centered grab handle indicator */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-slate-500 rounded-full" />
              </div>
              
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-3">
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

            {/* Scrollable content with scroll/drag arbitration */}
            <div 
              ref={contentRef}
              onScroll={handleScroll}
              className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom,0px)]"
              style={{ touchAction: isScrolledToTop ? 'pan-y' : 'pan-y' }}
            >
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
          </div>
        </FocusTrap>
      </motion.div>
    </motion.div>
  );
}

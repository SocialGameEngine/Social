import { useState, useEffect, useRef } from "react";

interface UseViewportSyncReturn {
  windowWidth: number;
  bottomPlayerHeight: number;
  bottomPlayerRef: React.MutableRefObject<HTMLDivElement | null>;
  bottomPlayerExtraLeeway: number;
}

export const useViewportSync = (expandedPlayer: boolean, isOpen: boolean): UseViewportSyncReturn => {
  const [windowWidth, setWindowWidth] = useState(0);
  const [bottomPlayerHeight, setBottomPlayerHeight] = useState(0);
  const bottomPlayerRef = useRef<HTMLDivElement>(null);
  const bottomPlayerExtraLeeway = 64;

  // Window resize effect for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Set initial width
    setWindowWidth(window.innerWidth);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // iOS-safe body scroll locking - only lock on non-iOS devices
  useEffect(() => {
    if (!isOpen) return;

    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

    if (!isIOS) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Bottom player height measurement
  useEffect(() => {
    const el = bottomPlayerRef.current;
    if (!el) return;

    const update = () => {
      setBottomPlayerHeight(el.offsetHeight);
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      ro.disconnect();
    };
  }, [expandedPlayer, isOpen]);

  return {
    windowWidth,
    bottomPlayerHeight,
    bottomPlayerRef,
    bottomPlayerExtraLeeway,
  };
};

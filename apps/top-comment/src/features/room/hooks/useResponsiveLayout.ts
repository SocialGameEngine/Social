import { useState, useEffect, useCallback } from 'react';

const MOBILE_BREAKPOINT = 640; // matches Tailwind's `sm` breakpoint

export function useResponsiveLayout() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false);
  const [isRailCollapsed, setIsRailCollapsed] = useState(() => typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : true);

  const handleResize = useCallback(() => {
    const mobile = window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobile(mobile);
    if (mobile) {
      setIsRailCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return { isMobile, isRailCollapsed, setIsRailCollapsed };
}

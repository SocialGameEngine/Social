import { useState, useEffect, useCallback } from 'react';

const MOBILE_BREAKPOINT = 640; // matches Tailwind's `sm` breakpoint

export function useResponsiveLayout() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);
  const [isRailCollapsed, setIsRailCollapsed] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);

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

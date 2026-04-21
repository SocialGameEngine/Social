/**
 * HostMobileShell - Three-layer mobile layout for host controls
 * 
 * Implements the recommended 3-layer structure:
 * 1. Top status bar (HostTopStatusBar)
 * 2. Main scroll canvas (SessionCanvas)
 * 3. Bottom primary action bar (HostActionBar)
 * 
 * Features:
 * - Safe-area insets for notched devices
 * - Keyboard avoidance with --vv-offset
 * - Sticky positioning for action bar
 * - WCAG 2.2 compliant touch targets
 */

import { useEffect, useState, type ReactNode } from 'react';

interface HostMobileShellProps {
  topBar: ReactNode;
  children: ReactNode;
  actionBar: ReactNode;
  className?: string;
}

export function HostMobileShell({
  topBar,
  children,
  actionBar,
  className = '',
}: HostMobileShellProps) {
  const [vvOffset, setVvOffset] = useState(0);

  // Handle virtual keyboard offset for mobile devices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;
      
      // Calculate the offset caused by virtual keyboard
      const offset = window.innerHeight - viewport.height;
      setVvOffset(Math.max(0, offset));
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  return (
    <div 
      className={`host-mobile-shell ${className}`}
      style={{
        '--vv-offset': `${vvOffset}px`,
        '--safe-top': 'env(safe-area-inset-top, 0px)',
        '--safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        '--status-bar-height': '52px',
        '--action-bar-height': '120px',
      } as React.CSSProperties}
    >
      {/* Skip to controls link for screen readers */}
      <a 
        href="#host-action-bar" 
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-slate-900 focus:text-white"
      >
        Skip to controls
      </a>

      {/* Top Status Bar - Fixed at top with safe area */}
      <header className="host-top-bar">
        {topBar}
      </header>

      {/* Main Scroll Canvas */}
      <main className="host-canvas">
        {children}
      </main>

      {/* Bottom Action Bar - Sticky with keyboard avoidance */}
      <footer id="host-action-bar" className="host-action-bar">
        {actionBar}
      </footer>
    </div>
  );
}

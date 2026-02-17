import type { ReactNode } from 'react';

interface MobileLayoutProps {
  children: ReactNode;
  bottomNav?: ReactNode;
  className?: string;
}

/**
 * MobileLayout - Grid Shell Layout for Mobile Views
 * 
 * Implements the 1fr auto grid pattern:
 * - Top area = scrollable content (1fr)
 * - Bottom area = natural height bottom nav (auto)
 * 
 * Benefits over position: fixed:
 * - No manual padding needed
 * - Nav height can change freely
 * - Works with safe areas
 * - Clean mental model
 * 
 * @example
 * <MobileLayout bottomNav={<BottomNav />}>
 *   <ScrollableContent />
 * </MobileLayout>
 */
export function MobileLayout({ children, bottomNav, className = '' }: MobileLayoutProps) {
  return (
    <div className={`app-shell ${className}`}>
      <main className="main-content">
        {children}
      </main>

      {bottomNav && (
        <nav className="bottom-nav">
          {bottomNav}
        </nav>
      )}
    </div>
  );
}

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { vibboxThemeCSS } from './theme';

interface VIBoxThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  theme: typeof vibboxThemeCSS.light;
}

const VIBoxThemeContext = createContext<VIBoxThemeContextType | undefined>(undefined);

interface VIBoxThemeProviderProps {
  children: React.ReactNode;
  defaultDark?: boolean;
}

export const VIBoxThemeProvider = ({
  children,
  defaultDark = false,
}: VIBoxThemeProviderProps) => {
  const [isDark, setIsDark] = useState(defaultDark);
  const viboxContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDark(defaultDark);
  }, [defaultDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const theme = isDark ? vibboxThemeCSS.dark : vibboxThemeCSS.light;

  useEffect(() => {
    const root = typeof document !== 'undefined' ? document.documentElement : null;
    const previousRootValues = new Map<string, string>();

    if (root) {
      Object.entries(theme).forEach(([property, value]) => {
        previousRootValues.set(property, root.style.getPropertyValue(property));
        root.style.setProperty(property, value);
      });
    }

    // Also apply to the container so nested components can still scope if needed
    const container = viboxContainerRef.current;
    if (container) {
      Object.entries(theme).forEach(([property, value]) => {
        container.style.setProperty(property, value);
      });
    }

    return () => {
      if (!root) return;
      previousRootValues.forEach((prevValue, property) => {
        if (prevValue) {
          root.style.setProperty(property, prevValue);
        } else {
          root.style.removeProperty(property);
        }
      });
    };
  }, [theme]);

  const value = {
    isDark,
    toggleTheme,
    theme,
  };

  return (
    <VIBoxThemeContext.Provider value={value}>
      <div ref={viboxContainerRef} className="vibox-theme-container" style={{ position: 'relative' }}>
        {children}
      </div>
    </VIBoxThemeContext.Provider>
  );
};

export const useVIBoxTheme = (): VIBoxThemeContextType => {
  const context = useContext(VIBoxThemeContext);
  if (context === undefined) {
    throw new Error('useVIBoxTheme must be used within a VIBoxThemeProvider');
  }
  return context;
};

// Hook for detecting app theme from localStorage (syncs with main app)
export const useAppTheme = (): boolean => {
  const [isAppDark, setIsAppDark] = useState(false);

  useEffect(() => {
    // Check localStorage for app theme (same as main ThemeProvider)
    const checkTheme = () => {
      const stored = localStorage.getItem('app-theme');
      
      // Check system preference as fallback
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Use stored theme if available, otherwise use system preference
      let isDark: boolean;
      if (stored === 'light') {
        isDark = false;
      } else if (stored === 'dark') {
        isDark = true;
      } else {
        // No stored preference, use system preference
        isDark = systemPrefersDark;
      }
      
      setIsAppDark(isDark);
    };

    // Initial check
    checkTheme();

    // Listen for storage changes (in case theme is changed in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app-theme') {
        checkTheme();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for local changes (slower polling)
    const interval = setInterval(checkTheme, 1000); // Changed from 100ms to 1000ms (1 second)

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return isAppDark;
};

// Enhanced provider that syncs with main app theme
export const VIBoxThemeProviderWithSystem = ({
  children,
  followApp = true,
}: {
  children: React.ReactNode;
  followApp?: boolean;
}) => {
  const appDark = useAppTheme();
  
  return (
    <VIBoxThemeProvider defaultDark={followApp ? appDark : false}>
      {children}
    </VIBoxThemeProvider>
  );
};

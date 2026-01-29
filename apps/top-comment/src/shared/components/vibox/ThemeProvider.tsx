import React, { createContext, useContext, useEffect, useRef } from 'react';
import { vibboxThemeCSS } from './theme';

interface VIBoxThemeContextType {
  isDark: boolean;
  theme: typeof vibboxThemeCSS.dark;
}

const VIBoxThemeContext = createContext<VIBoxThemeContextType | undefined>(undefined);

interface VIBoxThemeProviderProps {
  children: React.ReactNode;
}

export const VIBoxThemeProvider = ({
  children,
}: VIBoxThemeProviderProps) => {
  const isDark = true;
  const viboxContainerRef = useRef<HTMLDivElement>(null);

  const theme = vibboxThemeCSS.dark;

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


// Enhanced provider that syncs with main app theme
export const VIBoxThemeProviderWithSystem = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <VIBoxThemeProvider>
      {children}
    </VIBoxThemeProvider>
  );
};

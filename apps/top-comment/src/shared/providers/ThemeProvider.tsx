/**
 * Theme Context and Provider
 * Dark mode only - no theme switching
 */

import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { darkTheme } from '../theme';
import type { Theme } from '../theme';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = darkTheme;
  const isDark = true;

  // Set dark theme on mount
  useEffect(() => {
    const root = document.documentElement;
    
    // Text colors
    root.style.setProperty('--color-text-primary', theme.colors.text.primary);
    root.style.setProperty('--color-text-secondary', theme.colors.text.secondary);
    root.style.setProperty('--color-text-tertiary', theme.colors.text.tertiary);
    root.style.setProperty('--color-text-heading', theme.colors.text.heading);
    
    // Card colors
    root.style.setProperty('--color-card-background', theme.colors.card.background);
    root.style.setProperty('--color-card-border', theme.colors.card.border);
    root.style.setProperty('--color-card-hover', theme.colors.card.hover);
    root.style.setProperty('--color-card-selected', theme.colors.card.selected);
    root.style.setProperty('--color-card-selected-border', theme.colors.card.selectedBorder);
    
    // Play button color (using tertiary text which is cyan-300 in dark mode)
    root.style.setProperty('--color-play-button', theme.colors.text.tertiary);
    
    // Badge colors
    root.style.setProperty('--color-badge-card1-bg', theme.colors.badge.card1Background);
    root.style.setProperty('--color-badge-card1-text', theme.colors.badge.card1Text);
    root.style.setProperty('--color-badge-card2-bg', theme.colors.badge.card2Background);
    root.style.setProperty('--color-badge-card2-text', theme.colors.badge.card2Text);
    
    // Button colors
    root.style.setProperty('--color-button-ghost-text', theme.colors.button.ghostText);
    root.style.setProperty('--color-button-ghost-hover', theme.colors.button.ghostHover);
    root.style.setProperty('--color-button-primary', theme.colors.button.primary);
    root.style.setProperty('--color-button-danger', theme.colors.button.danger);
    root.style.setProperty('--color-button-success', theme.colors.button.success);
    
    // Player colors
    root.style.setProperty('--color-player-background', theme.colors.player.background);
    root.style.setProperty('--color-player-border', theme.colors.player.border);
    root.style.setProperty('--color-player-progress', theme.colors.player.progress);

    // Set color-scheme for native browser elements
    root.style.colorScheme = 'dark';

    // Set data-theme attribute for CSS selectors
    root.setAttribute('data-theme', 'dark');
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}


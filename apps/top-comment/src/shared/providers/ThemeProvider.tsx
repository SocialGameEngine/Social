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

    // Chaos theme colors
    root.style.setProperty('--chaos-bg-radial-1', theme.colors.chaos.background.radial1);
    root.style.setProperty('--chaos-bg-radial-2', theme.colors.chaos.background.radial2);
    root.style.setProperty('--chaos-bg-base', theme.colors.chaos.background.base);
    root.style.setProperty('--chaos-orb-gradient', theme.colors.chaos.orb.gradient);
    root.style.setProperty('--chaos-orb-blur', theme.colors.chaos.orb.blur);
    root.style.setProperty('--chaos-prompt-gradient', theme.colors.chaos.prompt.gradient);
    root.style.setProperty('--chaos-prompt-shadow', theme.colors.chaos.prompt.shadow);
    root.style.setProperty('--chaos-prompt-rotation', theme.colors.chaos.prompt.rotation);
    root.style.setProperty('--chaos-answer-bg', theme.colors.chaos.answer.background);
    root.style.setProperty('--chaos-answer-glow', theme.colors.chaos.answer.glow);
    root.style.setProperty('--chaos-answer-text', theme.colors.chaos.answer.text);
    root.style.setProperty('--chaos-reaction-bg', theme.colors.chaos.reaction.background);
    root.style.setProperty('--chaos-reaction-shadow', theme.colors.chaos.reaction.shadow);
    root.style.setProperty('--chaos-cta-gradient', theme.colors.chaos.cta.gradient);
    root.style.setProperty('--chaos-cta-shadow', theme.colors.chaos.cta.shadow);
    root.style.setProperty('--chaos-cta-text', theme.colors.chaos.cta.text);
    root.style.setProperty('--chaos-success-bg', theme.colors.chaos.success.background);
    root.style.setProperty('--chaos-success-text', theme.colors.chaos.success.text);
    root.style.setProperty('--chaos-success-muted', theme.colors.chaos.success.muted);
    root.style.setProperty('--chaos-menu-bg', theme.colors.chaos.menu.background);
    root.style.setProperty('--chaos-menu-border', theme.colors.chaos.menu.border);
    root.style.setProperty('--chaos-menu-shadow', theme.colors.chaos.menu.shadow);

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


/**
 * Theme Context and Provider
 * Manages theme state and provides theme toggle functionality
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

  // Update CSS variables when theme changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Basic colors
    root.style.setProperty('--color-text-primary', theme.colors.text.primary);
    root.style.setProperty('--color-text-secondary', theme.colors.text.secondary);
    root.style.setProperty('--color-text-tertiary', theme.colors.text.tertiary);
    root.style.setProperty('--color-text-heading', theme.colors.text.heading);
    
    // Brand colors
    root.style.setProperty('--color-brand-primary', theme.colors.brand.primary);
    root.style.setProperty('--color-brand-dark', theme.colors.brand.dark);
    root.style.setProperty('--color-brand-light', theme.colors.brand.light);
    root.style.setProperty('--color-brand-icon', theme.colors.brand.icon);
    
    // Background colors
    root.style.setProperty('--color-bg-primary', theme.colors.background.primary);
    root.style.setProperty('--color-bg-secondary', theme.colors.background.secondary);
    
    // Accent colors
    root.style.setProperty('--color-accent-primary', theme.colors.accent.primary);
    root.style.setProperty('--color-accent-success', theme.colors.accent.success);
    
    // Elevated component styling
    root.style.setProperty('--color-elevated-bg-light', theme.colors.elevated.bgLight);
    root.style.setProperty('--color-elevated-bg-dark', theme.colors.elevated.bgDark);
    root.style.setProperty('--color-elevated-border-light', theme.colors.elevated.borderLight);
    root.style.setProperty('--color-elevated-border-dark', theme.colors.elevated.borderDark);
    root.style.setProperty('--color-elevated-shadow-light', theme.colors.elevated.shadowLight);
    root.style.setProperty('--color-elevated-shadow-dark', theme.colors.elevated.shadowDark);
    
    // Card colors
    root.style.setProperty('--color-card-background', theme.colors.card.background);
    root.style.setProperty('--color-card-border', theme.colors.card.border);
    root.style.setProperty('--color-card-hover', theme.colors.card.hover);
    root.style.setProperty('--color-card-selected', theme.colors.card.selected);
    root.style.setProperty('--color-card-selected-border', theme.colors.card.selectedBorder);
    
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
    
    // Pricing colors
    root.style.setProperty('--color-pricing-amount', theme.colors.pricing.amount);
    
    // Hero colors
    root.style.setProperty('--color-hero-background', theme.colors.hero.background);
    root.style.setProperty('--color-hero-border', theme.colors.hero.border);
    root.style.setProperty('--color-hero-shadow', theme.colors.hero.shadow);
    
    // Navigation colors
    root.style.setProperty('--color-navigation-background', theme.colors.navigation.background);
    root.style.setProperty('--color-navigation-backdrop-filter', theme.colors.navigation.backdropFilter);
    root.style.setProperty('--color-navigation-border-bottom', theme.colors.navigation.borderBottom);
    
    // Theme toggle colors
    root.style.setProperty('--color-theme-toggle-padding', theme.colors.themeToggle.padding);
    root.style.setProperty('--color-theme-toggle-border-radius', theme.colors.themeToggle.borderRadius);
    root.style.setProperty('--color-theme-toggle-background', theme.colors.themeToggle.background);
    root.style.setProperty('--color-theme-toggle-border', theme.colors.themeToggle.border);
    root.style.setProperty('--color-theme-toggle-sun', theme.colors.themeToggle.sunColor);
    root.style.setProperty('--color-theme-toggle-moon', theme.colors.themeToggle.moonColor);
    
    // Player colors
    root.style.setProperty('--color-player-background', theme.colors.player.background);
    root.style.setProperty('--color-player-border', theme.colors.player.border);
    root.style.setProperty('--color-player-progress', theme.colors.player.progress);
    
    // Glass panel styling
    root.style.setProperty('--color-glass-background', theme.colors.glass.background);
    root.style.setProperty('--color-glass-border', theme.colors.glass.border);
    root.style.setProperty('--color-glass-shadow', theme.colors.glass.shadow);
    
    // Matte panel styling
    root.style.setProperty('--color-matte-background', theme.colors.matte.background);
    root.style.setProperty('--color-matte-border', theme.colors.matte.border);
    root.style.setProperty('--color-matte-shadow', theme.colors.matte.shadow);
    
    // Background gradients
    root.style.setProperty('--color-bg-gradient-from', theme.colors.backgroundGradient.from);
    root.style.setProperty('--color-bg-gradient-via', theme.colors.backgroundGradient.via);
    root.style.setProperty('--color-bg-gradient-to', theme.colors.backgroundGradient.to);
    
    // Bubble styling
    root.style.setProperty('--color-bubble-gradient', theme.colors.bubble.gradient);
    root.style.setProperty('--color-bubble-border', theme.colors.bubble.border);
    root.style.setProperty('--color-bubble-shadow', theme.colors.bubble.shadow);
    root.style.setProperty('--color-bubble-inner-shadow', theme.colors.bubble.innerShadow);
    
    // Foam styling
    root.style.setProperty('--color-foam', theme.colors.foam);
    
    // Beer gradient (for background animation)
    root.style.setProperty('--color-beer-gradient-from', theme.colors.beerGradient.from);
    root.style.setProperty('--color-beer-gradient-via', theme.colors.beerGradient.via);
    root.style.setProperty('--color-beer-gradient-to', theme.colors.beerGradient.to);
    
    // Foam gradient (for beer gradient overlay)
    root.style.setProperty('--color-foam-gradient', theme.colors.foamGradient);
    
    // Play button color (using tertiary text which is cyan-300 in dark mode)
    root.style.setProperty('--color-play-button', theme.colors.text.tertiary);
    
    // Layout and spacing variables
    root.style.setProperty('--layout-container-max-width', theme.colors.layout.containerMaxWidth);
    root.style.setProperty('--layout-container-width', theme.colors.layout.containerWidth);
    root.style.setProperty('--layout-nav-height', theme.colors.layout.navHeight);
    root.style.setProperty('--layout-hero-padding-mobile', theme.colors.layout.heroPaddingMobile);
    root.style.setProperty('--layout-hero-padding-desktop', theme.colors.layout.heroPaddingDesktop);
    root.style.setProperty('--layout-section-gap', theme.colors.layout.sectionGap);
    root.style.setProperty('--layout-card-padding', theme.colors.layout.cardPadding);
    root.style.setProperty('--layout-button-height', theme.colors.layout.buttonHeight);
    root.style.setProperty('--layout-button-height-small', theme.colors.layout.buttonHeightSmall);
    
    // Typography variables
    root.style.setProperty('--typography-font-family', theme.colors.typography.fontFamily);
    root.style.setProperty('--typography-font-size-headline', theme.colors.typography.fontSize.headline);
    root.style.setProperty('--typography-font-size-sub', theme.colors.typography.fontSize.sub);
    root.style.setProperty('--typography-font-size-section-title', theme.colors.typography.fontSize.sectionTitle);
    root.style.setProperty('--typography-font-size-section-sub', theme.colors.typography.fontSize.sectionSub);
    root.style.setProperty('--typography-font-size-feature-title', theme.colors.typography.fontSize.featureTitle);
    root.style.setProperty('--typography-font-size-price-role', theme.colors.typography.fontSize.priceRole);
    root.style.setProperty('--typography-font-size-price-amount', theme.colors.typography.fontSize.priceAmount);
    root.style.setProperty('--typography-font-size-final-title', theme.colors.typography.fontSize.finalTitle);
    root.style.setProperty('--typography-font-weight-normal', theme.colors.typography.fontWeight.normal.toString());
    root.style.setProperty('--typography-font-weight-medium', theme.colors.typography.fontWeight.medium.toString());
    root.style.setProperty('--typography-font-weight-bold', theme.colors.typography.fontWeight.bold.toString());
    root.style.setProperty('--typography-font-weight-heavy', theme.colors.typography.fontWeight.heavy.toString());
    root.style.setProperty('--typography-font-weight-black', theme.colors.typography.fontWeight.black.toString());
    
    // Animation variables
    root.style.setProperty('--animation-duration-fast', theme.colors.animation.duration.fast);
    root.style.setProperty('--animation-duration-normal', theme.colors.animation.duration.normal);
    root.style.setProperty('--animation-duration-slow', theme.colors.animation.duration.slow);
    root.style.setProperty('--animation-easing-ease', theme.colors.animation.easing.ease);
    root.style.setProperty('--animation-easing-ease-in-out', theme.colors.animation.easing.easeInOut);

    // Update color-scheme for native browser elements
    root.style.colorScheme = theme.name === 'dark' ? 'dark' : 'light';

    // Set data-theme attribute for CSS selectors
    root.setAttribute('data-theme', theme.name);
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

/**
 * Theme Helper Utilities
 * Helper functions to easily apply theme colors in components
 */

import type { Theme } from '../theme';

/**
 * Get inline styles for themed elements
 * Use this when you need to apply theme colors via style prop
 */
export function getThemedStyles(theme: Theme) {
  return {
    // Text styles
    textPrimary: { color: theme.colors.text.primary },
    textSecondary: { color: theme.colors.text.secondary },
    textTertiary: { color: theme.colors.text.tertiary },
    textHeading: { color: theme.colors.text.heading },
    
    // Card styles
    cardBackground: { backgroundColor: theme.colors.card.background },
    cardBorder: { borderColor: theme.colors.card.border },
    cardHover: { backgroundColor: theme.colors.card.hover },
    cardSelected: { 
      backgroundColor: theme.colors.card.selected,
      borderColor: theme.colors.card.selectedBorder,
    },
    
    // Badge styles
    badgeCard1: {
      backgroundColor: theme.colors.badge.card1Background,
      color: theme.colors.badge.card1Text,
    },
    badgeCard2: {
      backgroundColor: theme.colors.badge.card2Background,
      color: theme.colors.badge.card2Text,
    },
    
    // Button styles
    buttonGhost: { color: theme.colors.button.ghostText },
    buttonGhostHover: { color: theme.colors.button.ghostHover },
  };
}

/**
 * Get CSS variable references for use in className strings
 * Use this with Tailwind's arbitrary value syntax: className="text-[var(--color-text-primary)]"
 */
export const themeVars = {
  // Text
  textPrimary: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  textTertiary: 'var(--color-text-tertiary)',
  textHeading: 'var(--color-text-heading)',
  
  // Card
  cardBackground: 'var(--color-card-background)',
  cardBorder: 'var(--color-card-border)',
  cardHover: 'var(--color-card-hover)',
  cardSelected: 'var(--color-card-selected)',
  cardSelectedBorder: 'var(--color-card-selected-border)',
  
  // Badge
  badgeCard1Bg: 'var(--color-badge-card1-bg)',
  badgeCard1Text: 'var(--color-badge-card1-text)',
  badgeCard2Bg: 'var(--color-badge-card2-bg)',
  badgeCard2Text: 'var(--color-badge-card2-text)',
  
  // Button
  buttonGhostText: 'var(--color-button-ghost-text)',
  buttonGhostHover: 'var(--color-button-ghost-hover)',
};

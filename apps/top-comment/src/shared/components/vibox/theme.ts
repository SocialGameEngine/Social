/**
 * VIBox Theme Configuration
 * VIBox-specific theming for the music player interface
 */

// ==================== VIBOX COLOR PALETTE ====================
// Light Mode VIBox Colors:
// - Background Gradient: #d97706 → #ea580c → #92400e (amber/orange gradient)
// - Player Background: rgba(0, 0, 0, 0.3) (dark semi-transparent)
// - Card Background: rgba(255, 255, 255, 0.1) (glass effect)
// - Text Primary: #ffffff (white for contrast)
// - Text Secondary: #fef3c7 (amber-100)
// - Button Primary: #fbbf24 (amber-400)
//
// Dark Mode VIBox Colors:
// - Background Gradient: #0a0a0a → #1a0a1a → #0a0a1a (dark with purple/blue tints)
// - Player Background: rgba(0, 0, 0, 0.5) (very dark semi-transparent)
// - Card Background: rgba(255, 255, 255, 0.05) (subtle glass)
// - Text Primary: #ffffff (white)
// - Text Secondary: #e0e0e0 (gray-300)
// - Button Primary: #f0abfc (pink-400)
// ===========================================================

/* VIBox Theme Container - ensures proper CSS variable inheritance */
/* .vibox-theme-container {
  display: contents;
} */

export interface VIBoxThemeColors {
  background: {
    gradient: {
      from: string;
      via: string;
      to: string;
    };
  };
  player: {
    background: string;
  };
  card: {
    background: string;
    border: string;
  };
  text: {
    primary: string;
    secondary: string;
  };
  button: {
    primary: string;
    playText: string;
  };
}

export interface VIBoxTheme {
  light: VIBoxThemeColors;
  dark: VIBoxThemeColors;
}

export const viboxTheme: VIBoxTheme = {
  light: {
    background: {
      gradient: {
        from: '#d97706',      // amber-600
        via: '#ea580c',       // orange-700
        to: '#92400e',        // amber-900
      },
    },
    player: {
      background: 'rgba(0, 0, 0, 0.3)',        // dark semi-transparent
    },
    card: {
      background: 'rgba(255, 255, 255, 0.1)',  // semi-transparent white
      border: 'rgba(255, 255, 255, 0.2)',
    },
    text: {
      primary: '#ffffff',      // white for contrast on dark gradient
      secondary: '#fef3c7',    // amber-100
    },
    button: {
      primary: '#fbbf24',      // amber-400
      playText: '#000000',     // black for contrast on amber button
    },
  },
  dark: {
    background: {
      gradient: {
        from: '#0a0a0a',      // very dark
        via: '#1a0a1a',       // dark with purple tint
        to: '#0a0a1a',        // dark with blue tint
      },
    },
    player: {
      background: 'rgba(0, 0, 0, 0.5)',        // very dark semi-transparent
    },
    card: {
      background: 'rgba(255, 255, 255, 0.05)',  // very subtle white
      border: 'rgba(255, 255, 255, 0.1)',
    },
    text: {
      primary: '#ffffff',      // white
      secondary: '#e0e0e0',    // gray-300
    },
    button: {
      primary: '#f0abfc',      // pink-400
      playText: '#000000',     // black for contrast on pink button
    },
  },
};

// CSS custom properties for runtime theming - using unique prefix to avoid conflicts
export const vibboxThemeCSS = {
  light: {
    '--color-vibox-background-gradient-from': viboxTheme.light.background.gradient.from,
    '--color-vibox-background-gradient-via': viboxTheme.light.background.gradient.via,
    '--color-vibox-background-gradient-to': viboxTheme.light.background.gradient.to,
    '--color-vibox-player-background': viboxTheme.light.player.background,
    '--color-vibox-card-background': viboxTheme.light.card.background,
    '--color-vibox-card-border': viboxTheme.light.card.border,
    '--color-vibox-card-hover': 'rgba(255, 255, 255, 0.15)',
    '--color-vibox-card-selected': 'rgba(251, 191, 36, 0.2)',
    '--color-vibox-text-primary': viboxTheme.light.text.primary,
    '--color-vibox-text-secondary': viboxTheme.light.text.secondary,
    '--color-vibox-button-primary': viboxTheme.light.button.primary,
    '--color-vibox-button-play-text': viboxTheme.light.button.playText,
    '--color-vibox-button-success': '#22c55e',
    '--color-vibox-button-ghost': 'rgba(255, 255, 255, 0.7)',
    '--color-vibox-button-danger': '#ef4444',
    '--color-vibox-button-text': viboxTheme.light.text.primary,
    '--color-vibox-button-pill': viboxTheme.light.button.primary,
    '--color-vibox-player-border': 'rgba(255, 255, 255, 0.2)',
    '--color-vibox-player-progress': viboxTheme.light.text.primary,
    '--color-vibox-progress-track': 'rgba(255, 255, 255, 0.35)',
    '--color-vibox-add-button-hover': 'rgba(255, 255, 255, 0.2)',

    '--color-text-primary': viboxTheme.light.text.primary,
    '--color-text-secondary': viboxTheme.light.text.secondary,
    '--color-button-primary': viboxTheme.light.button.primary,
    '--color-card-background': viboxTheme.light.card.background,
    '--color-card-border': viboxTheme.light.card.border,
    '--color-card-hover': 'rgba(255, 255, 255, 0.15)',
    '--color-player-background': viboxTheme.light.player.background,
    '--color-player-border': 'rgba(255, 255, 255, 0.2)',
    '--color-player-progress': viboxTheme.light.text.primary,
  },
  dark: {
    '--color-vibox-background-gradient-from': viboxTheme.dark.background.gradient.from,
    '--color-vibox-background-gradient-via': viboxTheme.dark.background.gradient.via,
    '--color-vibox-background-gradient-to': viboxTheme.dark.background.gradient.to,
    '--color-vibox-player-background': viboxTheme.dark.player.background,
    '--color-vibox-card-background': viboxTheme.dark.card.background,
    '--color-vibox-card-border': viboxTheme.dark.card.border,
    '--color-vibox-card-hover': 'rgba(255, 255, 255, 0.08)',
    '--color-vibox-card-selected': 'rgba(240, 171, 252, 0.15)',
    '--color-vibox-text-primary': viboxTheme.dark.text.primary,
    '--color-vibox-text-secondary': viboxTheme.dark.text.secondary,
    '--color-vibox-button-primary': viboxTheme.dark.button.primary,
    '--color-vibox-button-play-text': viboxTheme.dark.button.playText,
    '--color-vibox-button-success': '#22c55e',
    '--color-vibox-button-ghost': 'rgba(255, 255, 255, 0.6)',
    '--color-vibox-button-danger': '#ef4444',
    '--color-vibox-button-text': viboxTheme.dark.text.primary,
    '--color-vibox-button-pill': '#7c2d12',
    '--color-vibox-player-border': 'rgba(255, 255, 255, 0.1)',
    '--color-vibox-player-progress': viboxTheme.dark.text.primary,
    '--color-vibox-progress-track': 'rgba(255, 255, 255, 0.25)',
    '--color-vibox-add-button-hover': 'rgba(255, 255, 255, 0.12)',

    '--color-text-primary': viboxTheme.dark.text.primary,
    '--color-text-secondary': viboxTheme.dark.text.secondary,
    '--color-button-primary': viboxTheme.dark.button.primary,
    '--color-card-background': viboxTheme.dark.card.background,
    '--color-card-border': viboxTheme.dark.card.border,
    '--color-card-hover': 'rgba(255, 255, 255, 0.08)',
    '--color-player-background': viboxTheme.dark.player.background,
    '--color-player-border': 'rgba(255, 255, 255, 0.1)',
    '--color-player-progress': viboxTheme.dark.text.primary,
  },
};

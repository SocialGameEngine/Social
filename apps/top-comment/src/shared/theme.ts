/**
 * Theme Configuration
 * Dark mode only
 */

// ==================== COLOR PALETTE ====================
// Light Mode Colors:
// - Primary: #10b981 (emerald-500)
// - Background: #d97706 → #ea580c → #92400e (amber-600 → orange-700 → amber-900) with #fef3c7 amber foam
// - Text: #0f172a (slate-900) hierarchy with #1e293b slate-800 headings
// - Cards: #f8fafc (slate-50) with amber accents (#fef3c7 selected, #f59e0b border)
// - Bubbles: White with glass effect
//
// Dark Mode Colors:
// - Primary: #ff00ff (true neon fuchsia/magenta)
// - Background: #0a0a0a → #1a0a1a → #0a0a1a with #e879f9 fuchsia foam
// - Text: #ffffff hierarchy with #f0abfc pink-400 headings and #a8dadc cyan-300 tertiary
// - Cards: #1e293b (slate-800) with purple/cyan accents
// - Bubbles: #ff00ff → #06b6d4 pink/cyan gradient
// ====================================================

export interface ThemeColors {
  background: {
    gradient: {
      from: string;
      via: string;
      to: string;
    };
    foam: string;
  };
  bubble: {
    gradient: string;
    border: string;
    shadow: string;
    innerShadow: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    heading: string;
  };
  glass: {
    background: string;
    border: string;
    shadow: string;
  };
  matte: {
    background: string;
    border: string;
    shadow: string;
  };
  card: {
    background: string;
    border: string;
    hover: string;
    selected: string;
    selectedBorder: string;
  };
  badge: {
    card1Background: string;
    card1Text: string;
    card2Background: string;
    card2Text: string;
  };
  button: {
    ghostText: string;
    ghostHover: string;
    primary: string;
    danger: string;
    success: string;
  };
  player: {
    background: string;
    border: string;
    progress: string;
  };
}

export interface Theme {
  name: 'dark';
  colors: ThemeColors;
}

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: {
      gradient: {
        from: 'from-[#0a0a0a]',
        via: 'via-[#1a0a1a]',
        to: 'to-[#0a0a1a]',
      },
      foam: 'from-fuchsia-500/10',
    },
    bubble: {
      gradient: 'radial-gradient(circle at 30% 30%, rgba(255,0,255,0.6), rgba(6,182,212,0.3) 50%, transparent 70%)',
      border: 'rgba(255,0,255,0.4)',
      shadow: '0 0 20px rgba(255,0,255,0.5)',
      innerShadow: 'inset 0 0 20px rgba(6,182,212,0.3), inset -8px -8px 15px rgba(138,43,226,0.4)',
    },
    text: {
      primary: '#ffffff',      // white
      secondary: '#e0e0e0',    // gray-300
      tertiary: '#a8dadc',     // cyan-300
      heading: '#f0abfc',      // pink-400
    },
    glass: {
      background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.85), rgba(26, 10, 26, 0.4))',
      border: 'rgba(255, 0, 255, 0.2)',
      shadow: '0 18px 40px rgba(255, 0, 255, 0.15)',
    },
    matte: {
      background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.9), rgba(26, 10, 26, 0.6))',
      border: 'rgba(6, 182, 212, 0.3)',
      shadow: 'inset 0 1px 1px rgba(138, 43, 226, 0.2), 0 10px 22px rgba(0, 0, 0, 0.6)',
    },
    card: {
      background: '#1e293b',   // slate-800
      border: '#475569',       // slate-600
      hover: '#334155',        // slate-700
      selected: '#fef3c7',     // amber-100 (brand-light equivalent)
      selectedBorder: '#f59e0b', // amber-500 (brand-primary)
    },
    badge: {
      card1Background: '#1e293b', // blue-100
      card1Text: '#1e40af',       // blue-800
      card2Background: '#e9d5ff', // purple-100
      card2Text: '#6b21a8',       // purple-800
    },
    button: {
      ghostText: '#a8dadc',    // cyan-300
      ghostHover: '#67e8f9',   // cyan-300 lighter
      primary: '#ff00ff',      // true neon fuchsia/magenta
      danger: '#ef4444',       // red-500
      success: '#22c55e',      // green-500
    },
    player: {
      background: '#111827',   // gray-900
      border: '#374151',       // gray-700
      progress: '#6b7280',      // gray-500
    },
  },
};
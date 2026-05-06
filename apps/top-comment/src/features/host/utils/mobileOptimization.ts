// =============================================================================
// HOST PAGE MOBILE OPTIMIZATION
// =============================================================================
// Utilities and helpers for mobile-optimized host controls.
// Ensures ≥64px touch targets and portrait-friendly layouts.

export interface TouchTargetConfig {
  minSize: number; // Minimum touch target size in pixels
  minSpacing: number; // Minimum spacing between targets
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export const DEFAULT_TOUCH_CONFIG: TouchTargetConfig = {
  minSize: 64, // 64px minimum for accessibility
  minSpacing: 8,
  safeArea: {
    top: 20, // Account for notch/status bar
    bottom: 34, // Account for home indicator
    left: 16,
    right: 16,
  },
};

/**
 * Check if touch target meets minimum size requirements
 */
export function validateTouchTarget(
  width: number,
  height: number,
  config: TouchTargetConfig = DEFAULT_TOUCH_CONFIG
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (width < config.minSize) {
    issues.push(`Width ${width}px is below minimum ${config.minSize}px`);
  }

  if (height < config.minSize) {
    issues.push(`Height ${height}px is below minimum ${config.minSize}px`);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Calculate optimal button size for mobile
 */
export function calculateOptimalButtonSize(
  availableWidth: number,
  buttonCount: number,
  config: TouchTargetConfig = DEFAULT_TOUCH_CONFIG
): { width: number; height: number; spacing: number } {
  const totalSpacing = (buttonCount - 1) * config.minSpacing;
  const availableForButtons = availableWidth - totalSpacing - (config.safeArea.left + config.safeArea.right);
  
  const calculatedWidth = Math.floor(availableForButtons / buttonCount);
  const width = Math.max(config.minSize, calculatedWidth);
  const height = config.minSize;

  return {
    width,
    height,
    spacing: config.minSpacing,
  };
}

/**
 * Detect if device is in portrait mode
 */
export function isPortrait(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerHeight > window.innerWidth;
}

/**
 * Detect if device is mobile
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768; // Tailwind md breakpoint
}

/**
 * Get safe area insets (for notch/home indicator)
 */
export function getSafeAreaInsets(): {
  top: number;
  bottom: number;
  left: number;
  right: number;
} {
  if (typeof window === 'undefined' || !('CSS' in window)) {
    return DEFAULT_TOUCH_CONFIG.safeArea;
  }

  // Try to get CSS env() values
  const getEnvValue = (variable: string, fallback: number): number => {
    try {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue(`env(${variable})`)
        .trim();
      return value ? parseInt(value, 10) : fallback;
    } catch {
      return fallback;
    }
  };

  return {
    top: getEnvValue('safe-area-inset-top', DEFAULT_TOUCH_CONFIG.safeArea.top),
    bottom: getEnvValue('safe-area-inset-bottom', DEFAULT_TOUCH_CONFIG.safeArea.bottom),
    left: getEnvValue('safe-area-inset-left', DEFAULT_TOUCH_CONFIG.safeArea.left),
    right: getEnvValue('safe-area-inset-right', DEFAULT_TOUCH_CONFIG.safeArea.right),
  };
}

/**
 * Generate responsive class names for touch targets
 */
export function getTouchTargetClasses(
  size: 'sm' | 'md' | 'lg' = 'md'
): string {
  const sizeClasses = {
    sm: 'min-w-[56px] min-h-[56px]', // Slightly below standard for compact UIs
    md: 'min-w-[64px] min-h-[64px]', // Standard touch target
    lg: 'min-w-[72px] min-h-[72px]', // Larger for primary actions
  };

  return `${sizeClasses[size]} flex items-center justify-center`;
}

/**
 * Generate spacing classes for mobile layout
 */
export function getMobileSpacingClasses(): string {
  return 'px-4 py-3 md:px-6 md:py-4';
}

/**
 * Generate grid classes for responsive button layout
 */
export function getResponsiveGridClasses(columns: number): string {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  };

  return `grid gap-2 ${gridCols[columns as keyof typeof gridCols] || 'grid-cols-2'}`;
}

/**
 * Optimize text size for mobile
 */
export function getResponsiveTextClasses(
  variant: 'title' | 'body' | 'caption' | 'button'
): string {
  const variants = {
    title: 'text-xl md:text-2xl lg:text-3xl font-bold',
    body: 'text-base md:text-lg',
    caption: 'text-sm md:text-base',
    button: 'text-base md:text-lg font-medium',
  };

  return variants[variant];
}

/**
 * Calculate viewport-relative font size
 */
export function getViewportFontSize(baseSize: number): string {
  return `clamp(${baseSize * 0.875}px, ${baseSize / 16}rem + 0.5vw, ${baseSize * 1.25}px)`;
}

/**
 * Check if element is within safe area
 */
export function isInSafeArea(
  element: HTMLElement,
  config: TouchTargetConfig = DEFAULT_TOUCH_CONFIG
): boolean {
  const rect = element.getBoundingClientRect();
  const safeArea = getSafeAreaInsets();

  return (
    rect.top >= safeArea.top &&
    rect.bottom <= window.innerHeight - safeArea.bottom &&
    rect.left >= safeArea.left &&
    rect.right <= window.innerWidth - safeArea.right
  );
}

/**
 * Generate mobile-optimized control panel layout
 */
export function getMobileControlLayout(
  controlCount: number
): {
  layout: 'stack' | 'grid' | 'tabs';
  columns?: number;
  orientation?: 'horizontal' | 'vertical';
} {
  if (controlCount <= 3) {
    return { layout: 'stack', orientation: 'vertical' };
  } else if (controlCount <= 6) {
    return { layout: 'grid', columns: 2 };
  } else {
    return { layout: 'tabs' };
  }
}

/**
 * Haptic feedback helper (if supported)
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'medium'): void {
  if (typeof window === 'undefined' || !('navigator' in window)) return;

  // Check for Vibration API
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30,
    };
    navigator.vibrate(patterns[type]);
  }

  // Check for Haptic Feedback API (iOS)
  if ('Haptics' in window && typeof (window as any).Haptics?.impact === 'function') {
    const impacts = {
      light: 'light',
      medium: 'medium',
      heavy: 'heavy',
    };
    (window as any).Haptics.impact({ style: impacts[type] });
  }
}

/**
 * Prevent zoom on double-tap (for buttons)
 */
export function preventDoubleTapZoom(element: HTMLElement): void {
  let lastTap = 0;
  
  element.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 500 && tapLength > 0) {
      e.preventDefault();
    }
    
    lastTap = currentTime;
  });
}

/**
 * Get orientation-specific layout classes
 */
export function getOrientationClasses(): string {
  return isPortrait()
    ? 'flex-col portrait:flex-col landscape:flex-row'
    : 'flex-row portrait:flex-col landscape:flex-row';
}

/**
 * Calculate optimal modal size for mobile
 */
export function getModalSizeClasses(size: 'sm' | 'md' | 'lg' | 'full' = 'md'): string {
  const sizes = {
    sm: 'max-w-sm w-full mx-4',
    md: 'max-w-md w-full mx-4 md:mx-auto',
    lg: 'max-w-lg w-full mx-4 md:mx-auto',
    full: 'w-full h-full',
  };

  return sizes[size];
}

/**
 * Generate bottom sheet classes for mobile
 */
export function getBottomSheetClasses(): string {
  return 'fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out';
}

/**
 * Check if device supports hover
 */
export function supportsHover(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: hover)').matches;
}

/**
 * Get touch-friendly padding
 */
export function getTouchPadding(density: 'compact' | 'comfortable' | 'spacious' = 'comfortable'): string {
  const paddings = {
    compact: 'p-2',
    comfortable: 'p-4',
    spacious: 'p-6',
  };

  return paddings[density];
}

// =============================================================================
// SOCIALE PROVIDER
// =============================================================================
// Wrapper component that provides SocialeGameContext to Sociale features.
// Use this to wrap components that need access to Sociale state.

import { SocialeGameProvider } from '../context/SocialeGameContext';
import type { ReactNode } from 'react';

interface SocialeProviderProps {
  children: ReactNode;
}

/**
 * Provider component for Sociale game state
 * 
 * Usage:
 * ```tsx
 * <SocialeProvider>
 *   <YourSocialeComponents />
 * </SocialeProvider>
 * ```
 */
export function SocialeProvider({ children }: SocialeProviderProps) {
  return (
    <SocialeGameProvider>
      {children}
    </SocialeGameProvider>
  );
}

// =============================================================================
// TRIVIA ONLY PRESET
// =============================================================================
// Generates a Sociale with only trivia rounds.

import type { SocialeRound } from '../../../domain/types/sociale.types';
import { createInitialSettings } from '../../../domain/sociale/roundRegistry';

/**
 * Generate trivia-only rounds for a Sociale
 */
export function generateTriviaOnlyRounds(count: number): SocialeRound[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `round-${index}`, // Will be replaced by actual ID on creation
    socialeId: '', // Will be set on creation
    orderIndex: index,
    type: 'trivia' as const,
    title: `Trivia ${index + 1}`,
    content: undefined, // Will be set by question pack
    settings: createInitialSettings('trivia'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

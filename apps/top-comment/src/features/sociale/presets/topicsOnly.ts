// =============================================================================
// TOPICS ONLY PRESET
// =============================================================================
// Generates a Sociale with only topic rounds.

import type { SocialeRound } from '../../../domain/types/sociale.types';
import { createInitialSettings } from '../../../domain/sociale/roundRegistry';

/**
 * Generate topic-only rounds for a Sociale
 */
export function generateTopicsOnlyRounds(count: number): SocialeRound[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `round-${index}`, // Will be replaced by actual ID on creation
    socialeId: '', // Will be set on creation
    orderIndex: index,
    type: 'topic' as const,
    title: `Topic ${index + 1}`,
    content: undefined, // Will be set by user or from topic library
    settings: createInitialSettings('topic'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

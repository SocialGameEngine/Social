// =============================================================================
// TOPICS ONLY PRESET
// =============================================================================
// Generates a Sociale with only topic rounds.

import type { SocialeRound } from '../../../domain/types/sociale.types';
import { createInitialSettings } from '../../../domain/sociale/roundRegistry';

/**
 * Generate topic-only rounds for a Sociale
 */
export function generateTopicsOnlyRounds(count: number, selectedLibraries?: string[]): SocialeRound[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `round-${index}`, // Will be replaced by actual ID on creation
    socialeId: '', // Will be set on creation
    orderIndex: index,
    type: 'topic' as const,
    title: undefined, // Will be set from prompt library when round starts
    content: undefined, // Will be set from prompt library when round starts
    settings: {
      ...createInitialSettings('topic'),
      promptLibraryId: selectedLibraries && selectedLibraries.length > 0 
        ? selectedLibraries[index % selectedLibraries.length] 
        : undefined
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

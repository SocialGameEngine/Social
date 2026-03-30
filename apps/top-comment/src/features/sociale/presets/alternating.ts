// =============================================================================
// ALTERNATING PRESET
// =============================================================================
// Generates a Sociale with alternating topic and trivia rounds.

import type { SocialeRound } from '../../../domain/types/sociale.types';
import { createInitialSettings } from '../../../domain/sociale/roundRegistry';

/**
 * Generate alternating topic/trivia rounds for a Sociale
 */
export function generateAlternatingRounds(count: number): SocialeRound[] {
  return Array.from({ length: count }, (_, index) => {
    const isEven = index % 2 === 0;
    const type = isEven ? 'topic' : 'trivia';
    
    return {
      id: `round-${index}`, // Will be replaced by actual ID on creation
      socialeId: '', // Will be set on creation
      orderIndex: index,
      type,
      title: `${type === 'topic' ? 'Topic' : 'Trivia'} ${Math.floor(index / 2) + 1}`,
      content: undefined, // Will be set by user or from library
      settings: createInitialSettings(type),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

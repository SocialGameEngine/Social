// =============================================================================
// TRIVIA ONLY PRESET
// =============================================================================
// Generates a Sociale with only trivia rounds.

import type { SocialeRound } from '../../../domain/types/sociale.types';
import { createInitialSettings } from '../../../domain/sociale/roundRegistry';
import { triviaService } from '../../../services/triviaService';

/**
 * Get the default trivia pack ID
 */
async function getDefaultTriviaPackId(): Promise<string> {
  try {
    const packs = await triviaService.getQuestionPacks({ status: 'published' });
    return packs[0]?.id || '550e8400-e29b-41d4-a716-446655440001'; // Fallback UUID
  } catch (error) {
    console.error('Failed to get trivia packs:', error);
    return '550e8400-e29b-41d4-a716-446655440001'; // Fallback UUID
  }
}

/**
 * Generate trivia-only rounds for a Sociale
 */
export function generateTriviaOnlyRounds(count: number, selectedLibraries?: string[]): SocialeRound[] {
  // For trivia rounds, we expect selectedLibraries to contain question pack IDs
  // For now, we'll use a default pack ID or the first selected library as the pack
  const questionPackId = selectedLibraries && selectedLibraries.length > 0 
    ? selectedLibraries[0] 
    : 'e155a8a0-b74c-477b-82cd-e3c159e9d326'; // Default pack ID (from database)
  
  return Array.from({ length: count }, (_, index) => ({
    id: `round-${index}`, // Will be replaced by actual ID on creation
    socialeId: '', // Will be set on creation
    orderIndex: index,
    type: 'trivia' as const,
    title: undefined, // Will be set from question pack when round starts
    content: undefined, // Will be set by question pack
    settings: {
      ...createInitialSettings('trivia'),
      questionPackId, // Use question pack instead of prompt library
      format: 'written_answer' as const,
      difficulty: 'easy' as const,
      pointsCorrect: 100,
      pointsPartial: 50,
      speedBonusEnabled: true,
      maxSpeedBonus: 25,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

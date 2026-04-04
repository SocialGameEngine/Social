// =============================================================================
// TRIVIA ONLY PRESET
// =============================================================================
// Generates a Sociale with only trivia rounds.

import type { SocialeRound } from '../../../domain/types/sociale.types';
import { createInitialSettings } from '../../../domain/sociale/roundRegistry';
import { triviaService } from '../../../services/triviaService';
import { supabase } from '../../../supabase/client';

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
export async function generateTriviaOnlyRounds(count: number, selectedLibraries?: string[], availableLibraries?: any[]): Promise<SocialeRound[]> {
  // Filter selected libraries to only include trivia libraries
  const triviaLibs = selectedLibraries?.filter(libId => {
    const lib = availableLibraries?.find(l => l.id === libId);
    return lib?.type === 'trivia';
  }) || [];
  
  // Use the first trivia library or fall back to default
  const questionPackId = triviaLibs.length > 0 
    ? triviaLibs[0] 
    : 'e155a8a0-b74c-477b-82cd-e3c159e9d326'; // Default pack ID (from database)
  
  // Fetch a sample question to determine format
  let detectedFormat: 'multiple_choice' | 'written_answer' = 'written_answer';
  try {
    const { data: questions } = await supabase
      .from('trivia_questions')
      .select('format')
      .eq('pack_id', questionPackId)
      .eq('status', 'published')
      .limit(1);
    
    if (questions && questions.length > 0 && questions[0].format) {
      detectedFormat = questions[0].format as 'multiple_choice' | 'written_answer';
    }
  } catch (error) {
    console.warn('Failed to detect trivia format, defaulting to written_answer:', error);
  }
  
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
      format: detectedFormat,
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

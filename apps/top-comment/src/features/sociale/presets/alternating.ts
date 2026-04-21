// =============================================================================
// ALTERNATING PRESET
// =============================================================================
// Generates a Sociale with alternating topic and trivia rounds.

import type { SocialeRound } from '../../../domain/types/sociale.types';
import type { PromptLibrary } from '../../../shared/promptLibraries';
import { createInitialSettings } from '../../../domain/sociale/roundRegistry';
import { supabase } from '../../../supabase/client';

/**
 * Generate alternating topic/trivia rounds for a Sociale
 */
export async function generateAlternatingRounds(count: number, selectedLibraries?: string[], availableLibraries?: PromptLibrary[]): Promise<SocialeRound[]> {
  // Filter selected libraries by type using the provided libraries
  const promptLibs = selectedLibraries?.filter(libId => {
    const lib = availableLibraries?.find(l => l.id === libId);
    return lib?.type === 'prompt';
  }) || [];
  
  const triviaLibs = selectedLibraries?.filter(libId => {
    const lib = availableLibraries?.find(l => l.id === libId);
    return lib?.type === 'trivia';
  }) || [];
  
  // Pre-detect formats for all trivia libraries to avoid repeated queries
  const triviaFormats = new Map<string, 'multiple_choice' | 'written_answer'>();
  
  for (const triviaLibId of triviaLibs) {
    let detectedFormat: 'multiple_choice' | 'written_answer' = 'written_answer';
    try {
      const { data: questions } = await supabase
        .from('trivia_questions')
        .select('format')
        .eq('pack_id', triviaLibId)
        .eq('status', 'published')
        .limit(1);
      
      if (questions && questions.length > 0 && questions[0].format) {
        detectedFormat = questions[0].format as 'multiple_choice' | 'written_answer';
      }
    } catch (error) {
      console.warn(`Failed to detect trivia format for library ${triviaLibId}, defaulting to written_answer:`, error);
    }
    triviaFormats.set(triviaLibId, detectedFormat);
  }
  
  return Array.from({ length: count }, (_, index) => {
    // If we only have trivia libraries, make all rounds trivia
    // If we only have prompt libraries, make all rounds topics
    // If we have both, alternate between them
    let type: 'topic' | 'trivia';
    
    if (triviaLibs.length === 0 && promptLibs.length > 0) {
      // Only prompt libraries - all rounds are topics
      type = 'topic';
    } else if (promptLibs.length === 0 && triviaLibs.length > 0) {
      // Only trivia libraries - all rounds are trivia
      type = 'trivia';
    } else if (promptLibs.length > 0 && triviaLibs.length > 0) {
      // Both available - alternate
      const isEven = index % 2 === 0;
      type = isEven ? 'topic' : 'trivia';
    } else {
      // No libraries - default to topic
      type = 'topic';
    }
    
    // Choose appropriate library based on round type
    let settings: SocialeRound['settings'];
    if (type === 'topic' && promptLibs.length > 0) {
      settings = {
        ...createInitialSettings(type),
        promptLibraryId: promptLibs[index % promptLibs.length]
      };
    } else if (type === 'trivia' && triviaLibs.length > 0) {
      // For trivia rounds, use question pack system
      const questionPackId = triviaLibs[index % triviaLibs.length]; // Use selected trivia library
      const detectedFormat = triviaFormats.get(questionPackId) || 'written_answer';
      
      settings = {
        ...createInitialSettings(type),
        questionPackId, // Use question pack instead of prompt library
        format: detectedFormat,
        difficulty: 'easy' as const,
        pointsCorrect: 100,
        pointsPartial: 50,
        speedBonusEnabled: true,
        maxSpeedBonus: 25,
      };
    } else {
      // No appropriate library available
      settings = createInitialSettings(type);
    }
    
    return {
      id: `round-${index}`, // Will be replaced by actual ID on creation
      socialeId: '', // Will be set on creation
      orderIndex: index,
      type,
      title: undefined, // Will be set from prompt library when round starts
      content: undefined, // Will be set from prompt library when round starts
      settings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

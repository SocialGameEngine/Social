// =============================================================================
// SOCIALE PRESET GENERATORS
// =============================================================================
// Preset generators for quick Sociale creation.

import { generateTopicsOnlyRounds } from './topicsOnly';
import { generateTriviaOnlyRounds } from './triviaOnly';
import { generateAlternatingRounds } from './alternating';

// Export individual generators
export { generateTopicsOnlyRounds } from './topicsOnly';
export { generateTriviaOnlyRounds } from './triviaOnly';
export { generateAlternatingRounds } from './alternating';

/**
 * Get all available preset generators
 */
export const presetGenerators = {
  topics_only: generateTopicsOnlyRounds,
  trivia_only: generateTriviaOnlyRounds,
  alternating: generateAlternatingRounds,
} as const;

/**
 * Get preset generator by mode
 */
export function getPresetGenerator(mode: keyof typeof presetGenerators) {
  return presetGenerators[mode];
}

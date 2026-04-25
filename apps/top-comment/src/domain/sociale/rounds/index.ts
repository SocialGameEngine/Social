// =============================================================================
// ROUND TYPE DEFINITIONS INDEX
// =============================================================================
// This file exports all round type definitions and registers them.
// Import this file during app initialization to register all round types.

import { registerRoundType } from '../roundRegistry';
import { promptRoundDefinition } from './promptRound';
import { triviaRoundDefinition } from './triviaRound';
import { topicRoundDefinition } from './topicRound';
import { pictureRoundDefinition } from './pictureRound';
import { wagerRoundDefinition } from './wagerRound';
import { photoRoundDefinition } from './photoRound';
import { bluffRoundDefinition } from './bluffRound';
import { moleRoundDefinition } from './moleRound';
import { orderRoundDefinition } from './orderRound';
import { predictiveRoundDefinition } from './predictiveRound';

// Export individual definitions
export { promptRoundDefinition } from './promptRound';
export { triviaRoundDefinition } from './triviaRound';
export { topicRoundDefinition } from './topicRound';
export { pictureRoundDefinition } from './pictureRound';
export { wagerRoundDefinition } from './wagerRound';
export { photoRoundDefinition } from './photoRound';
export { bluffRoundDefinition } from './bluffRound';
export { moleRoundDefinition } from './moleRound';
export { orderRoundDefinition } from './orderRound';
export { predictiveRoundDefinition } from './predictiveRound';

/**
 * Register all built-in round types
 * Call this once during app initialization
 */
export function registerBuiltInRoundTypes(): void {
  registerRoundType(promptRoundDefinition);
  registerRoundType(triviaRoundDefinition);
  registerRoundType(topicRoundDefinition);
  registerRoundType(pictureRoundDefinition);
  registerRoundType(wagerRoundDefinition);
  registerRoundType(photoRoundDefinition);
  registerRoundType(bluffRoundDefinition);
  registerRoundType(moleRoundDefinition);
  registerRoundType(orderRoundDefinition);
  registerRoundType(predictiveRoundDefinition);
}

// Auto-register on import (optional - can be disabled if manual registration preferred)
// Uncomment the line below to auto-register:
// registerBuiltInRoundTypes();

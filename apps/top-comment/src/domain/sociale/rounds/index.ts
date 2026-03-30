// =============================================================================
// ROUND TYPE DEFINITIONS INDEX
// =============================================================================
// This file exports all round type definitions and registers them.
// Import this file during app initialization to register all round types.

import { registerRoundType } from '../roundRegistry';
import { promptRoundDefinition } from './promptRound';
import { triviaRoundDefinition } from './triviaRound';
import { topicRoundDefinition } from './topicRound';

// Export individual definitions
export { promptRoundDefinition } from './promptRound';
export { triviaRoundDefinition } from './triviaRound';
export { topicRoundDefinition } from './topicRound';

/**
 * Register all built-in round types
 * Call this once during app initialization
 */
export function registerBuiltInRoundTypes(): void {
  registerRoundType(promptRoundDefinition);
  registerRoundType(triviaRoundDefinition);
  registerRoundType(topicRoundDefinition);
}

// Auto-register on import (optional - can be disabled if manual registration preferred)
// Uncomment the line below to auto-register:
// registerBuiltInRoundTypes();

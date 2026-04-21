// =============================================================================
// SOCIALE ROUND TYPE REGISTRY
// =============================================================================
// This is the KEY EXTENSIBILITY POINT for the Sociale system.
// To add a new round type:
// 1. Create a round definition file in ./rounds/
// 2. Register it here using registerRoundType()
// 3. The orchestrator will automatically handle it

import type { 
  SocialeRoundType, 
  SocialeRoundSettings,
  SocialeRoundState,
  SocialeResponse,
  Socialite,
  SocialeScoreEvent,
  SocialeAnalyticsRow,
} from '../types/sociale.types';

// =============================================================================
// ROUND TYPE DEFINITION INTERFACE
// =============================================================================

/**
 * Validation result for round settings
 */
export interface RoundSettingsValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Input for scoring a round
 */
export interface ScoreRoundInput {
  roundState: SocialeRoundState;
  responses: SocialeResponse[];
  socialites: Socialite[];
  settings: SocialeRoundSettings;
}

/**
 * Result of scoring a round
 */
export interface ScoreRoundResult {
  scoreEvents: Omit<SocialeScoreEvent, 'id' | 'createdAt'>[];
  updatedScoreboard: Record<string, number>;
}

/**
 * Input for building analytics
 */
export interface AnalyticsInput {
  roundState: SocialeRoundState;
  responses: SocialeResponse[];
  socialites: Socialite[];
  settings: SocialeRoundSettings;
}

/**
 * Field schema for settings UI generation
 */
export interface RoundSettingsFieldSchema {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect';
  label: string;
  description?: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
}

/**
 * Complete round type definition
 * Each round type must implement this interface
 */
export interface SocialeRoundTypeDefinition {
  // Identity
  type: SocialeRoundType;
  label: string;
  description?: string;
  emoji?: string;
  
  // Phase sequence for this round type
  defaultPhases: string[];
  
  // Phase timing defaults (in seconds)
  defaultPhaseTiming: Record<string, number>;
  
  // Settings schema for UI generation
  settingsSchema?: RoundSettingsFieldSchema[];
  
  // Factory for initial settings
  createInitialSettings: () => SocialeRoundSettings;
  
  // Validation
  validateSettings: (settings: SocialeRoundSettings) => RoundSettingsValidation;
  
  // Scoring strategy
  scoreRound: (input: ScoreRoundInput) => ScoreRoundResult;
  
  // Analytics extraction
  buildAnalytics: (input: AnalyticsInput) => Omit<SocialeAnalyticsRow, 'id' | 'createdAt'>[];
  
  // Optional: Check if phase can auto-advance
  canAutoAdvancePhase?: (phase: string, roundState: SocialeRoundState) => boolean;
  
  // Optional: Get phase duration override
  getPhaseDuration?: (phase: string, settings: SocialeRoundSettings) => number | null;
}

// =============================================================================
// REGISTRY IMPLEMENTATION
// =============================================================================

/**
 * Internal registry storage
 */
const roundTypeRegistry = new Map<SocialeRoundType, SocialeRoundTypeDefinition>();

/**
 * Register a round type definition
 * Call this during app initialization for each round type
 */
export function registerRoundType(definition: SocialeRoundTypeDefinition): void {
  if (roundTypeRegistry.has(definition.type)) {
    console.warn(`Round type "${definition.type}" is already registered. Overwriting.`);
  }
  roundTypeRegistry.set(definition.type, definition);
}

/**
 * Get a round type definition by type
 */
export function getRoundTypeDefinition(type: SocialeRoundType): SocialeRoundTypeDefinition | undefined {
  return roundTypeRegistry.get(type);
}

/**
 * Get all registered round types
 */
export function getAllRoundTypes(): SocialeRoundTypeDefinition[] {
  return Array.from(roundTypeRegistry.values());
}

/**
 * Get all registered round type keys
 */
export function getRegisteredRoundTypeKeys(): SocialeRoundType[] {
  return Array.from(roundTypeRegistry.keys());
}

/**
 * Check if a round type is registered
 */
export function isRoundTypeRegistered(type: SocialeRoundType): boolean {
  return roundTypeRegistry.has(type);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the default phase sequence for a round type
 */
export function getDefaultPhases(type: SocialeRoundType): string[] {
  const definition = getRoundTypeDefinition(type);
  return definition?.defaultPhases ?? ['active', 'results'];
}

/**
 * Get the next phase for a round type
 */
export function getNextPhase(type: SocialeRoundType, currentPhase: string): string | null {
  const phases = getDefaultPhases(type);
  const currentIndex = phases.indexOf(currentPhase);
  
  if (currentIndex === -1) {
    return phases[0] ?? null;
  }
  
  return phases[currentIndex + 1] ?? null;
}

/**
 * Check if a phase is the final phase for a round type
 */
export function isFinalPhase(type: SocialeRoundType, phase: string): boolean {
  const phases = getDefaultPhases(type);
  return phases.indexOf(phase) === phases.length - 1;
}

/**
 * Get phase duration for a round type
 */
export function getPhaseDuration(
  type: SocialeRoundType, 
  phase: string, 
  settings: SocialeRoundSettings
): number {
  const definition = getRoundTypeDefinition(type);
  
  // Check for custom duration from definition
  if (definition?.getPhaseDuration) {
    const customDuration = definition.getPhaseDuration(phase, settings);
    if (customDuration !== null) {
      return customDuration;
    }
  }
  
  // Check settings overrides
  const settingsKey = `${phase}Seconds` as keyof SocialeRoundSettings;
  if (settingsKey in settings && typeof settings[settingsKey] === 'number') {
    return settings[settingsKey] as number;
  }
  
  // Fall back to definition defaults
  return definition?.defaultPhaseTiming[phase] ?? 30;
}

/**
 * Validate settings for a round type
 */
export function validateRoundSettings(
  type: SocialeRoundType, 
  settings: SocialeRoundSettings
): RoundSettingsValidation {
  const definition = getRoundTypeDefinition(type);
  
  if (!definition) {
    return {
      isValid: false,
      errors: [`Unknown round type: ${type}`],
      warnings: [],
    };
  }
  
  return definition.validateSettings(settings);
}

/**
 * Create initial settings for a round type
 */
export function createInitialSettings(type: SocialeRoundType): SocialeRoundSettings {
  const definition = getRoundTypeDefinition(type);
  
  if (!definition) {
    return {};
  }
  
  return definition.createInitialSettings();
}

/**
 * Score a round using its type's scoring strategy
 */
export function scoreRound(
  type: SocialeRoundType, 
  input: ScoreRoundInput
): ScoreRoundResult {
  const definition = getRoundTypeDefinition(type);
  
  if (!definition) {
    return {
      scoreEvents: [],
      updatedScoreboard: {},
    };
  }
  
  return definition.scoreRound(input);
}

/**
 * Build analytics for a round
 */
export function buildRoundAnalytics(
  type: SocialeRoundType, 
  input: AnalyticsInput
): Omit<SocialeAnalyticsRow, 'id' | 'createdAt'>[] {
  const definition = getRoundTypeDefinition(type);
  
  if (!definition) {
    return [];
  }
  
  return definition.buildAnalytics(input);
}

// =============================================================================
// ROUND TYPE METADATA FOR UI
// =============================================================================

/**
 * Get round type metadata for UI display
 */
export function getRoundTypeMetadata(type: SocialeRoundType): {
  label: string;
  description: string;
  emoji: string;
  phases: string[];
} | null {
  const definition = getRoundTypeDefinition(type);
  
  if (!definition) {
    return null;
  }
  
  return {
    label: definition.label,
    description: definition.description ?? '',
    emoji: definition.emoji ?? '🎮',
    phases: definition.defaultPhases,
  };
}

/**
 * Get all round types with metadata for UI
 */
export function getAllRoundTypesWithMetadata(): Array<{
  type: SocialeRoundType;
  label: string;
  description: string;
  emoji: string;
  phases: string[];
}> {
  return getAllRoundTypes().map(def => ({
    type: def.type,
    label: def.label,
    description: def.description ?? '',
    emoji: def.emoji ?? '🎮',
    phases: def.defaultPhases,
  }));
}

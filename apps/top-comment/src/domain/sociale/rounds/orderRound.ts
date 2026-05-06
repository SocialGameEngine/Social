// =============================================================================
// ORDER ROUND TYPE DEFINITION (Drag-and-Drop)
// =============================================================================
// Players arrange items in the correct order using drag-and-drop interface.
// Scoring based on number of items in correct position.
// Perfect order gets bonus points.

import type { 
  OrderRoundSettings,
  SocialeRoundState,
  SocialeResponse,
} from '../../types/sociale.types';
import type { 
  SocialeRoundTypeDefinition, 
  ScoreRoundInput, 
  ScoreRoundResult,
  AnalyticsInput,
  RoundSettingsValidation,
} from '../roundRegistry';

/**
 * Default phase sequence for order rounds
 * Order → Reveal → Results
 */
const ORDER_PHASES = ['order', 'reveal', 'results'];

/**
 * Default timing for order phases (in seconds)
 */
const ORDER_PHASE_TIMING: Record<string, number> = {
  order: 45,     // Time to arrange items
  reveal: 15,    // Show correct order
  results: 12,   // Show scoreboard
};

/**
 * Create initial settings for an order round
 */
function createInitialSettings(): OrderRoundSettings {
  return {
    orderSeconds: 45,
    revealSeconds: 15,
    resultsSeconds: 12,
    prompt: '',
    items: [],
    correctOrder: [],
    pointsForPerfect: 150,
    pointsPerCorrect: 20,
  };
}

/**
 * Validate order round settings
 */
function validateSettings(settings: OrderRoundSettings): RoundSettingsValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!settings.prompt || settings.prompt.trim() === '') {
    errors.push('Prompt is required for order rounds');
  }

  if (!settings.items || settings.items.length < 2) {
    errors.push('At least 2 items are required');
  }

  if (settings.items && settings.items.length > 10) {
    warnings.push('More than 10 items may be difficult to order on mobile');
  }

  if (!settings.correctOrder || settings.correctOrder.length === 0) {
    errors.push('Correct order must be specified');
  }

  if (settings.items && settings.correctOrder && 
      settings.items.length !== settings.correctOrder.length) {
    errors.push('Correct order must have same length as items array');
  }

  if (settings.correctOrder) {
    const uniqueIndices = new Set(settings.correctOrder);
    if (uniqueIndices.size !== settings.correctOrder.length) {
      errors.push('Correct order contains duplicate indices');
    }
    
    const maxIndex = Math.max(...settings.correctOrder);
    const minIndex = Math.min(...settings.correctOrder);
    if (minIndex < 0 || maxIndex >= settings.correctOrder.length) {
      errors.push('Correct order indices must be between 0 and items.length - 1');
    }
  }

  if (settings.orderSeconds && settings.orderSeconds < 20) {
    errors.push('Order time must be at least 20 seconds');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Score an order round
 * Points for each item in correct position, bonus for perfect order
 */
function scoreRound(input: ScoreRoundInput): ScoreRoundResult {
  const { responses, settings } = input;
  const orderSettings = settings as OrderRoundSettings;
  const scoreEvents: ScoreRoundResult['scoreEvents'] = [];
  const updatedScoreboard: Record<string, number> = {};

  const correctOrder = orderSettings.correctOrder || [];
  const pointsPerCorrect = orderSettings.pointsPerCorrect || 20;
  const perfectBonus = orderSettings.pointsForPerfect || 150;

  responses.forEach(response => {
    // Response value should be an array of indices representing the player's order
    const playerOrder = Array.isArray(response.value) 
      ? response.value 
      : JSON.parse(String(response.value || '[]'));

    if (!Array.isArray(playerOrder) || playerOrder.length !== correctOrder.length) {
      return; // Invalid submission
    }

    // Count items in correct position
    let correctCount = 0;
    for (let i = 0; i < correctOrder.length; i++) {
      if (playerOrder[i] === correctOrder[i]) {
        correctCount++;
      }
    }

    let points = 0;
    let reason = '';

    if (correctCount === correctOrder.length) {
      // Perfect order
      points = perfectBonus;
      reason = 'perfect_order';
    } else if (correctCount > 0) {
      // Partial credit
      points = correctCount * pointsPerCorrect;
      reason = 'partial_order';
    }

    if (points > 0) {
      scoreEvents.push({
        socialeId: response.socialeId,
        roundId: response.roundId,
        socialiteId: response.socialiteId,
        reason,
        points,
        metadata: { 
          correctCount,
          totalItems: correctOrder.length,
          isPerfect: correctCount === correctOrder.length,
        },
      });

      updatedScoreboard[response.socialiteId] = 
        (updatedScoreboard[response.socialiteId] ?? 0) + points;
    }
  });

  return { scoreEvents, updatedScoreboard };
}

/**
 * Build analytics for an order round
 */
function buildAnalytics(input: AnalyticsInput): ReturnType<SocialeRoundTypeDefinition['buildAnalytics']> {
  const { roundState, responses, socialites, settings } = input;
  const orderSettings = settings as OrderRoundSettings;
  const analytics: ReturnType<SocialeRoundTypeDefinition['buildAnalytics']> = [];

  // Submission count
  analytics.push({
    socialeId: roundState.socialeId,
    roundId: roundState.roundId,
    category: 'participation',
    metric: 'submission_count',
    value: responses.length,
  });

  // Participation rate
  const activeSocialites = socialites.filter(s => s.isActive && !s.isBanned);
  const participationRate = activeSocialites.length > 0 
    ? responses.length / activeSocialites.length 
    : 0;
  
  analytics.push({
    socialeId: roundState.socialeId,
    roundId: roundState.roundId,
    category: 'participation',
    metric: 'participation_rate',
    value: Math.round(participationRate * 100) / 100,
  });

  // Perfect order count
  const correctOrder = orderSettings.correctOrder || [];
  let perfectCount = 0;
  
  responses.forEach(response => {
    const playerOrder = Array.isArray(response.value) 
      ? response.value 
      : JSON.parse(String(response.value || '[]'));
    
    if (JSON.stringify(playerOrder) === JSON.stringify(correctOrder)) {
      perfectCount++;
    }
  });

  analytics.push({
    socialeId: roundState.socialeId,
    roundId: roundState.roundId,
    category: 'accuracy',
    metric: 'perfect_order_count',
    value: perfectCount,
  });

  // Average accuracy (% of items in correct position)
  let totalCorrect = 0;
  let totalPossible = 0;

  responses.forEach(response => {
    const playerOrder = Array.isArray(response.value) 
      ? response.value 
      : JSON.parse(String(response.value || '[]'));
    
    if (Array.isArray(playerOrder) && playerOrder.length === correctOrder.length) {
      for (let i = 0; i < correctOrder.length; i++) {
        if (playerOrder[i] === correctOrder[i]) {
          totalCorrect++;
        }
      }
      totalPossible += correctOrder.length;
    }
  });

  const avgAccuracy = totalPossible > 0 ? totalCorrect / totalPossible : 0;
  
  analytics.push({
    socialeId: roundState.socialeId,
    roundId: roundState.roundId,
    category: 'accuracy',
    metric: 'avg_accuracy',
    value: Math.round(avgAccuracy * 100) / 100,
  });

  return analytics;
}

/**
 * Check if phase can auto-advance
 */
function canAutoAdvancePhase(phase: string, roundState: SocialeRoundState): boolean {
  // All order phases can auto-advance when timer expires
  return ['order', 'reveal', 'results'].includes(phase);
}

/**
 * Order round type definition
 */
export const orderRoundDefinition: SocialeRoundTypeDefinition = {
  type: 'order',
  label: 'Order Challenge',
  description: 'Arrange items in the correct order using drag-and-drop',
  emoji: '🔢',
  
  defaultPhases: ORDER_PHASES,
  defaultPhaseTiming: ORDER_PHASE_TIMING,
  
  settingsSchema: [
    {
      name: 'prompt',
      type: 'text',
      label: 'Prompt',
      description: 'Instructions for ordering (e.g., "Order these planets by distance from the sun")',
      required: true,
    },
    {
      name: 'items',
      type: 'text',
      label: 'Items (comma-separated)',
      description: 'Items to be ordered, separated by commas',
      required: true,
    },
    {
      name: 'correctOrder',
      type: 'text',
      label: 'Correct Order (indices)',
      description: 'Comma-separated indices representing correct order (e.g., "2,0,1,3")',
      required: true,
    },
    {
      name: 'orderSeconds',
      type: 'number',
      label: 'Order Time (seconds)',
      defaultValue: 45,
      min: 20,
      max: 120,
    },
    {
      name: 'revealSeconds',
      type: 'number',
      label: 'Reveal Time (seconds)',
      defaultValue: 15,
      min: 10,
      max: 30,
    },
    {
      name: 'pointsForPerfect',
      type: 'number',
      label: 'Points for Perfect Order',
      defaultValue: 150,
      min: 50,
      max: 500,
    },
    {
      name: 'pointsPerCorrect',
      type: 'number',
      label: 'Points Per Correct Item',
      defaultValue: 20,
      min: 5,
      max: 100,
    },
  ],
  
  createInitialSettings,
  validateSettings: validateSettings as SocialeRoundTypeDefinition['validateSettings'],
  scoreRound,
  buildAnalytics,
  canAutoAdvancePhase,
};

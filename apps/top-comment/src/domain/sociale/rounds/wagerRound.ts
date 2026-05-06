// =============================================================================
// WAGER ROUND TYPE DEFINITION
// =============================================================================
// Players wager points before seeing the full question.
// Category/title shown during wager phase, full question revealed after wagers placed.
// Correct answers earn wagered points, incorrect answers lose wagered points.

import type { 
  WagerRoundSettings,
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
 * Default phase sequence for wager rounds
 * Wager phase comes before answer phase
 */
const WAGER_PHASES = ['wager', 'answer', 'reveal', 'results'];

/**
 * Default timing for wager phases (in seconds)
 */
const WAGER_PHASE_TIMING: Record<string, number> = {
  wager: 20,     // Time to place wager
  answer: 30,    // Time to answer question
  reveal: 10,    // Show correct answer
  results: 12,   // Show scoreboard
};

/**
 * Create initial settings for a wager round
 */
function createInitialSettings(): WagerRoundSettings {
  return {
    wagerSeconds: 20,
    answerSeconds: 30,
    revealSeconds: 10,
    resultsSeconds: 12,
    minWager: 10,
    maxWager: 100,
    category: '',
    question: '',
    correctAnswer: '',
    acceptedAnswers: [],
    caseSensitive: false,
  };
}

/**
 * Validate wager round settings
 */
function validateSettings(settings: WagerRoundSettings): RoundSettingsValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!settings.category || settings.category.trim() === '') {
    errors.push('Category is required for wager rounds');
  }
  
  if (!settings.question || settings.question.trim() === '') {
    errors.push('Question is required');
  }
  
  if (!settings.correctAnswer || settings.correctAnswer.trim() === '') {
    errors.push('Correct answer is required');
  }

  if (settings.minWager && settings.maxWager && settings.minWager > settings.maxWager) {
    errors.push('Minimum wager cannot be greater than maximum wager');
  }

  if (settings.minWager && settings.minWager < 0) {
    errors.push('Minimum wager must be positive');
  }

  if (settings.maxWager && settings.maxWager > 1000) {
    warnings.push('Very high maximum wager may create large score swings');
  }

  if (settings.wagerSeconds && settings.wagerSeconds < 10) {
    errors.push('Wager time must be at least 10 seconds');
  }

  if (settings.answerSeconds && settings.answerSeconds < 10) {
    errors.push('Answer time must be at least 10 seconds');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Normalize answer for comparison
 */
function normalizeAnswer(answer: string, caseSensitive: boolean): string {
  let normalized = answer.trim();
  if (!caseSensitive) {
    normalized = normalized.toLowerCase();
  }
  return normalized;
}

/**
 * Check if answer is correct
 */
function isAnswerCorrect(
  submittedAnswer: string, 
  correctAnswer: string, 
  acceptedAnswers: string[], 
  caseSensitive: boolean
): boolean {
  const normalized = normalizeAnswer(submittedAnswer, caseSensitive);
  const normalizedCorrect = normalizeAnswer(correctAnswer, caseSensitive);
  
  if (normalized === normalizedCorrect) {
    return true;
  }
  
  return acceptedAnswers.some(accepted => 
    normalizeAnswer(accepted, caseSensitive) === normalized
  );
}

/**
 * Score a wager round
 * Points awarded/deducted based on wager amount and correctness
 */
function scoreRound(input: ScoreRoundInput): ScoreRoundResult {
  const { responses, settings } = input;
  const wagerSettings = settings as WagerRoundSettings;
  const scoreEvents: ScoreRoundResult['scoreEvents'] = [];
  const updatedScoreboard: Record<string, number> = {};

  responses.forEach(response => {
    const submittedAnswer = String(response.value || '').trim();
    const wagerAmount = (response as any).wagerAmount || wagerSettings.minWager || 10;
    
    if (!submittedAnswer) {
      return; // No answer submitted
    }

    const correct = isAnswerCorrect(
      submittedAnswer,
      wagerSettings.correctAnswer,
      wagerSettings.acceptedAnswers || [],
      wagerSettings.caseSensitive || false
    );

    // Award wagered points for correct, deduct for incorrect
    const points = correct ? wagerAmount : -wagerAmount;
    
    scoreEvents.push({
      socialeId: response.socialeId,
      roundId: response.roundId,
      socialiteId: response.socialiteId,
      reason: correct ? 'wager_correct' : 'wager_incorrect',
      points,
      metadata: { 
        answer: submittedAnswer,
        wagerAmount,
        correct,
      },
    });

    updatedScoreboard[response.socialiteId] = 
      (updatedScoreboard[response.socialiteId] ?? 0) + points;
  });

  return { scoreEvents, updatedScoreboard };
}

/**
 * Build analytics for a wager round
 */
function buildAnalytics(input: AnalyticsInput): ReturnType<SocialeRoundTypeDefinition['buildAnalytics']> {
  const { roundState, responses, socialites, settings } = input;
  const wagerSettings = settings as WagerRoundSettings;
  const analytics: ReturnType<SocialeRoundTypeDefinition['buildAnalytics']> = [];

  // Response count
  analytics.push({
    socialeId: roundState.socialeId,
    roundId: roundState.roundId,
    category: 'participation',
    metric: 'response_count',
    value: responses.length,
  });

  // Correct answers count
  const correctCount = responses.filter(r => 
    isAnswerCorrect(
      String(r.value || ''),
      wagerSettings.correctAnswer,
      wagerSettings.acceptedAnswers || [],
      wagerSettings.caseSensitive || false
    )
  ).length;

  analytics.push({
    socialeId: roundState.socialeId,
    roundId: roundState.roundId,
    category: 'accuracy',
    metric: 'correct_count',
    value: correctCount,
  });

  // Accuracy rate
  const accuracyRate = responses.length > 0 
    ? correctCount / responses.length 
    : 0;
  
  analytics.push({
    socialeId: roundState.socialeId,
    roundId: roundState.roundId,
    category: 'accuracy',
    metric: 'accuracy_rate',
    value: Math.round(accuracyRate * 100) / 100,
  });

  // Average wager amount
  const totalWagers = responses.reduce((sum, r) => 
    sum + ((r as any).wagerAmount || wagerSettings.minWager || 10), 0
  );
  const avgWager = responses.length > 0 ? totalWagers / responses.length : 0;
  
  analytics.push({
    socialeId: roundState.socialeId,
    roundId: roundState.roundId,
    category: 'wagering',
    metric: 'avg_wager_amount',
    value: Math.round(avgWager),
  });

  // Risk-taking metric (% who wagered above 50% of max)
  const highWagers = responses.filter(r => {
    const wager = (r as any).wagerAmount || wagerSettings.minWager || 10;
    return wager > (wagerSettings.maxWager || 100) * 0.5;
  }).length;
  
  const riskTakingRate = responses.length > 0 
    ? highWagers / responses.length 
    : 0;
  
  analytics.push({
    socialeId: roundState.socialeId,
    roundId: roundState.roundId,
    category: 'wagering',
    metric: 'risk_taking_rate',
    value: Math.round(riskTakingRate * 100) / 100,
  });

  return analytics;
}

/**
 * Check if phase can auto-advance
 */
function canAutoAdvancePhase(phase: string, roundState: SocialeRoundState): boolean {
  // All wager phases can auto-advance when timer expires
  return ['wager', 'answer', 'reveal', 'results'].includes(phase);
}

/**
 * Wager round type definition
 */
export const wagerRoundDefinition: SocialeRoundTypeDefinition = {
  type: 'wager',
  label: 'Wager',
  description: 'Players wager points before answering a question',
  emoji: '🎲',
  
  defaultPhases: WAGER_PHASES,
  defaultPhaseTiming: WAGER_PHASE_TIMING,
  
  settingsSchema: [
    {
      name: 'category',
      type: 'text',
      label: 'Category',
      description: 'Category shown during wager phase (e.g., "History", "Sports")',
      required: true,
    },
    {
      name: 'question',
      type: 'text',
      label: 'Question',
      description: 'The full question (hidden until after wagers placed)',
      required: true,
    },
    {
      name: 'correctAnswer',
      type: 'text',
      label: 'Correct Answer',
      description: 'The correct answer',
      required: true,
    },
    {
      name: 'acceptedAnswers',
      type: 'text',
      label: 'Accepted Answers',
      description: 'Alternative correct answers, comma-separated (optional)',
      required: false,
    },
    {
      name: 'caseSensitive',
      type: 'boolean',
      label: 'Case Sensitive',
      description: 'Whether answers must match case exactly',
      defaultValue: false,
    },
    {
      name: 'minWager',
      type: 'number',
      label: 'Minimum Wager',
      defaultValue: 10,
      min: 1,
      max: 500,
    },
    {
      name: 'maxWager',
      type: 'number',
      label: 'Maximum Wager',
      defaultValue: 100,
      min: 10,
      max: 1000,
    },
    {
      name: 'wagerSeconds',
      type: 'number',
      label: 'Wager Time (seconds)',
      defaultValue: 20,
      min: 10,
      max: 60,
    },
    {
      name: 'answerSeconds',
      type: 'number',
      label: 'Answer Time (seconds)',
      defaultValue: 30,
      min: 10,
      max: 120,
    },
    {
      name: 'revealSeconds',
      type: 'number',
      label: 'Reveal Time (seconds)',
      defaultValue: 10,
      min: 5,
      max: 30,
    },
  ],
  
  createInitialSettings,
  validateSettings: validateSettings as SocialeRoundTypeDefinition['validateSettings'],
  scoreRound,
  buildAnalytics,
  canAutoAdvancePhase,
};

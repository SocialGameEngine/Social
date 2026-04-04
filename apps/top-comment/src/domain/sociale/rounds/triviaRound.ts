// =============================================================================
// TRIVIA ROUND TYPE DEFINITION
// =============================================================================
// Trivia rounds present a question with either multiple choice or written answer.
// Players are scored based on correctness and optionally speed.

import type { 
  TriviaRoundSettings,
  SocialeRoundState,
} from '../../types/sociale.types';
import type { 
  SocialeRoundTypeDefinition, 
  ScoreRoundInput, 
  ScoreRoundResult,
  AnalyticsInput,
  RoundSettingsValidation,
} from '../roundRegistry';

/**
 * Default phase sequence for trivia rounds
 * Answer → Reveal → Results
 */
const TRIVIA_PHASES = ['answer', 'reveal', 'results'];

/**
 * Default timing for trivia phases (in seconds)
 */
const TRIVIA_PHASE_TIMING: Record<string, number> = {
  answer: 60,    // Players submit answers
  reveal: 5,     // Show correct answer
  results: 5,    // Show updated leaderboard
};

/**
 * Create initial settings for a trivia round
 */
function createInitialSettings(): TriviaRoundSettings {
  return {
    answerSeconds: 30,
    resultsSeconds: 15,
    format: 'multiple_choice',
    difficulty: 'medium',
    pointsCorrect: 100,
    pointsPartial: 50,
    speedBonusEnabled: true,
    maxSpeedBonus: 50,
  };
}

/**
 * Validate trivia round settings (Phase 2 rules)
 */
function validateSettings(settings: TriviaRoundSettings): RoundSettingsValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!settings.format) {
    errors.push('Trivia format is required');
  }
  if (settings.format !== 'multiple_choice' && settings.format !== 'written_answer') {
    errors.push(`Invalid trivia format: ${settings.format}`);
  }
  if (settings.pointsCorrect < 0) {
    errors.push('Points for correct answer must be non-negative');
  }
  if (settings.answerSeconds && settings.answerSeconds < 5) {
    errors.push('Answer time must be at least 5 seconds');
  }

  // Snapshot validation
  const snap = settings.snapshot;
  if (snap) {
    if (!snap.prompt || snap.prompt.trim().length === 0) {
      errors.push('Trivia question prompt is empty');
    }

    if (settings.format === 'multiple_choice') {
      const mc = 'multipleChoice' in snap ? snap.multipleChoice : undefined;
      if (!mc) {
        errors.push('Multiple choice snapshot missing multipleChoice data');
      } else {
        if (!mc.options || mc.options.length < 2) {
          errors.push('Multiple choice requires at least 2 options');
        }
        if (!mc.correctOptionId) {
          errors.push('Multiple choice has no correct option');
        } else if (mc.options && !mc.options.some(o => o.id === mc.correctOptionId)) {
          errors.push('Correct option ID does not match any option');
        }
      }
    } else if (settings.format === 'written_answer') {
      const wa = 'writtenAnswer' in snap ? snap.writtenAnswer : undefined;
      if (!wa) {
        errors.push('Written answer snapshot missing writtenAnswer data');
      } else {
        if (!wa.acceptedAnswers || wa.acceptedAnswers.length === 0) {
          errors.push('Written answer has no accepted answers');
        }
        if (!wa.correctAnswer || wa.correctAnswer.trim().length === 0) {
          errors.push('Written answer has no canonical correct answer');
        }
      }
    }
  } else {
    warnings.push('No snapshot data — trivia question may not render correctly');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Score a trivia round
 * Points based on correctness and optionally speed
 */
function scoreRound(input: ScoreRoundInput): ScoreRoundResult {
  const { responses, settings, roundState } = input;
  const triviaSettings = settings as TriviaRoundSettings;
  const scoreEvents: ScoreRoundResult['scoreEvents'] = [];
  const updatedScoreboard: Record<string, number> = {};

  // Get timing info for speed bonus calculation
  const roundStartedAt = roundState.startedAt ? new Date(roundState.startedAt).getTime() : 0;
  const answerDuration = (triviaSettings.answerSeconds ?? 30) * 1000;

  responses.forEach(response => {
    let points = 0;
    let reason = '';
    const metadata: Record<string, unknown> = {};

    // Check if answer is correct
    const isCorrect = response.isCorrect ?? false;
    const isPartial = (response as any).isPartial ?? false;

    if (isCorrect) {
      points = triviaSettings.pointsCorrect ?? 100;
      reason = 'correct_answer';

      // Calculate speed bonus if enabled
      if (triviaSettings.speedBonusEnabled && roundStartedAt > 0) {
        const responseTime = new Date(response.createdAt).getTime() - roundStartedAt;
        const speedRatio = Math.max(0, 1 - (responseTime / answerDuration));
        const speedBonus = Math.round(speedRatio * (triviaSettings.maxSpeedBonus ?? 50));
        
        if (speedBonus > 0) {
          points += speedBonus;
          metadata.speedBonus = speedBonus;
          metadata.responseTimeMs = responseTime;
        }
      }
    } else if (isPartial) {
      points = triviaSettings.pointsPartial ?? 50;
      reason = 'partial_answer';
    }

    if (points > 0) {
      scoreEvents.push({
        socialeId: response.socialeId,
        roundId: response.roundId,
        socialiteId: response.socialiteId,
        reason,
        points,
        metadata,
      });

      updatedScoreboard[response.socialiteId] = 
        (updatedScoreboard[response.socialiteId] ?? 0) + points;
    }
  });

  return { scoreEvents, updatedScoreboard };
}

/**
 * Build analytics for a trivia round
 */
function buildAnalytics(input: AnalyticsInput): ReturnType<SocialeRoundTypeDefinition['buildAnalytics']> {
  const { roundState, responses, socialites, settings } = input;
  const triviaSettings = settings as TriviaRoundSettings;
  const analytics: ReturnType<SocialeRoundTypeDefinition['buildAnalytics']> = [];

  // Response count
  analytics.push({
    socialeId: roundState.socialeId,
    roundId: roundState.roundId,
    category: 'participation',
    metric: 'response_count',
    value: responses.length,
  });

  // Correctness rate
  const correctCount = responses.filter(r => r.isCorrect).length;
  const correctnessRate = responses.length > 0 ? correctCount / responses.length : 0;
  
  analytics.push({
    socialeId: roundState.socialeId,
    roundId: roundState.roundId,
    category: 'performance',
    metric: 'correctness_rate',
    value: correctnessRate,
  });

  // Average response time (if available)
  const responseTimes = responses
    .filter(r => r.createdAt && roundState.startedAt)
    .map(r => new Date(r.createdAt).getTime() - new Date(roundState.startedAt!).getTime());
  
  if (responseTimes.length > 0) {
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    analytics.push({
      socialeId: roundState.socialeId,
      roundId: roundState.roundId,
      category: 'performance',
      metric: 'avg_response_time_ms',
      value: Math.round(avgResponseTime),
    });
  }

  // Difficulty and category tracking
  if (triviaSettings.difficulty) {
    analytics.push({
      socialeId: roundState.socialeId,
      roundId: roundState.roundId,
      category: 'content',
      metric: 'difficulty',
      value: triviaSettings.difficulty,
    });
  }

  if (triviaSettings.categoryKey) {
    analytics.push({
      socialeId: roundState.socialeId,
      roundId: roundState.roundId,
      category: 'content',
      metric: 'category',
      value: triviaSettings.categoryKey,
    });
  }

  return analytics;
}

/**
 * Check if phase can auto-advance
 */
function canAutoAdvancePhase(phase: string, _roundState: SocialeRoundState): boolean {
  // All trivia phases can auto-advance when timer expires
  return TRIVIA_PHASES.includes(phase);
}

/**
 * Trivia round type definition
 */
export const triviaRoundDefinition: SocialeRoundTypeDefinition = {
  type: 'trivia',
  label: 'Trivia',
  description: 'Answer trivia questions for points',
  emoji: '🧠',
  
  defaultPhases: TRIVIA_PHASES,
  defaultPhaseTiming: TRIVIA_PHASE_TIMING,
  
  settingsSchema: [
    {
      name: 'questionPackId',
      type: 'select',
      label: 'Question Pack',
      description: 'Select a question pack',
      required: false,
      options: [], // Populated dynamically
    },
    {
      name: 'format',
      type: 'select',
      label: 'Answer Format',
      defaultValue: 'multiple_choice',
      required: true,
      options: [
        { value: 'multiple_choice', label: 'Multiple Choice' },
        { value: 'written_answer', label: 'Written Answer' },
      ],
    },
    {
      name: 'difficulty',
      type: 'select',
      label: 'Difficulty',
      defaultValue: 'medium',
      options: [
        { value: 'easy', label: 'Easy' },
        { value: 'medium', label: 'Medium' },
        { value: 'hard', label: 'Hard' },
      ],
    },
    {
      name: 'answerSeconds',
      type: 'number',
      label: 'Answer Time (seconds)',
      defaultValue: 30,
      min: 5,
      max: 120,
    },
    {
      name: 'pointsCorrect',
      type: 'number',
      label: 'Points for Correct Answer',
      defaultValue: 100,
      min: 0,
      max: 1000,
    },
    {
      name: 'pointsPartial',
      type: 'number',
      label: 'Points for Partial Answer',
      defaultValue: 50,
      min: 0,
      max: 500,
    },
    {
      name: 'speedBonusEnabled',
      type: 'boolean',
      label: 'Enable Speed Bonus',
      defaultValue: true,
    },
    {
      name: 'maxSpeedBonus',
      type: 'number',
      label: 'Max Speed Bonus',
      defaultValue: 50,
      min: 0,
      max: 200,
    },
  ],
  
  createInitialSettings,
  validateSettings: validateSettings as SocialeRoundTypeDefinition['validateSettings'],
  scoreRound,
  buildAnalytics,
  canAutoAdvancePhase,
};

// =============================================================================
// PREDICTIVE ROUND TYPE DEFINITION
// =============================================================================
// Players submit answers, then host reviews and selects the correct one.
// Points awarded to players whose answer matches the host's selection.
// Useful for subjective or creative prompts where there's no single right answer.

import type { 
  PredictiveRoundSettings,
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
 * Default phase sequence for predictive rounds
 * Submit → Host Review → Reveal → Results
 */
const PREDICTIVE_PHASES = ['submit', 'host_review', 'reveal', 'results'];

/**
 * Default timing for predictive phases (in seconds)
 */
const PREDICTIVE_PHASE_TIMING: Record<string, number> = {
  submit: 60,        // Time for players to submit
  host_review: 120,  // Host reviews and picks correct answer (no timer)
  reveal: 15,        // Show host's selection
  results: 12,       // Show scoreboard
};

/**
 * Create initial settings for a predictive round
 */
function createInitialSettings(): PredictiveRoundSettings {
  return {
    submissionSeconds: 60,
    reviewSeconds: 120,
    revealSeconds: 15,
    resultsSeconds: 12,
    prompt: '',
    pointsForMatch: 100,
  };
}

/**
 * Validate predictive round settings
 */
function validateSettings(settings: PredictiveRoundSettings): RoundSettingsValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!settings.prompt || settings.prompt.trim() === '') {
    errors.push('Prompt is required for predictive rounds');
  }

  if (settings.submissionSeconds && settings.submissionSeconds < 20) {
    errors.push('Submission time must be at least 20 seconds');
  }

  if (settings.submissionSeconds && settings.submissionSeconds > 180) {
    warnings.push('Submission time over 3 minutes may cause player drop-off');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Score a predictive round
 * Points awarded to players whose answer matches host's selection
 */
function scoreRound(input: ScoreRoundInput): ScoreRoundResult {
  const { responses, settings, roundState } = input;
  const predictiveSettings = settings as PredictiveRoundSettings;
  const scoreEvents: ScoreRoundResult['scoreEvents'] = [];
  const updatedScoreboard: Record<string, number> = {};

  // Host's selected answer ID stored in roundState.derivedState
  const hostSelectedId = (roundState as any).derivedState?.hostSelectedAnswerId;
  
  if (!hostSelectedId) {
    // Host hasn't made a selection yet, no scoring
    return { scoreEvents, updatedScoreboard };
  }

  const pointsForMatch = predictiveSettings.pointsForMatch || 100;

  // Find the selected response
  const selectedResponse = responses.find(r => r.id === hostSelectedId);
  
  if (!selectedResponse) {
    // Invalid selection
    return { scoreEvents, updatedScoreboard };
  }

  // Award points to the player whose answer was selected
  scoreEvents.push({
    socialeId: selectedResponse.socialeId,
    roundId: selectedResponse.roundId,
    socialiteId: selectedResponse.socialiteId,
    reason: 'host_selected',
    points: pointsForMatch,
    metadata: { 
      wasSelected: true,
      selectedAnswer: selectedResponse.value,
    },
  });

  updatedScoreboard[selectedResponse.socialiteId] = 
    (updatedScoreboard[selectedResponse.socialiteId] ?? 0) + pointsForMatch;

  // Optional: Award participation points to others
  responses.forEach(response => {
    if (response.id !== hostSelectedId && response.value) {
      const participationPoints = 10;
      scoreEvents.push({
        socialeId: response.socialeId,
        roundId: response.roundId,
        socialiteId: response.socialiteId,
        reason: 'participation',
        points: participationPoints,
        metadata: { participated: true },
      });

      updatedScoreboard[response.socialiteId] = 
        (updatedScoreboard[response.socialiteId] ?? 0) + participationPoints;
    }
  });

  return { scoreEvents, updatedScoreboard };
}

/**
 * Build analytics for a predictive round
 */
function buildAnalytics(input: AnalyticsInput): ReturnType<SocialeRoundTypeDefinition['buildAnalytics']> {
  const { roundState, responses, socialites } = input;
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

  // Average answer length
  const avgLength = responses.length > 0
    ? responses.reduce((sum, r) => sum + String(r.value || '').length, 0) / responses.length
    : 0;
  
  analytics.push({
    socialeId: roundState.socialeId,
    roundId: roundState.roundId,
    category: 'content',
    metric: 'avg_answer_length',
    value: Math.round(avgLength),
  });

  // Host review time (if available)
  const reviewTimeMs = (roundState as any).derivedState?.hostReviewTimeMs;
  if (reviewTimeMs) {
    analytics.push({
      socialeId: roundState.socialeId,
      roundId: roundState.roundId,
      category: 'timing',
      metric: 'host_review_time_ms',
      value: reviewTimeMs,
    });
  }

  return analytics;
}

/**
 * Check if phase can auto-advance
 */
function canAutoAdvancePhase(phase: string, roundState: SocialeRoundState): boolean {
  // Host review phase should NOT auto-advance - host must manually advance
  if (phase === 'host_review') {
    return false;
  }
  
  // Other phases can auto-advance
  return ['submit', 'reveal', 'results'].includes(phase);
}

/**
 * Predictive round type definition
 */
export const predictiveRoundDefinition: SocialeRoundTypeDefinition = {
  type: 'predictive',
  label: 'Predictive Round',
  description: 'Players submit answers, host picks the correct one',
  emoji: '🎯',
  
  defaultPhases: PREDICTIVE_PHASES,
  defaultPhaseTiming: PREDICTIVE_PHASE_TIMING,
  
  settingsSchema: [
    {
      name: 'prompt',
      type: 'text',
      label: 'Prompt',
      description: 'The question or prompt players will answer',
      required: true,
    },
    {
      name: 'submissionSeconds',
      type: 'number',
      label: 'Submission Time (seconds)',
      defaultValue: 60,
      min: 20,
      max: 180,
    },
    {
      name: 'reviewSeconds',
      type: 'number',
      label: 'Review Time Limit (seconds)',
      description: 'Maximum time for host to review (0 = no limit)',
      defaultValue: 120,
      min: 0,
      max: 300,
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
      name: 'pointsForMatch',
      type: 'number',
      label: 'Points for Selected Answer',
      defaultValue: 100,
      min: 50,
      max: 500,
    },
  ],
  
  createInitialSettings,
  validateSettings: validateSettings as SocialeRoundTypeDefinition['validateSettings'],
  scoreRound,
  buildAnalytics,
  canAutoAdvancePhase,
};

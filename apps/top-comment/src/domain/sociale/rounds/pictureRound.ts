// =============================================================================
// PICTURE ROUND TYPE DEFINITION
// =============================================================================
// Players identify what's in an image by submitting text answers.
// Host uploads image to Supabase Storage during round creation.
// Scoring based on exact match (case-insensitive) with accepted answers.

import type { 
  PictureRoundSettings,
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
 * Default phase sequence for picture rounds
 * No voting phase - scoring is based on correct answers
 */
const PICTURE_PHASES = ['answer', 'reveal', 'results'];

/**
 * Default timing for picture phases (in seconds)
 */
const PICTURE_PHASE_TIMING: Record<string, number> = {
  answer: 30,    // Time to identify the image
  reveal: 10,    // Show correct answer
  results: 12,   // Show scoreboard
};

/**
 * Create initial settings for a picture round
 */
function createInitialSettings(): PictureRoundSettings {
  return {
    answerSeconds: 30,
    revealSeconds: 10,
    resultsSeconds: 12,
    imageUrl: '',
    correctAnswer: '',
    acceptedAnswers: [],
    caseSensitive: false,
    pointsForCorrect: 100,
  };
}

/**
 * Validate picture round settings
 */
function validateSettings(settings: PictureRoundSettings): RoundSettingsValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!settings.imageUrl || settings.imageUrl.trim() === '') {
    errors.push('Image URL is required');
  }
  
  if (!settings.correctAnswer || settings.correctAnswer.trim() === '') {
    errors.push('Correct answer is required');
  }

  if (settings.answerSeconds && settings.answerSeconds < 10) {
    errors.push('Answer time must be at least 10 seconds');
  }
  
  if (settings.answerSeconds && settings.answerSeconds > 120) {
    warnings.push('Answer time over 2 minutes may be too long for image identification');
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
  
  // Check exact match with correct answer
  if (normalized === normalizedCorrect) {
    return true;
  }
  
  // Check against accepted alternatives
  return acceptedAnswers.some(accepted => 
    normalizeAnswer(accepted, caseSensitive) === normalized
  );
}

/**
 * Score a picture round
 * Points awarded for correct answers only
 */
function scoreRound(input: ScoreRoundInput): ScoreRoundResult {
  const { responses, settings } = input;
  const pictureSettings = settings as PictureRoundSettings;
  const scoreEvents: ScoreRoundResult['scoreEvents'] = [];
  const updatedScoreboard: Record<string, number> = {};

  responses.forEach(response => {
    const submittedAnswer = String(response.value || '').trim();
    
    if (!submittedAnswer) {
      return; // No answer submitted
    }

    const correct = isAnswerCorrect(
      submittedAnswer,
      pictureSettings.correctAnswer,
      pictureSettings.acceptedAnswers || [],
      pictureSettings.caseSensitive || false
    );

    if (correct) {
      const points = pictureSettings.pointsForCorrect || 100;
      
      scoreEvents.push({
        socialeId: response.socialeId,
        roundId: response.roundId,
        socialiteId: response.socialiteId,
        reason: 'correct_answer',
        points,
        metadata: { 
          answer: submittedAnswer,
        },
      });

      updatedScoreboard[response.socialiteId] = 
        (updatedScoreboard[response.socialiteId] ?? 0) + points;
    }
  });

  return { scoreEvents, updatedScoreboard };
}

/**
 * Build analytics for a picture round
 */
function buildAnalytics(input: AnalyticsInput): ReturnType<SocialeRoundTypeDefinition['buildAnalytics']> {
  const { roundState, responses, socialites, settings } = input;
  const pictureSettings = settings as PictureRoundSettings;
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
      pictureSettings.correctAnswer,
      pictureSettings.acceptedAnswers || [],
      pictureSettings.caseSensitive || false
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

  return analytics;
}

/**
 * Check if phase can auto-advance
 */
function canAutoAdvancePhase(phase: string, roundState: SocialeRoundState): boolean {
  // All picture phases can auto-advance when timer expires
  return ['answer', 'reveal', 'results'].includes(phase);
}

/**
 * Picture round type definition
 */
export const pictureRoundDefinition: SocialeRoundTypeDefinition = {
  type: 'picture',
  label: 'Picture',
  description: 'Players identify what\'s in an image',
  emoji: '🖼️',
  
  defaultPhases: PICTURE_PHASES,
  defaultPhaseTiming: PICTURE_PHASE_TIMING,
  
  settingsSchema: [
    {
      name: 'imageUrl',
      type: 'text',
      label: 'Image URL',
      description: 'URL of the image to identify (uploaded to Supabase Storage)',
      required: true,
    },
    {
      name: 'correctAnswer',
      type: 'text',
      label: 'Correct Answer',
      description: 'The correct answer for this image',
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
    {
      name: 'pointsForCorrect',
      type: 'number',
      label: 'Points for Correct Answer',
      defaultValue: 100,
      min: 10,
      max: 1000,
    },
  ],
  
  createInitialSettings,
  validateSettings: validateSettings as SocialeRoundTypeDefinition['validateSettings'],
  scoreRound,
  buildAnalytics,
  canAutoAdvancePhase,
};

// =============================================================================
// PHOTO SUBMISSION ROUND TYPE DEFINITION
// =============================================================================
// Players capture photos with their phone camera in response to a prompt.
// Photos are uploaded to Supabase Storage, moderated via OpenAI, and voted on.
// Camera-only capture (no gallery uploads) for authenticity.

import type { 
  PhotoRoundSettings,
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
 * Default phase sequence for photo rounds
 * Capture → Gallery → Vote → Results
 */
const PHOTO_PHASES = ['capture', 'gallery', 'vote', 'results'];

/**
 * Default timing for photo phases (in seconds)
 */
const PHOTO_PHASE_TIMING: Record<string, number> = {
  capture: 60,   // Time to take and upload photo
  gallery: 15,   // Preview all submissions
  vote: 30,      // Vote on best photo
  results: 12,   // Show scoreboard
};

/**
 * Create initial settings for a photo round
 */
function createInitialSettings(): PhotoRoundSettings {
  return {
    captureSeconds: 60,
    gallerySeconds: 15,
    votingSeconds: 30,
    resultsSeconds: 12,
    prompt: '',
    maxFileSize: 2097152, // 2MB in bytes
    requireModeration: true,
    allowMultipleVotes: false,
  };
}

/**
 * Validate photo round settings
 */
function validateSettings(settings: PhotoRoundSettings): RoundSettingsValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!settings.prompt || settings.prompt.trim() === '') {
    errors.push('Prompt is required for photo rounds');
  }

  if (settings.captureSeconds && settings.captureSeconds < 30) {
    errors.push('Capture time must be at least 30 seconds');
  }

  if (settings.captureSeconds && settings.captureSeconds > 300) {
    warnings.push('Capture time over 5 minutes may cause player drop-off');
  }

  if (settings.votingSeconds && settings.votingSeconds < 10) {
    errors.push('Voting time must be at least 10 seconds');
  }

  if (settings.maxFileSize && settings.maxFileSize > 5242880) {
    warnings.push('File size over 5MB may cause slow uploads on mobile networks');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Score a photo round
 * Points are awarded based on votes received
 */
function scoreRound(input: ScoreRoundInput): ScoreRoundResult {
  const { responses, settings } = input;
  const scoreEvents: ScoreRoundResult['scoreEvents'] = [];
  const updatedScoreboard: Record<string, number> = {};

  // Count votes per response (photo submission)
  const voteCountByResponse = new Map<string, number>();
  
  // In real implementation, votes would come from roundState.derivedState
  responses.forEach(response => {
    const voteCount = (response as any).voteCount ?? 0;
    voteCountByResponse.set(response.id, voteCount);
  });

  // Find winner(s) - photos with most votes
  let maxVotes = 0;
  voteCountByResponse.forEach(count => {
    if (count > maxVotes) maxVotes = count;
  });

  // Award points
  responses.forEach(response => {
    const voteCount = voteCountByResponse.get(response.id) ?? 0;
    let points = 0;
    let reason = '';

    if (voteCount === maxVotes && maxVotes > 0) {
      // Winner gets 100 points
      points = 100;
      reason = 'photo_winner';
    } else if (voteCount > 0) {
      // Others get 10 points per vote
      points = voteCount * 10;
      reason = 'photo_votes_received';
    }

    // Participation bonus for submitting
    if (points === 0 && response.value) {
      points = 10;
      reason = 'photo_participation';
    }

    if (points > 0) {
      scoreEvents.push({
        socialeId: response.socialeId,
        roundId: response.roundId,
        socialiteId: response.socialiteId,
        reason,
        points,
        metadata: { voteCount },
      });

      updatedScoreboard[response.socialiteId] = 
        (updatedScoreboard[response.socialiteId] ?? 0) + points;
    }
  });

  return { scoreEvents, updatedScoreboard };
}

/**
 * Build analytics for a photo round
 */
function buildAnalytics(input: AnalyticsInput): ReturnType<SocialeRoundTypeDefinition['buildAnalytics']> {
  const { roundState, responses, socialites } = input;
  const analytics: ReturnType<SocialeRoundTypeDefinition['buildAnalytics']> = [];

  // Submission count
  analytics.push({
    socialeId: roundState.socialeId,
    roundId: roundState.roundId,
    category: 'participation',
    metric: 'photo_submission_count',
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

  // Moderation stats (if available in metadata)
  const moderatedCount = responses.filter(r => 
    (r as any).moderationStatus === 'approved'
  ).length;
  
  if (moderatedCount > 0) {
    analytics.push({
      socialeId: roundState.socialeId,
      roundId: roundState.roundId,
      category: 'moderation',
      metric: 'moderated_submissions',
      value: moderatedCount,
    });
  }

  return analytics;
}

/**
 * Check if phase can auto-advance
 */
function canAutoAdvancePhase(phase: string, roundState: SocialeRoundState): boolean {
  // All photo phases can auto-advance when timer expires
  return ['capture', 'gallery', 'vote', 'results'].includes(phase);
}

/**
 * Photo submission round type definition
 */
export const photoRoundDefinition: SocialeRoundTypeDefinition = {
  type: 'photo',
  label: 'Photo Challenge',
  description: 'Players capture photos with their camera in response to a prompt',
  emoji: '📸',
  
  defaultPhases: PHOTO_PHASES,
  defaultPhaseTiming: PHOTO_PHASE_TIMING,
  
  settingsSchema: [
    {
      name: 'prompt',
      type: 'text',
      label: 'Photo Prompt',
      description: 'What should players photograph? (e.g., "Something blue", "Your best smile")',
      required: true,
    },
    {
      name: 'captureSeconds',
      type: 'number',
      label: 'Capture Time (seconds)',
      defaultValue: 60,
      min: 30,
      max: 300,
    },
    {
      name: 'gallerySeconds',
      type: 'number',
      label: 'Gallery Preview Time (seconds)',
      defaultValue: 15,
      min: 5,
      max: 60,
    },
    {
      name: 'votingSeconds',
      type: 'number',
      label: 'Voting Time (seconds)',
      defaultValue: 30,
      min: 10,
      max: 120,
    },
    {
      name: 'maxFileSize',
      type: 'number',
      label: 'Max File Size (bytes)',
      defaultValue: 2097152,
      min: 524288,  // 512KB
      max: 5242880, // 5MB
    },
    {
      name: 'requireModeration',
      type: 'boolean',
      label: 'Require AI Moderation',
      description: 'Use OpenAI to check photos for inappropriate content',
      defaultValue: true,
    },
    {
      name: 'allowMultipleVotes',
      type: 'boolean',
      label: 'Allow Multiple Votes',
      description: 'Let players vote for multiple photos',
      defaultValue: false,
    },
  ],
  
  createInitialSettings,
  validateSettings: validateSettings as SocialeRoundTypeDefinition['validateSettings'],
  scoreRound,
  buildAnalytics,
  canAutoAdvancePhase,
};

// =============================================================================
// DEAD MAN'S BLUFF ROUND TYPE DEFINITION (Fibbage-style)
// =============================================================================
// Players submit text bluffs simultaneously in response to a question.
// All bluffs are shuffled with the real answer into multiple choice.
// Dual scoring: points for picking the truth, points for each player who picks your bluff.

import type { 
  BluffRoundSettings,
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
 * Default phase sequence for bluff rounds
 * Bluff → Vote → Reveal → Results
 */
const BLUFF_PHASES = ['bluff', 'vote', 'reveal', 'results'];

/**
 * Default timing for bluff phases (in seconds)
 */
const BLUFF_PHASE_TIMING: Record<string, number> = {
  bluff: 45,     // Time to write a convincing bluff
  vote: 30,      // Time to pick the real answer
  reveal: 15,    // Show who picked what
  results: 12,   // Show scoreboard
};

/**
 * Create initial settings for a bluff round
 */
function createInitialSettings(): BluffRoundSettings {
  return {
    bluffSeconds: 45,
    votingSeconds: 30,
    revealSeconds: 15,
    resultsSeconds: 12,
    question: '',
    realAnswer: '',
    pointsForTruth: 100,
    pointsPerFool: 50,
    maxBluffLength: 100,
  };
}

/**
 * Validate bluff round settings
 */
function validateSettings(settings: BluffRoundSettings): RoundSettingsValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!settings.question || settings.question.trim() === '') {
    errors.push('Question is required for bluff rounds');
  }

  if (!settings.realAnswer || settings.realAnswer.trim() === '') {
    errors.push('Real answer is required');
  }

  if (settings.bluffSeconds && settings.bluffSeconds < 20) {
    errors.push('Bluff time must be at least 20 seconds');
  }

  if (settings.bluffSeconds && settings.bluffSeconds > 120) {
    warnings.push('Bluff time over 2 minutes may cause player drop-off');
  }

  if (settings.votingSeconds && settings.votingSeconds < 15) {
    errors.push('Voting time must be at least 15 seconds (players need time to read all bluffs)');
  }

  if (settings.maxBluffLength && settings.maxBluffLength < 20) {
    warnings.push('Very short bluff length may limit creativity');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Score a bluff round
 * Dual scoring: points for picking truth + points per player fooled by your bluff
 */
function scoreRound(input: ScoreRoundInput): ScoreRoundResult {
  const { responses, settings } = input;
  const bluffSettings = settings as BluffRoundSettings;
  const scoreEvents: ScoreRoundResult['scoreEvents'] = [];
  const updatedScoreboard: Record<string, number> = {};

  // Map of bluff submission ID to the socialite who wrote it
  const bluffAuthors = new Map<string, string>();
  responses.forEach(response => {
    if (response.value) {
      bluffAuthors.set(response.id, response.socialiteId);
    }
  });

  // Count votes per option (bluffs + real answer)
  // In real implementation, votes would come from roundState.derivedState
  const votesPerOption = new Map<string, Set<string>>();
  
  // Mock vote data structure: { voterId, selectedOptionId }
  const votes = (input as any).votes || [];
  votes.forEach((vote: any) => {
    if (!votesPerOption.has(vote.selectedOptionId)) {
      votesPerOption.set(vote.selectedOptionId, new Set());
    }
    votesPerOption.get(vote.selectedOptionId)!.add(vote.voterId);
  });

  // Score voters who picked the truth
  const truthVoters = votesPerOption.get('REAL_ANSWER') || new Set();
  truthVoters.forEach(voterId => {
    const points = bluffSettings.pointsForTruth || 100;
    scoreEvents.push({
      socialeId: responses[0]?.socialeId || '',
      roundId: responses[0]?.roundId || '',
      socialiteId: voterId,
      reason: 'picked_truth',
      points,
      metadata: { pickedRealAnswer: true },
    });
    updatedScoreboard[voterId] = (updatedScoreboard[voterId] ?? 0) + points;
  });

  // Score bluff authors based on how many players they fooled
  bluffAuthors.forEach((authorId, bluffId) => {
    const fooledPlayers = votesPerOption.get(bluffId) || new Set();
    const foolCount = fooledPlayers.size;
    
    if (foolCount > 0) {
      const points = foolCount * (bluffSettings.pointsPerFool || 50);
      scoreEvents.push({
        socialeId: responses[0]?.socialeId || '',
        roundId: responses[0]?.roundId || '',
        socialiteId: authorId,
        reason: 'bluff_success',
        points,
        metadata: { 
          fooledCount: foolCount,
          bluffText: responses.find(r => r.id === bluffId)?.value,
        },
      });
      updatedScoreboard[authorId] = (updatedScoreboard[authorId] ?? 0) + points;
    }
  });

  return { scoreEvents, updatedScoreboard };
}

/**
 * Build analytics for a bluff round
 */
function buildAnalytics(input: AnalyticsInput): ReturnType<SocialeRoundTypeDefinition['buildAnalytics']> {
  const { roundState, responses, socialites } = input;
  const analytics: ReturnType<SocialeRoundTypeDefinition['buildAnalytics']> = [];

  // Bluff submission count
  analytics.push({
    socialeId: roundState.socialeId,
    roundId: roundState.roundId,
    category: 'participation',
    metric: 'bluff_submission_count',
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

  // Average bluff length
  const avgLength = responses.length > 0
    ? responses.reduce((sum, r) => sum + String(r.value || '').length, 0) / responses.length
    : 0;
  
  analytics.push({
    socialeId: roundState.socialeId,
    roundId: roundState.roundId,
    category: 'content',
    metric: 'avg_bluff_length',
    value: Math.round(avgLength),
  });

  // Truth-picking rate (how many picked the real answer)
  const votes = (input as any).votes || [];
  const truthPickers = votes.filter((v: any) => v.selectedOptionId === 'REAL_ANSWER').length;
  const truthRate = votes.length > 0 ? truthPickers / votes.length : 0;
  
  analytics.push({
    socialeId: roundState.socialeId,
    roundId: roundState.roundId,
    category: 'deception',
    metric: 'truth_picking_rate',
    value: Math.round(truthRate * 100) / 100,
  });

  return analytics;
}

/**
 * Check if phase can auto-advance
 */
function canAutoAdvancePhase(phase: string, roundState: SocialeRoundState): boolean {
  // All bluff phases can auto-advance when timer expires
  return ['bluff', 'vote', 'reveal', 'results'].includes(phase);
}

/**
 * Dead Man's Bluff round type definition
 */
export const bluffRoundDefinition: SocialeRoundTypeDefinition = {
  type: 'bluff',
  label: 'Dead Man\'s Bluff',
  description: 'Players write convincing lies, then vote for the truth (Fibbage-style)',
  emoji: '🃏',
  
  defaultPhases: BLUFF_PHASES,
  defaultPhaseTiming: BLUFF_PHASE_TIMING,
  
  settingsSchema: [
    {
      name: 'question',
      type: 'text',
      label: 'Question',
      description: 'The question players will bluff about (e.g., "What does SPAM stand for?")',
      required: true,
    },
    {
      name: 'realAnswer',
      type: 'text',
      label: 'Real Answer',
      description: 'The actual true answer',
      required: true,
    },
    {
      name: 'bluffSeconds',
      type: 'number',
      label: 'Bluff Time (seconds)',
      defaultValue: 45,
      min: 20,
      max: 120,
    },
    {
      name: 'votingSeconds',
      type: 'number',
      label: 'Voting Time (seconds)',
      defaultValue: 30,
      min: 15,
      max: 90,
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
      name: 'maxBluffLength',
      type: 'number',
      label: 'Max Bluff Length',
      defaultValue: 100,
      min: 20,
      max: 200,
    },
    {
      name: 'pointsForTruth',
      type: 'number',
      label: 'Points for Picking Truth',
      defaultValue: 100,
      min: 10,
      max: 500,
    },
    {
      name: 'pointsPerFool',
      type: 'number',
      label: 'Points Per Player Fooled',
      defaultValue: 50,
      min: 10,
      max: 200,
    },
  ],
  
  createInitialSettings,
  validateSettings: validateSettings as SocialeRoundTypeDefinition['validateSettings'],
  scoreRound,
  buildAnalytics,
  canAutoAdvancePhase,
};

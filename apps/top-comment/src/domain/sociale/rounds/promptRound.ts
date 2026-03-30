// =============================================================================
// PROMPT ROUND TYPE DEFINITION
// =============================================================================
// This round type provides backward compatibility with existing Session prompts.
// Players submit text answers to a prompt, then vote on the best answers.

import type { 
  PromptRoundSettings,
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
 * Default phase sequence for prompt rounds
 */
const PROMPT_PHASES = ['answer', 'vote', 'results'];

/**
 * Default timing for prompt phases (in seconds)
 */
const PROMPT_PHASE_TIMING: Record<string, number> = {
  answer: 90,
  vote: 30,
  results: 12,
};

/**
 * Create initial settings for a prompt round
 */
function createInitialSettings(): PromptRoundSettings {
  return {
    answerSeconds: 90,
    votingSeconds: 30,
    resultsSeconds: 12,
    maxAnswerLength: 280,
    profanityFilter: 'moderate',
  };
}

/**
 * Validate prompt round settings
 */
function validateSettings(settings: PromptRoundSettings): RoundSettingsValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (settings.answerSeconds && settings.answerSeconds < 10) {
    errors.push('Answer time must be at least 10 seconds');
  }
  if (settings.answerSeconds && settings.answerSeconds > 600) {
    warnings.push('Answer time over 10 minutes may cause player drop-off');
  }
  if (settings.votingSeconds && settings.votingSeconds < 5) {
    errors.push('Voting time must be at least 5 seconds');
  }
  if (settings.maxAnswerLength && settings.maxAnswerLength > 500) {
    warnings.push('Long answers may be hard to read during voting');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Score a prompt round
 * Points are awarded based on votes received
 */
function scoreRound(input: ScoreRoundInput): ScoreRoundResult {
  const { responses, settings } = input;
  const scoreEvents: ScoreRoundResult['scoreEvents'] = [];
  const updatedScoreboard: Record<string, number> = {};

  // Count votes per response
  const voteCountByResponse = new Map<string, number>();
  // Note: votes would come from roundState.derivedState in real implementation
  
  // For now, use response data to determine scoring
  // In real implementation, this would use actual vote counts
  responses.forEach(response => {
    const voteCount = (response as any).voteCount ?? 0;
    voteCountByResponse.set(response.id, voteCount);
  });

  // Find winner(s) - responses with most votes
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
      reason = 'round_winner';
    } else if (voteCount > 0) {
      // Others get 10 points per vote
      points = voteCount * 10;
      reason = 'votes_received';
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
 * Build analytics for a prompt round
 */
function buildAnalytics(input: AnalyticsInput): ReturnType<SocialeRoundTypeDefinition['buildAnalytics']> {
  const { roundState, responses, socialites } = input;
  const analytics: ReturnType<SocialeRoundTypeDefinition['buildAnalytics']> = [];

  // Response count
  analytics.push({
    socialeId: roundState.socialeId,
    roundId: roundState.roundId,
    category: 'participation',
    metric: 'response_count',
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
    value: participationRate,
  });

  // Average response length
  const avgLength = responses.length > 0
    ? responses.reduce((sum, r) => sum + String(r.value).length, 0) / responses.length
    : 0;
  
  analytics.push({
    socialeId: roundState.socialeId,
    roundId: roundState.roundId,
    category: 'content',
    metric: 'avg_response_length',
    value: Math.round(avgLength),
  });

  return analytics;
}

/**
 * Check if phase can auto-advance
 */
function canAutoAdvancePhase(phase: string, roundState: SocialeRoundState): boolean {
  // All prompt phases can auto-advance when timer expires
  return ['answer', 'vote', 'results'].includes(phase);
}

/**
 * Prompt round type definition
 */
export const promptRoundDefinition: SocialeRoundTypeDefinition = {
  type: 'prompt',
  label: 'Prompt',
  description: 'Players answer a prompt, then vote on the best answers',
  emoji: '💬',
  
  defaultPhases: PROMPT_PHASES,
  defaultPhaseTiming: PROMPT_PHASE_TIMING,
  
  settingsSchema: [
    {
      name: 'prompt',
      type: 'text',
      label: 'Prompt',
      description: 'The question or prompt players will answer',
      required: false,
    },
    {
      name: 'promptLibraryId',
      type: 'select',
      label: 'Prompt Library',
      description: 'Select a library to pull prompts from',
      required: false,
      options: [], // Populated dynamically
    },
    {
      name: 'answerSeconds',
      type: 'number',
      label: 'Answer Time (seconds)',
      defaultValue: 90,
      min: 10,
      max: 600,
    },
    {
      name: 'votingSeconds',
      type: 'number',
      label: 'Voting Time (seconds)',
      defaultValue: 30,
      min: 5,
      max: 120,
    },
    {
      name: 'maxAnswerLength',
      type: 'number',
      label: 'Max Answer Length',
      defaultValue: 280,
      min: 50,
      max: 500,
    },
    {
      name: 'profanityFilter',
      type: 'select',
      label: 'Profanity Filter',
      defaultValue: 'moderate',
      options: [
        { value: 'strict', label: 'Strict' },
        { value: 'moderate', label: 'Moderate' },
        { value: 'off', label: 'Off' },
      ],
    },
  ],
  
  createInitialSettings,
  validateSettings: validateSettings as SocialeRoundTypeDefinition['validateSettings'],
  scoreRound,
  buildAnalytics,
  canAutoAdvancePhase,
};

// =============================================================================
// TOPIC ROUND TYPE DEFINITION
// =============================================================================
// Topic rounds allow players to submit responses to a topic/question.
// Responses can be upvoted by other players. No formal voting phase.

import type { 
  TopicRoundSettings,
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
 * Default phase sequence for topic rounds
 * Answer → Vote → Results
 */
const TOPIC_PHASES = ['answer', 'vote', 'results'];

/**
 * Default timing for topic phases (in seconds)
 */
const TOPIC_PHASE_TIMING: Record<string, number> = {
  answer: 60,     // Players submit responses
  vote: 30,       // Vote for best response
  results: 5,     // Show updated leaderboard
};

/**
 * Create initial settings for a topic round
 */
function createInitialSettings(): TopicRoundSettings {
  return {
    answerSeconds: 300,
    resultsSeconds: 30,
    sortBy: 'upvotes',
    allowUpvotes: true,
    maxResponses: 3,
  };
}

/**
 * Validate topic round settings
 */
function validateSettings(settings: TopicRoundSettings): RoundSettingsValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (settings.answerSeconds && settings.answerSeconds < 30) {
    errors.push('Active time must be at least 30 seconds');
  }
  if (settings.maxResponses && settings.maxResponses > 10) {
    warnings.push('Allowing many responses per player may reduce quality');
  }
  if (!settings.topic && !settings.answerSeconds) {
    warnings.push('Consider setting a topic or using a topic library');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Score a topic round
 * Points based on upvotes received
 */
function scoreRound(input: ScoreRoundInput): ScoreRoundResult {
  const { responses } = input;
  const scoreEvents: ScoreRoundResult['scoreEvents'] = [];
  const updatedScoreboard: Record<string, number> = {};

  // Score based on upvotes (stored in derivedState or response metadata)
  responses.forEach(response => {
    const upvoteCount = (response as any).upvoteCount ?? 0;
    
    if (upvoteCount > 0) {
      // 10 points per upvote
      const points = upvoteCount * 10;
      
      scoreEvents.push({
        socialeId: response.socialeId,
        roundId: response.roundId,
        socialiteId: response.socialiteId,
        reason: 'upvotes_received',
        points,
        metadata: { upvoteCount },
      });

      updatedScoreboard[response.socialiteId] = 
        (updatedScoreboard[response.socialiteId] ?? 0) + points;
    }
  });

  // Bonus for top response
  if (responses.length > 0) {
    const topResponse = responses.reduce((top, r) => {
      const topUpvotes = (top as any).upvoteCount ?? 0;
      const rUpvotes = (r as any).upvoteCount ?? 0;
      return rUpvotes > topUpvotes ? r : top;
    }, responses[0]);

    const topUpvotes = (topResponse as any).upvoteCount ?? 0;
    if (topUpvotes > 0) {
      scoreEvents.push({
        socialeId: topResponse.socialeId,
        roundId: topResponse.roundId,
        socialiteId: topResponse.socialiteId,
        reason: 'top_response_bonus',
        points: 50,
        metadata: { upvoteCount: topUpvotes },
      });

      updatedScoreboard[topResponse.socialiteId] = 
        (updatedScoreboard[topResponse.socialiteId] ?? 0) + 50;
    }
  }

  return { scoreEvents, updatedScoreboard };
}

/**
 * Build analytics for a topic round
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

  // Total upvotes
  const totalUpvotes = responses.reduce((sum, r) => sum + ((r as any).upvoteCount ?? 0), 0);
  analytics.push({
    socialeId: roundState.socialeId,
    roundId: roundState.roundId,
    category: 'engagement',
    metric: 'total_upvotes',
    value: totalUpvotes,
  });

  // Average upvotes per response
  const avgUpvotes = responses.length > 0 ? totalUpvotes / responses.length : 0;
  analytics.push({
    socialeId: roundState.socialeId,
    roundId: roundState.roundId,
    category: 'engagement',
    metric: 'avg_upvotes_per_response',
    value: Math.round(avgUpvotes * 100) / 100,
  });

  return analytics;
}

/**
 * Check if phase can auto-advance
 */
function canAutoAdvancePhase(phase: string, _roundState: SocialeRoundState): boolean {
  return TOPIC_PHASES.includes(phase);
}

/**
 * Topic round type definition
 */
export const topicRoundDefinition: SocialeRoundTypeDefinition = {
  type: 'topic',
  label: 'Topic',
  description: 'Share thoughts on a topic, upvote favorites',
  emoji: '💭',
  
  defaultPhases: TOPIC_PHASES,
  defaultPhaseTiming: TOPIC_PHASE_TIMING,
  
  settingsSchema: [
    {
      name: 'topic',
      type: 'text',
      label: 'Topic',
      description: 'The topic or question for discussion',
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
      label: 'Active Time (seconds)',
      description: 'Time for submissions and upvoting',
      defaultValue: 300,
      min: 30,
      max: 900,
    },
    {
      name: 'resultsSeconds',
      type: 'number',
      label: 'Results Time (seconds)',
      defaultValue: 30,
      min: 10,
      max: 120,
    },
    {
      name: 'sortBy',
      type: 'select',
      label: 'Sort Responses By',
      defaultValue: 'upvotes',
      options: [
        { value: 'upvotes', label: 'Most Upvotes' },
        { value: 'newest', label: 'Newest First' },
      ],
    },
    {
      name: 'allowUpvotes',
      type: 'boolean',
      label: 'Allow Upvotes',
      defaultValue: true,
    },
    {
      name: 'maxResponses',
      type: 'number',
      label: 'Max Responses Per Player',
      defaultValue: 3,
      min: 1,
      max: 10,
    },
  ],
  
  createInitialSettings,
  validateSettings: validateSettings as SocialeRoundTypeDefinition['validateSettings'],
  scoreRound,
  buildAnalytics,
  canAutoAdvancePhase,
};

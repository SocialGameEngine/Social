// =============================================================================
// THE MOLE ROUND TYPE DEFINITION
// =============================================================================
// Spy-themed round where players submit one-word answers simultaneously.
// Extended voting phase where players try to identify who gave suspicious answers.
// Scoring based on avoiding detection and correctly identifying the "mole".

import type { 
  MoleRoundSettings,
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
 * Default phase sequence for mole rounds
 * Submit → Review → Vote → Reveal → Results
 */
const MOLE_PHASES = ['submit', 'review', 'vote', 'reveal', 'results'];

/**
 * Default timing for mole phases (in seconds)
 */
const MOLE_PHASE_TIMING: Record<string, number> = {
  submit: 30,    // Time to submit one-word answer
  review: 20,    // Review all submissions
  vote: 45,      // Extended voting to identify suspicious answers
  reveal: 15,    // Show who voted for whom
  results: 12,   // Show scoreboard
};

/**
 * Create initial settings for a mole round
 */
function createInitialSettings(): MoleRoundSettings {
  return {
    submissionSeconds: 30,
    reviewSeconds: 20,
    votingSeconds: 45,
    revealSeconds: 15,
    resultsSeconds: 12,
    prompt: '',
    maxWordCount: 1,
  };
}

/**
 * Validate mole round settings
 */
function validateSettings(settings: MoleRoundSettings): RoundSettingsValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!settings.prompt || settings.prompt.trim() === '') {
    errors.push('Prompt is required for mole rounds');
  }

  if (settings.submissionSeconds && settings.submissionSeconds < 15) {
    errors.push('Submission time must be at least 15 seconds');
  }

  if (settings.votingSeconds && settings.votingSeconds < 30) {
    warnings.push('Voting time under 30 seconds may not give players enough time to analyze submissions');
  }

  if (settings.maxWordCount && settings.maxWordCount > 3) {
    warnings.push('Word count over 3 may reduce the spy-theme tension');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Score a mole round
 * Points for avoiding votes (staying hidden) and correctly identifying suspicious players
 */
function scoreRound(input: ScoreRoundInput): ScoreRoundResult {
  const { responses, settings } = input;
  const scoreEvents: ScoreRoundResult['scoreEvents'] = [];
  const updatedScoreboard: Record<string, number> = {};

  // Count votes received per player
  const votesReceived = new Map<string, number>();
  responses.forEach(response => {
    votesReceived.set(response.socialiteId, 0);
  });

  // In real implementation, votes would come from roundState.derivedState
  const votes = (input as any).votes || [];
  votes.forEach((vote: any) => {
    const currentVotes = votesReceived.get(vote.targetSocialiteId) || 0;
    votesReceived.set(vote.targetSocialiteId, currentVotes + 1);
  });

  // Find the most-voted player (the "mole")
  let maxVotes = 0;
  let moleId = '';
  votesReceived.forEach((count, socialiteId) => {
    if (count > maxVotes) {
      maxVotes = count;
      moleId = socialiteId;
    }
  });

  // Score players based on votes received (fewer is better)
  responses.forEach(response => {
    const votesAgainst = votesReceived.get(response.socialiteId) || 0;
    
    if (votesAgainst === 0) {
      // Perfect stealth - no votes received
      const points = 100;
      scoreEvents.push({
        socialeId: response.socialeId,
        roundId: response.roundId,
        socialiteId: response.socialiteId,
        reason: 'perfect_stealth',
        points,
        metadata: { votesReceived: 0 },
      });
      updatedScoreboard[response.socialiteId] = 
        (updatedScoreboard[response.socialiteId] ?? 0) + points;
    } else if (response.socialiteId !== moleId) {
      // Received some votes but not the most
      const points = Math.max(0, 50 - (votesAgainst * 10));
      if (points > 0) {
        scoreEvents.push({
          socialeId: response.socialeId,
          roundId: response.roundId,
          socialiteId: response.socialiteId,
          reason: 'partial_stealth',
          points,
          metadata: { votesReceived: votesAgainst },
        });
        updatedScoreboard[response.socialiteId] = 
          (updatedScoreboard[response.socialiteId] ?? 0) + points;
      }
    }
    // The "mole" (most voted) gets 0 points
  });

  // Award points to players who voted for the mole
  votes.forEach((vote: any) => {
    if (vote.targetSocialiteId === moleId) {
      const points = 50;
      scoreEvents.push({
        socialeId: responses[0]?.socialeId || '',
        roundId: responses[0]?.roundId || '',
        socialiteId: vote.voterId,
        reason: 'identified_mole',
        points,
        metadata: { identifiedMole: true },
      });
      updatedScoreboard[vote.voterId] = 
        (updatedScoreboard[vote.voterId] ?? 0) + points;
    }
  });

  return { scoreEvents, updatedScoreboard };
}

/**
 * Build analytics for a mole round
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

  // Vote distribution (how spread out were the votes)
  const votes = (input as any).votes || [];
  const uniqueTargets = new Set(votes.map((v: any) => v.targetSocialiteId));
  
  analytics.push({
    socialeId: roundState.socialeId,
    roundId: roundState.roundId,
    category: 'voting',
    metric: 'vote_spread',
    value: uniqueTargets.size,
  });

  // Consensus strength (what % voted for the top target)
  if (votes.length > 0) {
    const voteCounts = new Map<string, number>();
    votes.forEach((v: any) => {
      voteCounts.set(v.targetSocialiteId, (voteCounts.get(v.targetSocialiteId) || 0) + 1);
    });
    const maxVotes = Math.max(...Array.from(voteCounts.values()));
    const consensusRate = maxVotes / votes.length;
    
    analytics.push({
      socialeId: roundState.socialeId,
      roundId: roundState.roundId,
      category: 'voting',
      metric: 'consensus_strength',
      value: Math.round(consensusRate * 100) / 100,
    });
  }

  return analytics;
}

/**
 * Check if phase can auto-advance
 */
function canAutoAdvancePhase(phase: string, roundState: SocialeRoundState): boolean {
  // All mole phases can auto-advance when timer expires
  return ['submit', 'review', 'vote', 'reveal', 'results'].includes(phase);
}

/**
 * The Mole round type definition
 */
export const moleRoundDefinition: SocialeRoundTypeDefinition = {
  type: 'mole',
  label: 'The Mole',
  description: 'Submit one-word answers, then vote to identify suspicious players',
  emoji: '🕵️',
  
  defaultPhases: MOLE_PHASES,
  defaultPhaseTiming: MOLE_PHASE_TIMING,
  
  settingsSchema: [
    {
      name: 'prompt',
      type: 'text',
      label: 'Prompt',
      description: 'The question players will answer (e.g., "Name a fruit")',
      required: true,
    },
    {
      name: 'submissionSeconds',
      type: 'number',
      label: 'Submission Time (seconds)',
      defaultValue: 30,
      min: 15,
      max: 90,
    },
    {
      name: 'reviewSeconds',
      type: 'number',
      label: 'Review Time (seconds)',
      defaultValue: 20,
      min: 10,
      max: 60,
    },
    {
      name: 'votingSeconds',
      type: 'number',
      label: 'Voting Time (seconds)',
      defaultValue: 45,
      min: 30,
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
      name: 'maxWordCount',
      type: 'number',
      label: 'Max Word Count',
      defaultValue: 1,
      min: 1,
      max: 5,
    },
  ],
  
  createInitialSettings,
  validateSettings: validateSettings as SocialeRoundTypeDefinition['validateSettings'],
  scoreRound,
  buildAnalytics,
  canAutoAdvancePhase,
};

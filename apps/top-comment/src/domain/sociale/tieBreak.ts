// =============================================================================
// TIE-BREAK / SUDDEN DEATH LOGIC
// =============================================================================
// Handles tie-break detection, participant selection, and sudden death rounds
// with accelerated timing and double points.

export interface TieBreakConfig {
  enabled: boolean;
  minPlayers: number; // Minimum players to trigger tie-break
  maxPlayers: number; // Maximum players in tie-break
  pointThreshold: number; // Max point difference to be considered tied
  timerMultiplier: number; // Speed multiplier (0.5 = half time)
  pointsMultiplier: number; // Points multiplier (2.0 = double points)
}

export interface TieBreakState {
  isTieBreak: boolean;
  roundNumber: number;
  participants: string[]; // socialite IDs
  originalScores: Record<string, number>;
}

export const DEFAULT_TIE_BREAK_CONFIG: TieBreakConfig = {
  enabled: true,
  minPlayers: 2,
  maxPlayers: 5,
  pointThreshold: 50,
  timerMultiplier: 0.5, // 10s instead of 20s
  pointsMultiplier: 2.0, // Double points
};

/**
 * Detect if a tie-break is needed based on final scores
 */
export function detectTieBreak(
  scoreboard: Record<string, number>,
  config: TieBreakConfig = DEFAULT_TIE_BREAK_CONFIG
): { needed: boolean; participants: string[] } {
  if (!config.enabled) {
    return { needed: false, participants: [] };
  }

  // Sort players by score (descending)
  const sortedPlayers = Object.entries(scoreboard)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => id);

  if (sortedPlayers.length < config.minPlayers) {
    return { needed: false, participants: [] };
  }

  // Get top score
  const topScore = scoreboard[sortedPlayers[0]];

  // Find all players within threshold of top score
  const tiedPlayers = sortedPlayers.filter(
    playerId => topScore - scoreboard[playerId] <= config.pointThreshold
  );

  // Need at least 2 players tied
  if (tiedPlayers.length < config.minPlayers) {
    return { needed: false, participants: [] };
  }

  // Cap at max players
  const participants = tiedPlayers.slice(0, config.maxPlayers);

  return {
    needed: true,
    participants,
  };
}

/**
 * Calculate adjusted timing for tie-break rounds
 */
export function getTieBreakTiming(
  originalSeconds: number,
  config: TieBreakConfig = DEFAULT_TIE_BREAK_CONFIG
): number {
  return Math.max(
    5, // Minimum 5 seconds
    Math.round(originalSeconds * config.timerMultiplier)
  );
}

/**
 * Calculate adjusted points for tie-break rounds
 */
export function getTieBreakPoints(
  originalPoints: number,
  config: TieBreakConfig = DEFAULT_TIE_BREAK_CONFIG
): number {
  return Math.round(originalPoints * config.pointsMultiplier);
}

/**
 * Filter scoreboard to only include tie-break participants
 */
export function filterTieBreakScoreboard(
  fullScoreboard: Record<string, number>,
  participants: string[]
): Record<string, number> {
  const filtered: Record<string, number> = {};
  participants.forEach(id => {
    if (fullScoreboard[id] !== undefined) {
      filtered[id] = fullScoreboard[id];
    }
  });
  return filtered;
}

/**
 * Determine tie-break winner
 * Returns null if still tied, otherwise returns winner ID
 */
export function determineTieBreakWinner(
  scoreboard: Record<string, number>,
  participants: string[]
): string | null {
  const participantScores = participants
    .map(id => ({ id, score: scoreboard[id] || 0 }))
    .sort((a, b) => b.score - a.score);

  if (participantScores.length === 0) return null;

  const topScore = participantScores[0].score;
  const tiedAtTop = participantScores.filter(p => p.score === topScore);

  // If still tied, return null (need another tie-break round)
  if (tiedAtTop.length > 1) {
    return null;
  }

  return participantScores[0].id;
}

/**
 * Generate tie-break announcement text
 */
export function generateTieBreakAnnouncement(
  participants: string[],
  roundNumber: number,
  displayNames: Record<string, string>
): string {
  const names = participants.map(id => displayNames[id] || 'Unknown').join(', ');
  
  if (roundNumber === 1) {
    return `🔥 TIE-BREAK! ${names} are tied! Sudden death round - 10 seconds, double points!`;
  } else {
    return `⚡ STILL TIED! Round ${roundNumber} - Winner takes all!`;
  }
}

/**
 * Create tie-break state
 */
export function createTieBreakState(
  participants: string[],
  currentScoreboard: Record<string, number>
): TieBreakState {
  return {
    isTieBreak: true,
    roundNumber: 1,
    participants,
    originalScores: { ...currentScoreboard },
  };
}

/**
 * Advance tie-break to next round
 */
export function advanceTieBreak(state: TieBreakState): TieBreakState {
  return {
    ...state,
    roundNumber: state.roundNumber + 1,
  };
}

/**
 * Check if a socialite is participating in tie-break
 */
export function isInTieBreak(
  socialiteId: string,
  tieBreakState: TieBreakState | null
): boolean {
  if (!tieBreakState || !tieBreakState.isTieBreak) {
    return false;
  }
  return tieBreakState.participants.includes(socialiteId);
}

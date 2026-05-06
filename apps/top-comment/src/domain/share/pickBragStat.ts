// =============================================================================
// BRAG STAT SELECTION LOGIC
// =============================================================================
// Pure function that analyzes session stats and picks the most impressive
// achievement to highlight on share cards. Prioritizes rare/exceptional stats.

export interface SessionStats {
  totalScore: number;
  roundsPlayed: number;
  correctAnswers: number;
  totalAnswers: number;
  longestStreak: number;
  currentStreak: number;
  rankPosition: number;
  previousRank?: number;
  totalPlayers: number;
  bestCategory?: string;
  categoryAccuracy?: number;
  fastestAnswerMs?: number;
  votesReceived: number;
  perfectRounds: number;
}

export interface BragStat {
  type: 
    | 'rank_jump'
    | 'perfect_streak'
    | 'accuracy_king'
    | 'speed_demon'
    | 'vote_magnet'
    | 'category_master'
    | 'comeback_kid'
    | 'consistency'
    | 'participation';
  headline: string;
  subtext: string;
  emoji: string;
  priority: number;
}

/**
 * Pick the most impressive brag stat from session statistics
 * Higher priority = more impressive/rare achievement
 */
export function pickBragStat(stats: SessionStats): BragStat {
  const candidates: BragStat[] = [];

  // Calculate derived metrics
  const accuracy = stats.totalAnswers > 0 
    ? stats.correctAnswers / stats.totalAnswers 
    : 0;
  const rankJump = stats.previousRank 
    ? stats.previousRank - stats.rankPosition 
    : 0;
  const avgVotesPerRound = stats.roundsPlayed > 0 
    ? stats.votesReceived / stats.roundsPlayed 
    : 0;

  // RANK JUMP (highest priority if significant)
  if (rankJump >= 5) {
    candidates.push({
      type: 'rank_jump',
      headline: `Jumped ${rankJump} places!`,
      subtext: `From #${stats.previousRank} to #${stats.rankPosition}`,
      emoji: '🚀',
      priority: 100,
    });
  } else if (rankJump >= 3) {
    candidates.push({
      type: 'rank_jump',
      headline: `Climbed ${rankJump} spots`,
      subtext: `Now ranked #${stats.rankPosition}`,
      emoji: '📈',
      priority: 85,
    });
  }

  // PERFECT STREAK (very rare)
  if (stats.longestStreak >= 5 && stats.longestStreak === stats.roundsPlayed) {
    candidates.push({
      type: 'perfect_streak',
      headline: 'Perfect streak!',
      subtext: `${stats.longestStreak} rounds, zero mistakes`,
      emoji: '💯',
      priority: 95,
    });
  } else if (stats.longestStreak >= 5) {
    candidates.push({
      type: 'perfect_streak',
      headline: `${stats.longestStreak}-round streak`,
      subtext: 'Unstoppable run',
      emoji: '🔥',
      priority: 80,
    });
  }

  // ACCURACY KING (exceptional accuracy)
  if (accuracy >= 0.9 && stats.roundsPlayed >= 5) {
    candidates.push({
      type: 'accuracy_king',
      headline: `${Math.round(accuracy * 100)}% accuracy`,
      subtext: `${stats.correctAnswers}/${stats.totalAnswers} correct`,
      emoji: '🎯',
      priority: 90,
    });
  } else if (accuracy >= 0.75 && stats.roundsPlayed >= 5) {
    candidates.push({
      type: 'accuracy_king',
      headline: `${Math.round(accuracy * 100)}% accurate`,
      subtext: 'Sharp performance',
      emoji: '✨',
      priority: 70,
    });
  }

  // SPEED DEMON (very fast answers)
  if (stats.fastestAnswerMs && stats.fastestAnswerMs < 3000) {
    const seconds = (stats.fastestAnswerMs / 1000).toFixed(1);
    candidates.push({
      type: 'speed_demon',
      headline: `${seconds}s fastest answer`,
      subtext: 'Lightning reflexes',
      emoji: '⚡',
      priority: 75,
    });
  }

  // VOTE MAGNET (high votes per round)
  if (avgVotesPerRound >= 3) {
    candidates.push({
      type: 'vote_magnet',
      headline: `${stats.votesReceived} votes received`,
      subtext: 'Crowd favorite',
      emoji: '⭐',
      priority: 78,
    });
  }

  // CATEGORY MASTER (dominant in specific category)
  if (stats.bestCategory && stats.categoryAccuracy && stats.categoryAccuracy >= 0.85) {
    candidates.push({
      type: 'category_master',
      headline: `${stats.bestCategory} expert`,
      subtext: `${Math.round(stats.categoryAccuracy * 100)}% in category`,
      emoji: '👑',
      priority: 82,
    });
  }

  // COMEBACK KID (improved from bad start)
  if (rankJump >= 2 && stats.rankPosition <= stats.totalPlayers / 2) {
    candidates.push({
      type: 'comeback_kid',
      headline: 'Epic comeback',
      subtext: `Fought back to #${stats.rankPosition}`,
      emoji: '💪',
      priority: 77,
    });
  }

  // CONSISTENCY (perfect rounds)
  if (stats.perfectRounds >= 3) {
    candidates.push({
      type: 'consistency',
      headline: `${stats.perfectRounds} perfect rounds`,
      subtext: 'Consistent excellence',
      emoji: '🏆',
      priority: 72,
    });
  }

  // PARTICIPATION (fallback - always available)
  if (stats.rankPosition === 1) {
    candidates.push({
      type: 'participation',
      headline: 'Champion!',
      subtext: `#1 of ${stats.totalPlayers} players`,
      emoji: '👑',
      priority: 88,
    });
  } else if (stats.rankPosition <= 3) {
    candidates.push({
      type: 'participation',
      headline: `Podium finish!`,
      subtext: `#${stats.rankPosition} of ${stats.totalPlayers}`,
      emoji: '🥇',
      priority: 65,
    });
  } else {
    candidates.push({
      type: 'participation',
      headline: `Played ${stats.roundsPlayed} rounds`,
      subtext: `Ranked #${stats.rankPosition} of ${stats.totalPlayers}`,
      emoji: '🎮',
      priority: 50,
    });
  }

  // Sort by priority (highest first) and return the best
  candidates.sort((a, b) => b.priority - a.priority);
  return candidates[0];
}

/**
 * Generate a shareable text summary
 */
export function generateShareText(stats: SessionStats, bragStat: BragStat): string {
  const lines = [
    `${bragStat.emoji} ${bragStat.headline}`,
    bragStat.subtext,
    '',
    `Score: ${stats.totalScore.toLocaleString()}`,
    `Rank: #${stats.rankPosition} of ${stats.totalPlayers}`,
  ];

  if (stats.longestStreak > 0) {
    lines.push(`Streak: ${stats.longestStreak}`);
  }

  return lines.join('\n');
}

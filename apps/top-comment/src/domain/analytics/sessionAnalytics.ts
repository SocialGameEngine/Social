// =============================================================================
// SESSION ANALYTICS & CSV EXPORT
// =============================================================================
// Post-session analytics aggregation and CSV export for hosts.

export interface SessionAnalytics {
  // Session metadata
  sessionId: string;
  venueName?: string;
  startedAt: Date;
  endedAt: Date;
  duration: number; // milliseconds
  
  // Player stats
  totalPlayers: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  
  // Round stats
  totalRounds: number;
  roundTypes: Record<string, number>; // count by type
  averageRoundDuration: number;
  
  // Engagement metrics
  averageParticipationRate: number;
  totalResponses: number;
  totalVotes: number;
  averageResponseTime: number;
  
  // Question difficulty
  questionStats: QuestionStat[];
  
  // Player performance
  playerStats: PlayerStat[];
}

export interface QuestionStat {
  roundIndex: number;
  roundType: string;
  prompt: string;
  correctAnswer?: string;
  submissionsCount: number;
  correctCount: number;
  accuracyRate: number;
  averageResponseTime: number;
  difficultyFlag: 'too_easy' | 'too_hard' | 'good';
}

export interface PlayerStat {
  socialiteId: string;
  displayName: string;
  membershipId?: string;
  
  // Scoring
  totalScore: number;
  rank: number;
  
  // Performance
  roundsPlayed: number;
  correctAnswers: number;
  totalAnswers: number;
  accuracyRate: number;
  
  // Engagement
  averageResponseTime: number;
  fastestAnswer: number;
  slowestAnswer: number;
  
  // Social
  votesReceived: number;
  votesGiven: number;
  
  // Streaks
  longestStreak: number;
  perfectRounds: number;
}

/**
 * Calculate difficulty flag based on accuracy
 */
export function calculateDifficultyFlag(accuracyRate: number): 'too_easy' | 'too_hard' | 'good' {
  if (accuracyRate >= 0.9) return 'too_easy';
  if (accuracyRate <= 0.3) return 'too_hard';
  return 'good';
}

/**
 * Generate CSV from session analytics
 */
export function generateSessionCSV(analytics: SessionAnalytics): string {
  const lines: string[] = [];
  
  // Header section
  lines.push('SESSION ANALYTICS');
  lines.push('');
  lines.push(`Session ID,${analytics.sessionId}`);
  lines.push(`Venue,${analytics.venueName || 'N/A'}`);
  lines.push(`Started,${analytics.startedAt.toISOString()}`);
  lines.push(`Ended,${analytics.endedAt.toISOString()}`);
  lines.push(`Duration (minutes),${Math.round(analytics.duration / 60000)}`);
  lines.push('');
  
  // Summary stats
  lines.push('SUMMARY STATISTICS');
  lines.push('');
  lines.push(`Total Players,${analytics.totalPlayers}`);
  lines.push(`Total Rounds,${analytics.totalRounds}`);
  lines.push(`Average Score,${Math.round(analytics.averageScore)}`);
  lines.push(`Highest Score,${analytics.highestScore}`);
  lines.push(`Lowest Score,${analytics.lowestScore}`);
  lines.push(`Participation Rate,${(analytics.averageParticipationRate * 100).toFixed(1)}%`);
  lines.push('');
  
  // Round type breakdown
  lines.push('ROUND TYPES');
  lines.push('');
  lines.push('Type,Count');
  Object.entries(analytics.roundTypes).forEach(([type, count]) => {
    lines.push(`${type},${count}`);
  });
  lines.push('');
  
  // Question stats
  lines.push('QUESTION STATISTICS');
  lines.push('');
  lines.push('Round,Type,Prompt,Submissions,Correct,Accuracy %,Avg Time (s),Difficulty');
  analytics.questionStats.forEach(q => {
    const prompt = q.prompt.replace(/,/g, ';').substring(0, 50); // Escape commas, truncate
    lines.push([
      q.roundIndex + 1,
      q.roundType,
      `"${prompt}"`,
      q.submissionsCount,
      q.correctCount,
      (q.accuracyRate * 100).toFixed(1),
      (q.averageResponseTime / 1000).toFixed(1),
      q.difficultyFlag,
    ].join(','));
  });
  lines.push('');
  
  // Player stats
  lines.push('PLAYER STATISTICS');
  lines.push('');
  lines.push('Rank,Player,Score,Rounds,Correct,Total,Accuracy %,Avg Time (s),Votes Received,Longest Streak');
  analytics.playerStats.forEach(p => {
    lines.push([
      p.rank,
      `"${p.displayName}"`,
      p.totalScore,
      p.roundsPlayed,
      p.correctAnswers,
      p.totalAnswers,
      (p.accuracyRate * 100).toFixed(1),
      (p.averageResponseTime / 1000).toFixed(1),
      p.votesReceived,
      p.longestStreak,
    ].join(','));
  });
  
  return lines.join('\n');
}

/**
 * Generate player-specific CSV
 */
export function generatePlayerCSV(playerStat: PlayerStat): string {
  const lines: string[] = [];
  
  lines.push('PLAYER PERFORMANCE REPORT');
  lines.push('');
  lines.push(`Player,${playerStat.displayName}`);
  lines.push(`Rank,${playerStat.rank}`);
  lines.push(`Total Score,${playerStat.totalScore}`);
  lines.push('');
  
  lines.push('PERFORMANCE METRICS');
  lines.push('');
  lines.push(`Rounds Played,${playerStat.roundsPlayed}`);
  lines.push(`Correct Answers,${playerStat.correctAnswers}`);
  lines.push(`Total Answers,${playerStat.totalAnswers}`);
  lines.push(`Accuracy Rate,${(playerStat.accuracyRate * 100).toFixed(1)}%`);
  lines.push('');
  
  lines.push('SPEED METRICS');
  lines.push('');
  lines.push(`Average Response Time,${(playerStat.averageResponseTime / 1000).toFixed(1)}s`);
  lines.push(`Fastest Answer,${(playerStat.fastestAnswer / 1000).toFixed(1)}s`);
  lines.push(`Slowest Answer,${(playerStat.slowestAnswer / 1000).toFixed(1)}s`);
  lines.push('');
  
  lines.push('SOCIAL METRICS');
  lines.push('');
  lines.push(`Votes Received,${playerStat.votesReceived}`);
  lines.push(`Votes Given,${playerStat.votesGiven}`);
  lines.push('');
  
  lines.push('ACHIEVEMENTS');
  lines.push('');
  lines.push(`Longest Streak,${playerStat.longestStreak}`);
  lines.push(`Perfect Rounds,${playerStat.perfectRounds}`);
  
  return lines.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generate filename for session export
 */
export function generateSessionFilename(venueName?: string, date?: Date): string {
  const timestamp = (date || new Date()).toISOString().split('T')[0];
  const venue = venueName ? venueName.replace(/[^a-z0-9]/gi, '_') : 'session';
  return `${venue}_${timestamp}_analytics.csv`;
}

/**
 * Calculate session summary statistics
 */
export function calculateSummaryStats(playerStats: PlayerStat[]): {
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  averageAccuracy: number;
  averageResponseTime: number;
} {
  if (playerStats.length === 0) {
    return {
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      averageAccuracy: 0,
      averageResponseTime: 0,
    };
  }

  const scores = playerStats.map(p => p.totalScore);
  const accuracies = playerStats.map(p => p.accuracyRate);
  const responseTimes = playerStats.map(p => p.averageResponseTime);

  return {
    averageScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
    averageAccuracy: accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length,
    averageResponseTime: responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length,
  };
}

/**
 * Identify top performers
 */
export function identifyTopPerformers(playerStats: PlayerStat[]): {
  topScorer: PlayerStat | null;
  mostAccurate: PlayerStat | null;
  fastest: PlayerStat | null;
  mostVoted: PlayerStat | null;
} {
  if (playerStats.length === 0) {
    return {
      topScorer: null,
      mostAccurate: null,
      fastest: null,
      mostVoted: null,
    };
  }

  return {
    topScorer: playerStats.reduce((top, p) => p.totalScore > top.totalScore ? p : top),
    mostAccurate: playerStats.reduce((top, p) => p.accuracyRate > top.accuracyRate ? p : top),
    fastest: playerStats.reduce((top, p) => p.averageResponseTime < top.averageResponseTime ? p : top),
    mostVoted: playerStats.reduce((top, p) => p.votesReceived > top.votesReceived ? p : top),
  };
}

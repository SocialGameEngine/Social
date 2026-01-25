import type { Team, LeaderboardEntry } from '../types/domain.types';

/**
 * Pure service for leaderboard calculations
 * Contains no React dependencies and no side effects
 */
export class LeaderboardCalculator {
  /**
   * Generate a leaderboard with ranks from teams array
   * Teams are sorted by score (descending), ties get same rank
   * @param teams - Array of teams to calculate leaderboard for
   * @returns Array of LeaderboardEntry objects with ranks
   */
  static calculate(teams: Team[]): LeaderboardEntry[] {
    if (teams.length === 0) {
      return [];
    }

    // Sort teams by score (descending)
    const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
    
    // Calculate ranks with ties handled correctly
    const leaderboard: LeaderboardEntry[] = [];
    let currentRank = 1;
    let previousScore = sortedTeams[0].score;
    let teamsAtCurrentScore = 1;

    for (let i = 0; i < sortedTeams.length; i++) {
      const team = sortedTeams[i];
      
      // If score changed, update rank
      if (i > 0 && team.score < previousScore) {
        currentRank = teamsAtCurrentScore + 1;
        teamsAtCurrentScore = currentRank;
      } else if (i > 0 && team.score === previousScore) {
        // Same score, same rank
        teamsAtCurrentScore++;
      } else {
        teamsAtCurrentScore = currentRank;
      }
      
      previousScore = team.score;
      
      leaderboard.push({
        teamId: team.id,
        teamName: team.teamName,
        score: team.score,
        rank: currentRank,
        mascotId: team.mascotId
      });
    }

    return leaderboard;
  }

  /**
   * Find the rank of a specific team in the leaderboard
   * @param teamId - ID of the team to find
   * @param leaderboard - Leaderboard array to search in
   * @returns Rank of the team, or null if team not found
   */
  static findTeamRank(teamId: string, leaderboard: LeaderboardEntry[]): number | null {
    const entry = leaderboard.find(entry => entry.teamId === teamId);
    return entry?.rank ?? null;
  }

  /**
   * Get the top N teams from the leaderboard
   * @param leaderboard - Leaderboard array
   * @param n - Number of top teams to return
   * @returns Array of top N leaderboard entries
   */
  static getTopN(leaderboard: LeaderboardEntry[], n: number): LeaderboardEntry[] {
    return leaderboard.slice(0, n);
  }

  /**
   * Get teams within a specific rank range
   * @param leaderboard - Leaderboard array
   * @param startRank - Starting rank (inclusive)
   * @param endRank - Ending rank (inclusive)
   * @returns Array of leaderboard entries within the range
   */
  static getTeamsInRange(leaderboard: LeaderboardEntry[], startRank: number, endRank: number): LeaderboardEntry[] {
    return leaderboard.filter(entry => entry.rank >= startRank && entry.rank <= endRank);
  }

  /**
   * Get all teams tied at a specific rank
   * @param leaderboard - Leaderboard array
   * @param rank - Rank to find ties for
   * @returns Array of teams at the specified rank
   */
  static getTeamsAtRank(leaderboard: LeaderboardEntry[], rank: number): LeaderboardEntry[] {
    return leaderboard.filter(entry => entry.rank === rank);
  }

  /**
   * Get the score difference between adjacent ranks
   * @param leaderboard - Leaderboard array
   * @returns Array of score differences between consecutive ranks
   */
  static getScoreGaps(leaderboard: LeaderboardEntry[]): number[] {
    const gaps: number[] = [];
    for (let i = 1; i < leaderboard.length; i++) {
      const current = leaderboard[i];
      const previous = leaderboard[i - 1];
      
      // Only calculate gap if rank actually changed (not a tie)
      if (current.rank > previous.rank) {
        gaps.push(previous.score - current.score);
      }
    }
    return gaps;
  }

  /**
   * Check if a team is in the top N positions
   * @param teamId - ID of the team to check
   * @param leaderboard - Leaderboard array
   * @param n - Top N positions to check against
   * @returns Whether the team is in top N
   */
  static isTeamInTopN(teamId: string, leaderboard: LeaderboardEntry[], n: number): boolean {
    const rank = this.findTeamRank(teamId, leaderboard);
    return rank !== null && rank <= n;
  }

  /**
   * Get the number of teams tied at each rank
   * @param leaderboard - Leaderboard array
   * @returns Map of rank to number of teams at that rank
   */
  static getTieCounts(leaderboard: LeaderboardEntry[]): Map<number, number> {
    const tieCounts = new Map<number, number>();
    
    leaderboard.forEach(entry => {
      const currentCount = tieCounts.get(entry.rank) ?? 0;
      tieCounts.set(entry.rank, currentCount + 1);
    });
    
    return tieCounts;
  }

  /**
   * Calculate the maximum possible rank a team could achieve
   * based on current scores and potential points
   * @param teamId - ID of the team
   * @param teams - All teams array
   * @param potentialPoints - Maximum points the team could still earn
   * @returns Best possible rank for the team
   */
  static calculateBestPossibleRank(teamId: string, teams: Team[], potentialPoints: number): number {
    const targetTeam = teams.find(t => t.id === teamId);
    if (!targetTeam) return teams.length + 1;
    
    const targetFinalScore = targetTeam.score + potentialPoints;
    
    // Count teams that would still beat this team even with max points
    const teamsThatWouldBeat = teams.filter(team => 
      team.id !== teamId && team.score > targetFinalScore
    ).length;
    
    return teamsThatWouldBeat + 1;
  }

  /**
   * Validate leaderboard consistency
   * @param leaderboard - Leaderboard array to validate
   * @returns Whether the leaderboard is valid
   */
  static validateLeaderboard(leaderboard: LeaderboardEntry[]): boolean {
    if (leaderboard.length === 0) return true;
    
    // Check that scores are in descending order (allowing ties)
    for (let i = 1; i < leaderboard.length; i++) {
      const current = leaderboard[i];
      const previous = leaderboard[i - 1];
      
      // Score should never increase
      if (current.score > previous.score) {
        return false;
      }
      
      // If score decreased, rank should increase
      if (current.score < previous.score && current.rank <= previous.rank) {
        return false;
      }
    }
    
    return true;
  }
}

import type { LeaderboardEntry } from '../types/domain.types';
import type { RoomMembership } from '../types/room.types';

/**
 * Pure service for leaderboard calculations
 * Contains no React dependencies and no side effects
 */
export class LeaderboardCalculator {
  /**
   * Generate a leaderboard with ranks from memberships array
   * Memberships are sorted by score (descending), ties get same rank
   * @param memberships - Array of memberships to calculate leaderboard for
   * @param scores - Optional map of membershipId to score
   * @returns Array of LeaderboardEntry objects with ranks
   */
  static calculate(memberships: RoomMembership[], scores?: Map<string, number>): LeaderboardEntry[] {
    if (memberships.length === 0) {
      return [];
    }

    // Create entries with scores
    const entries = memberships.map(membership => ({
      membership,
      score: scores?.get(membership.id) || 0
    }));

    // Sort by score (descending)
    const sortedEntries = [...entries].sort((a, b) => b.score - a.score);
    
    // Calculate ranks with ties handled correctly
    const leaderboard: LeaderboardEntry[] = [];
    let currentRank = 1;
    let previousScore = sortedEntries[0].score;
    let entriesAtCurrentScore = 1;

    for (let i = 0; i < sortedEntries.length; i++) {
      const entry = sortedEntries[i];
      
      if (entry.score < previousScore) {
        currentRank += entriesAtCurrentScore;
        entriesAtCurrentScore = 1;
        previousScore = entry.score;
      } else if (entry.score === previousScore) {
        entriesAtCurrentScore++;
      }

      const leaderboardEntry: LeaderboardEntry = {
        membershipId: entry.membership.id,
        playerName: entry.membership.playerName,
        score: entry.score,
        rank: currentRank,
        mascotId: entry.membership.mascotId,
      };

      leaderboard.push(leaderboardEntry);
    }

    return leaderboard;
  }

  /**
   * Find the rank of a specific membership in the leaderboard
   * @param membershipId - ID of the membership to find
   * @param leaderboard - Leaderboard array to search in
   * @returns Rank of the membership, or null if membership not found
   */
  static findMembershipRank(membershipId: string, leaderboard: LeaderboardEntry[]): number | null {
    const entry = leaderboard.find(entry => entry.membershipId === membershipId);
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
   * Check if a membership is in the top N positions
   * @param membershipId - ID of the membership to check
   * @param leaderboard - Leaderboard array
   * @param n - Top N positions to check against
   * @returns Whether the membership is in top N
   */
  static isMembershipInTopN(membershipId: string, leaderboard: LeaderboardEntry[], n: number): boolean {
    const rank = this.findMembershipRank(membershipId, leaderboard);
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

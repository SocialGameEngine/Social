import { describe, it, expect } from 'vitest';
import { LeaderboardCalculator } from '../LeaderboardCalculator';
import type { RoomMembership } from '../../types/room.types';

function makeMembership(id: string, _score: number, name?: string): RoomMembership {
  return {
    id,
    roomId: 'room-1',
    userId: `user-${id}`,
    playerName: name || `Player ${id}`,
    mascotId: undefined,
    joinedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    isBanned: false,
    status: 'active' as const,
  };
}

describe('LeaderboardCalculator', () => {
  describe('calculate', () => {
    it('returns empty array for no memberships', () => {
      expect(LeaderboardCalculator.calculate([])).toEqual([]);
    });

    it('ranks a single membership as rank 1', () => {
      const memberships = [makeMembership('a', 100)];
      const scores = new Map([['a', 100]]);
      const lb = LeaderboardCalculator.calculate(memberships, scores);
      expect(lb[0].rank).toBe(1);
      expect(lb[0].score).toBe(100);
    });

    it('ranks memberships in descending score order', () => {
      const memberships = [makeMembership('a', 50), makeMembership('b', 200), makeMembership('c', 100)];
      const scores = new Map([['a', 50], ['b', 200], ['c', 100]]);
      const lb = LeaderboardCalculator.calculate(memberships, scores);
      expect(lb[0].membershipId).toBe('b');
      expect(lb[0].rank).toBe(1);
      expect(lb[1].membershipId).toBe('c');
      expect(lb[1].rank).toBe(2);
      expect(lb[2].membershipId).toBe('a');
      expect(lb[2].rank).toBe(3);
    });

    it('handles ties with same rank', () => {
      const memberships = [makeMembership('a', 100), makeMembership('b', 100), makeMembership('c', 50)];
      const scores = new Map([['a', 100], ['b', 100], ['c', 50]]);
      const lb = LeaderboardCalculator.calculate(memberships, scores);
      expect(lb[0].rank).toBe(1);
      expect(lb[1].rank).toBe(1);
      expect(lb[2].rank).toBe(3); // skips rank 2
    });

    it('handles all teams tied', () => {
      const teams = [makeMembership('a', 100), makeMembership('b', 100), makeMembership('c', 100)];
      const lb = LeaderboardCalculator.calculate(teams);
      lb.forEach(entry => expect(entry.rank).toBe(1));
    });
  });

  describe('findMembershipRank', () => {
    it('returns rank for existing membership', () => {
      const memberships = [makeMembership('a', 200), makeMembership('b', 100)];
      const scores = new Map([['a', 200], ['b', 100]]);
      const lb = LeaderboardCalculator.calculate(memberships, scores);
      expect(LeaderboardCalculator.findMembershipRank('b', lb)).toBe(2);
    });

    it('returns null for missing membership', () => {
      const memberships = [makeMembership('a', 200)];
      const scores = new Map([['a', 200]]);
      const lb = LeaderboardCalculator.calculate(memberships, scores);
      expect(LeaderboardCalculator.findMembershipRank('b', lb)).toBeNull();
    });
  });

  describe('getTopN', () => {
    it('returns top N entries', () => {
      const memberships = [makeMembership('a', 300), makeMembership('b', 200), makeMembership('c', 100)];
      const scores = new Map([['a', 300], ['b', 200], ['c', 100]]);
      const lb = LeaderboardCalculator.calculate(memberships, scores);
      expect(LeaderboardCalculator.getTopN(lb, 2)).toHaveLength(2);
      expect(LeaderboardCalculator.getTopN(lb, 2)[0].membershipId).toBe('a');
    });

    it('returns all if N > length', () => {
      const memberships = [makeMembership('a', 100)];
      const scores = new Map([['a', 100]]);
      const lb = LeaderboardCalculator.calculate(memberships, scores);
      expect(LeaderboardCalculator.getTopN(lb, 5)).toHaveLength(1);
    });
  });

  describe('getTeamsInRange', () => {
    it('returns memberships within rank range', () => {
      const memberships = [makeMembership('a', 300), makeMembership('b', 200), makeMembership('c', 100), makeMembership('d', 50)];
      const scores = new Map([['a', 300], ['b', 200], ['c', 100], ['d', 50]]);
      const lb = LeaderboardCalculator.calculate(memberships, scores);
      const range = LeaderboardCalculator.getTeamsInRange(lb, 2, 3);
      expect(range).toHaveLength(2);
      expect(range[0].membershipId).toBe('b');
      expect(range[1].membershipId).toBe('c');
    });
  });

  describe('getTeamsAtRank', () => {
    it('returns all memberships tied at a rank', () => {
      const memberships = [makeMembership('a', 100), makeMembership('b', 100), makeMembership('c', 50)];
      const scores = new Map([['a', 100], ['b', 100], ['c', 50]]);
      const lb = LeaderboardCalculator.calculate(memberships, scores);
      expect(LeaderboardCalculator.getTeamsAtRank(lb, 1)).toHaveLength(2);
    });
  });

  describe('getScoreGaps', () => {
    it('calculates gaps between distinct ranks', () => {
      const memberships = [makeMembership('a', 300), makeMembership('b', 200), makeMembership('c', 50)];
      const scores = new Map([['a', 300], ['b', 200], ['c', 50]]);
      const lb = LeaderboardCalculator.calculate(memberships, scores);
      const gaps = LeaderboardCalculator.getScoreGaps(lb);
      expect(gaps).toEqual([100, 150]);
    });
  });

  describe('isMembershipInTopN', () => {
    it('returns true for membership in top N', () => {
      const memberships = [makeMembership('a', 300), makeMembership('b', 200), makeMembership('c', 100)];
      const scores = new Map([['a', 300], ['b', 200], ['c', 50]]);
      const lb = LeaderboardCalculator.calculate(memberships, scores);
      expect(LeaderboardCalculator.isMembershipInTopN('a', lb, 2)).toBe(true);
      expect(LeaderboardCalculator.isMembershipInTopN('c', lb, 2)).toBe(false);
    });

    it('returns false for membership not in top N', () => {
      const memberships = [makeMembership('a', 300), makeMembership('b', 200), makeMembership('c', 100)];
      const scores = new Map([['a', 300], ['b', 200], ['c', 50]]);
      const lb = LeaderboardCalculator.calculate(memberships, scores);
      expect(LeaderboardCalculator.isMembershipInTopN('c', lb, 1)).toBe(false);
    });
  });

  describe('getTieCounts', () => {
    it('counts ties per rank', () => {
      const memberships = [makeMembership('a', 100), makeMembership('b', 100), makeMembership('c', 50)];
      const scores = new Map([['a', 100], ['b', 100], ['c', 50]]);
      const lb = LeaderboardCalculator.calculate(memberships, scores);
      const ties = LeaderboardCalculator.getTieCounts(lb);
      expect(ties.get(1)).toBe(2);
      expect(ties.get(3)).toBe(1);
    });
  });

  
  describe('validateLeaderboard', () => {
    it('returns true for empty leaderboard', () => {
      expect(LeaderboardCalculator.validateLeaderboard([])).toBe(true);
    });

    it('returns true for valid leaderboard', () => {
      const memberships = [makeMembership('a', 300), makeMembership('b', 200), makeMembership('c', 100)];
      const scores = new Map([['a', 300], ['b', 200], ['c', 100]]);
      const lb = LeaderboardCalculator.calculate(memberships, scores);
      expect(LeaderboardCalculator.validateLeaderboard(lb)).toBe(true);
    });

    it('returns false for invalid leaderboard', () => {
      const invalid = [
        { membershipId: 'a', playerName: 'A', score: 100, rank: 1 },
        { membershipId: 'b', playerName: 'B', score: 200, rank: 1 }, // Higher score but same rank
      ];
      expect(LeaderboardCalculator.validateLeaderboard(invalid)).toBe(false);
    });
  });
});

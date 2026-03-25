import { describe, it, expect } from 'vitest';
import { RoundManager } from '../RoundManager';
import type { RoundDefinition, RoundGroup, Answer } from '../../types/domain.types';
import type { RoomMembership } from '../../types/room.types';

function makeGroup(id: string, teamIds: string[], prompt = 'Test?'): RoundGroup {
  return { id, prompt, teamIds };
}

function makeRound(groups: RoundGroup[], prompt?: string): RoundDefinition {
  return { prompt, groups };
}

function makeMembership(id: string): RoomMembership {
  return { 
    id, 
    roomId: 'test-room', 
    userId: id, 
    playerName: `Player ${id}`, 
    joinedAt: new Date().toISOString(), 
    lastActiveAt: new Date().toISOString(),
    isBanned: false,
    status: 'active' as const 
  };
}

function makeAnswer(id: string, membershipId: string, groupId: string, roundIndex = 0): Answer {
  return { id, membershipId, roundIndex, groupId, text: `Answer ${id}`, createdAt: new Date().toISOString() };
}

describe('RoundManager', () => {
  const g1 = makeGroup('g1', ['t1', 't2']);
  const g2 = makeGroup('g2', ['t3', 't4']);
  const rounds: RoundDefinition[] = [makeRound([g1, g2], 'Round 1'), makeRound([makeGroup('g3', ['t1', 't3'])], 'Round 2')];

  describe('getCurrentRound', () => {
    it('returns round at valid index', () => {
      expect(RoundManager.getCurrentRound(rounds, 0)).toBe(rounds[0]);
      expect(RoundManager.getCurrentRound(rounds, 1)).toBe(rounds[1]);
    });
    it('returns null for out-of-bounds index', () => {
      expect(RoundManager.getCurrentRound(rounds, -1)).toBeNull();
      expect(RoundManager.getCurrentRound(rounds, 5)).toBeNull();
    });
    it('returns null for empty rounds', () => {
      expect(RoundManager.getCurrentRound([], 0)).toBeNull();
    });
  });

  describe('getCurrentGroups', () => {
    it('returns groups for valid round', () => {
      expect(RoundManager.getCurrentGroups(rounds, 0)).toHaveLength(2);
    });
    it('returns empty array for invalid round', () => {
      expect(RoundManager.getCurrentGroups(rounds, 99)).toEqual([]);
    });
  });

  describe('getActiveVoteGroup', () => {
    it('returns group at valid voteGroupIndex', () => {
      expect(RoundManager.getActiveVoteGroup(rounds, 0, 0)).toBe(g1);
      expect(RoundManager.getActiveVoteGroup(rounds, 0, 1)).toBe(g2);
    });
    it('returns null for null voteGroupIndex', () => {
      expect(RoundManager.getActiveVoteGroup(rounds, 0, null)).toBeNull();
    });
    it('returns null for out-of-bounds voteGroupIndex', () => {
      expect(RoundManager.getActiveVoteGroup(rounds, 0, 5)).toBeNull();
    });
  });

  describe('findRoomMembershipGroup', () => {
    it('finds group containing membership', () => {
      expect(RoundManager.findRoomMembershipGroup([g1, g2], 't3')).toBe(g2);
    });
    it('returns null for membership not in any group', () => {
      expect(RoundManager.findRoomMembershipGroup([g1, g2], 't99')).toBeNull();
    });
  });

  describe('getRoomMembershipsInGroup', () => {
    it('returns memberships matching group teamIds', () => {
      const memberships = [makeMembership('t1'), makeMembership('t2'), makeMembership('t3')];
      const result = RoundManager.getRoomMembershipsInGroup(g1, memberships);
      expect(result).toHaveLength(2);
      expect(result.map(m => m.id)).toEqual(['t1', 't2']);
    });
  });

  describe('getGroupAnswers', () => {
    it('filters answers by groupId and roundIndex', () => {
      const answers = [
        makeAnswer('a1', 't1', 'g1', 0),
        makeAnswer('a2', 't2', 'g1', 0),
        makeAnswer('a3', 't3', 'g2', 0),
        makeAnswer('a4', 't1', 'g1', 1),
      ];
      const result = RoundManager.getGroupAnswers(answers, 'g1', 0);
      expect(result).toHaveLength(2);
    });
  });

  describe('isGroupAnswerComplete', () => {
    it('returns true when all teams answered', () => {
      const teams = [makeMembership('t1'), makeMembership('t2')];
      const answers = [makeAnswer('a1', 't1', 'g1'), makeAnswer('a2', 't2', 'g1')];
      expect(RoundManager.isGroupAnswerComplete(g1, teams, answers, 0)).toBe(true);
    });

    it('returns false when a non-host team has not answered', () => {
      const teams = [makeMembership('t1'), makeMembership('t2')];
      const answers = [makeAnswer('a1', 't1', 'g1')];
      expect(RoundManager.isGroupAnswerComplete(g1, teams, answers, 0)).toBe(false);
    });
  });

  describe('isRoundAnswerComplete', () => {
    it('returns true when all groups are complete', () => {
      const teams = [makeMembership('t1'), makeMembership('t2'), makeMembership('t3'), makeMembership('t4')];
      const answers = [
        makeAnswer('a1', 't1', 'g1'), makeAnswer('a2', 't2', 'g1'),
        makeAnswer('a3', 't3', 'g2'), makeAnswer('a4', 't4', 'g2'),
      ];
      expect(RoundManager.isRoundAnswerComplete([g1, g2], teams, answers, 0)).toBe(true);
    });

    it('returns false when any group is incomplete', () => {
      const teams = [makeMembership('t1'), makeMembership('t2'), makeMembership('t3'), makeMembership('t4')];
      const answers = [makeAnswer('a1', 't1', 'g1'), makeAnswer('a2', 't2', 'g1')];
      expect(RoundManager.isRoundAnswerComplete([g1, g2], teams, answers, 0)).toBe(false);
    });
  });

  describe('getNextVoteGroupIndex', () => {
    it('returns 0 when current is null and groups exist', () => {
      expect(RoundManager.getNextVoteGroupIndex(null, 3)).toBe(0);
    });
    it('returns null when current is null and no groups', () => {
      expect(RoundManager.getNextVoteGroupIndex(null, 0)).toBeNull();
    });
    it('increments index', () => {
      expect(RoundManager.getNextVoteGroupIndex(0, 3)).toBe(1);
    });
    it('returns null when at last group', () => {
      expect(RoundManager.getNextVoteGroupIndex(2, 3)).toBeNull();
    });
  });

  describe('isLastVoteGroup', () => {
    it('returns true at last index', () => {
      expect(RoundManager.isLastVoteGroup(2, 3)).toBe(true);
    });
    it('returns false before last index', () => {
      expect(RoundManager.isLastVoteGroup(0, 3)).toBe(false);
    });
    it('returns false for null', () => {
      expect(RoundManager.isLastVoteGroup(null, 3)).toBe(false);
    });
  });

  describe('validateRound', () => {
    it('returns true for valid round', () => {
      const teams = [makeMembership('t1'), makeMembership('t2')];
      expect(RoundManager.validateRound(makeRound([g1]), teams)).toBe(true);
    });
    it('returns false for round with no groups', () => {
      expect(RoundManager.validateRound(makeRound([]), [makeMembership('t1')])).toBe(false);
    });
    it('returns false for group with unknown team ID', () => {
      const teams = [makeMembership('t1')]; // t2 missing
      expect(RoundManager.validateRound(makeRound([g1]), teams)).toBe(false);
    });
  });

  describe('getTotalGroups', () => {
    it('sums groups across all rounds', () => {
      expect(RoundManager.getTotalGroups(rounds)).toBe(3);
    });
    it('returns 0 for empty rounds', () => {
      expect(RoundManager.getTotalGroups([])).toBe(0);
    });
  });

  describe('getVotingProgress', () => {
    it('returns 0 for null index', () => {
      expect(RoundManager.getVotingProgress(null, 3)).toBe(0);
    });
    it('returns 0 for 0 total groups', () => {
      expect(RoundManager.getVotingProgress(0, 0)).toBe(0);
    });
    it('calculates percentage correctly', () => {
      expect(RoundManager.getVotingProgress(0, 4)).toBe(25);
      expect(RoundManager.getVotingProgress(1, 4)).toBe(50);
      expect(RoundManager.getVotingProgress(3, 4)).toBe(100);
    });
  });

  describe('getRoundProgress', () => {
    it('returns 0 for 0 total rounds', () => {
      expect(RoundManager.getRoundProgress(0, 0)).toBe(0);
    });
    it('calculates percentage correctly', () => {
      expect(RoundManager.getRoundProgress(0, 4)).toBe(25);
      expect(RoundManager.getRoundProgress(3, 4)).toBe(100);
    });
  });

  describe('isRoomMembershipInRound', () => {
    it('returns true if membership is in any group', () => {
      expect(RoundManager.isRoomMembershipInRound('t3', [g1, g2])).toBe(true);
    });
    it('returns false if membership is not in any group', () => {
      expect(RoundManager.isRoomMembershipInRound('t99', [g1, g2])).toBe(false);
    });
  });

  describe('getRoomMembershipsNotInRound', () => {
    it('returns memberships not assigned to any group', () => {
      const memberships = [makeMembership('t1'), makeMembership('t2'), makeMembership('t5')];
      const result = RoundManager.getRoomMembershipsNotInRound(memberships, [g1]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('t5');
    });
  });

  describe('getRoundPrompt', () => {
    it('returns prompt for valid round', () => {
      expect(RoundManager.getRoundPrompt(rounds, 0)).toBe('Round 1');
    });
    it('returns empty string for invalid round', () => {
      expect(RoundManager.getRoundPrompt(rounds, 99)).toBe('');
    });
  });

  describe('canAdvanceToNextRound', () => {
    it('returns true when current round complete and more rounds exist', () => {
      expect(RoundManager.canAdvanceToNextRound(0, 3, true)).toBe(true);
    });
    it('returns false when current round not complete', () => {
      expect(RoundManager.canAdvanceToNextRound(0, 3, false)).toBe(false);
    });
    it('returns false when on last round', () => {
      expect(RoundManager.canAdvanceToNextRound(2, 3, true)).toBe(false);
    });
  });
});

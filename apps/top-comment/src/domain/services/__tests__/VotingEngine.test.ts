import { describe, it, expect } from 'vitest';
import { VotingEngine } from '../VotingEngine';
import type { Vote, Answer } from '../../types/domain.types';

function makeVote(answerId: string, voterId: string, groupId = 'g1'): Vote {
  return { id: `v-${voterId}`, voterId, roundIndex: 0, groupId, answerId, createdAt: new Date().toISOString() };
}

function makeAnswer(id: string, membershipId: string, groupId = 'g1'): Answer {
  return { id, membershipId, roundIndex: 0, groupId, text: `Answer ${id}`, createdAt: new Date().toISOString() };
}

describe('VotingEngine', () => {
  describe('calculateVoteCounts', () => {
    it('returns empty map for no votes', () => {
      expect(VotingEngine.calculateVoteCounts([]).size).toBe(0);
    });

    it('counts votes per answer', () => {
      const votes = [makeVote('a1', 'v1'), makeVote('a1', 'v2'), makeVote('a2', 'v3')];
      const counts = VotingEngine.calculateVoteCounts(votes);
      expect(counts.get('a1')).toBe(2);
      expect(counts.get('a2')).toBe(1);
    });
  });

  describe('voteCountsToArray', () => {
    it('converts map to VoteCount array', () => {
      const map = new Map([['a1', 3], ['a2', 1]]);
      const arr = VotingEngine.voteCountsToArray(map);
      expect(arr).toHaveLength(2);
      expect(arr.find(v => v.answerId === 'a1')?.count).toBe(3);
    });
  });

  describe('determineWinners', () => {
    it('returns empty set when no votes', () => {
      const answers = [makeAnswer('a1', 't1'), makeAnswer('a2', 't2')];
      const counts = new Map<string, number>();
      expect(VotingEngine.determineWinners(answers, counts).size).toBe(0);
    });

    it('picks single winner with most votes', () => {
      const answers = [makeAnswer('a1', 't1'), makeAnswer('a2', 't2')];
      const counts = new Map([['a1', 3], ['a2', 1]]);
      const winners = VotingEngine.determineWinners(answers, counts);
      expect(winners.size).toBe(1);
      expect(winners.has('a1')).toBe(true);
    });

    it('picks multiple winners on tie', () => {
      const answers = [makeAnswer('a1', 't1'), makeAnswer('a2', 't2')];
      const counts = new Map([['a1', 2], ['a2', 2]]);
      const winners = VotingEngine.determineWinners(answers, counts);
      expect(winners.size).toBe(2);
    });

    it('ignores answers with 0 votes even if tied at max', () => {
      const answers = [makeAnswer('a1', 't1'), makeAnswer('a2', 't2')];
      const counts = new Map([['a1', 0], ['a2', 0]]);
      const winners = VotingEngine.determineWinners(answers, counts);
      expect(winners.size).toBe(0);
    });
  });

  describe('calculatePoints', () => {
    it('returns 0 for 0 votes', () => {
      expect(VotingEngine.calculatePoints(0)).toBe(0);
    });

    it('returns voteCount * 50', () => {
      expect(VotingEngine.calculatePoints(3)).toBe(150);
    });
  });

  describe('groupAnswersByGroup', () => {
    it('groups answers by groupId', () => {
      const answers = [
        makeAnswer('a1', 't1', 'g1'),
        makeAnswer('a2', 't2', 'g1'),
        makeAnswer('a3', 't3', 'g2'),
      ];
      const grouped = VotingEngine.groupAnswersByGroup(answers);
      expect(grouped.get('g1')).toHaveLength(2);
      expect(grouped.get('g2')).toHaveLength(1);
    });
  });

  describe('sortByVotes', () => {
    it('sorts answers descending by vote count', () => {
      const answers = [makeAnswer('a1', 't1'), makeAnswer('a2', 't2'), makeAnswer('a3', 't3')];
      const counts = new Map([['a1', 1], ['a2', 5], ['a3', 3]]);
      const sorted = VotingEngine.sortByVotes(answers, counts);
      expect(sorted[0].id).toBe('a2');
      expect(sorted[1].id).toBe('a3');
      expect(sorted[2].id).toBe('a1');
    });
  });

  describe('createAnswersWithVotes', () => {
    it('creates AnswerWithVotes objects with correct fields', () => {
      const answers = [makeAnswer('a1', 't1'), makeAnswer('a2', 't2')];
      const counts = new Map([['a1', 3], ['a2', 1]]);
      const winners = new Set(['a1']);
      const result = VotingEngine.createAnswersWithVotes(answers, counts, winners);

      expect(result).toHaveLength(2);
      const a1 = result.find(r => r.answer.id === 'a1')!;
      expect(a1.voteCount).toBe(3);
      expect(a1.isWinner).toBe(true);
      expect(a1.points).toBe(150);

      const a2 = result.find(r => r.answer.id === 'a2')!;
      expect(a2.isWinner).toBe(false);
      expect(a2.points).toBe(50);
    });
  });

  describe('calculateRoundSummaries', () => {
    it('produces summaries for each group', () => {
      const groups = [
        { id: 'g1', prompt: 'Q1', teamIds: ['t1', 't2'] },
        { id: 'g2', prompt: 'Q2', teamIds: ['t3', 't4'] },
      ];
      const answers = [
        makeAnswer('a1', 't1', 'g1'),
        makeAnswer('a2', 't2', 'g1'),
        makeAnswer('a3', 't3', 'g2'),
      ];
      const votes = [makeVote('a1', 'v1', 'g1'), makeVote('a1', 'v2', 'g1')];
      const summaries = VotingEngine.calculateRoundSummaries(groups, answers, votes);

      expect(summaries).toHaveLength(2);
      expect(summaries[0].groupId).toBe('g1');
      expect(summaries[0].winners).toHaveLength(1);
      expect(summaries[0].winners[0].answer.id).toBe('a1');
    });
  });

  describe('getTotalVotesForGroup', () => {
    it('counts votes for a specific group', () => {
      const votes = [
        makeVote('a1', 'v1', 'g1'),
        makeVote('a2', 'v2', 'g1'),
        makeVote('a3', 'v3', 'g2'),
      ];
      expect(VotingEngine.getTotalVotesForGroup(votes, 'g1')).toBe(2);
      expect(VotingEngine.getTotalVotesForGroup(votes, 'g2')).toBe(1);
      expect(VotingEngine.getTotalVotesForGroup(votes, 'g3')).toBe(0);
    });
  });

  describe('isVotingCompleteForGroup', () => {
    it('returns true when all eligible voters have voted', () => {
      const group = { id: 'g1', teamIds: ['t1', 't2'] };
      const teams = [
        { id: 't1', isHost: false },
        { id: 't2', isHost: false },
        { id: 'host', isHost: true },
      ];
      const votes = [
        { ...makeVote('a1', 't1', 'g1'), voterId: 't1' },
        { ...makeVote('a2', 't2', 'g1'), voterId: 't2' },
      ];
      expect(VotingEngine.isVotingCompleteForGroup(votes, group, teams)).toBe(true);
    });

    it('returns false when not all eligible voters have voted', () => {
      const group = { id: 'g1', teamIds: ['t1', 't2'] };
      const teams = [{ id: 't1', isHost: false }, { id: 't2', isHost: false }];
      const votes = [{ ...makeVote('a1', 't1', 'g1'), voterId: 't1' }];
      expect(VotingEngine.isVotingCompleteForGroup(votes, group, teams)).toBe(false);
    });
  });
});

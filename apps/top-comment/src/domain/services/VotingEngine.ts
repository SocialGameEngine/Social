import type { Vote, Answer, VoteCount, RoundSummary, AnswerWithVotes } from '../types/domain.types';

/**
 * Pure service for all voting-related calculations
 * Contains no React dependencies and no side effects
 */
export class VotingEngine {
  /**
   * Calculate vote counts for each answer from an array of votes
   * @param votes - Array of votes to count
   * @returns Map of answerId to vote count
   */
  static calculateVoteCounts(votes: Vote[]): Map<string, number> {
    const counts = new Map<string, number>();
    votes.forEach((vote) => {
      counts.set(vote.answerId, (counts.get(vote.answerId) ?? 0) + 1);
    });
    return counts;
  }

  /**
   * Convert vote counts map to array format
   * @param voteCounts - Map of answerId to vote count
   * @returns Array of VoteCount objects
   */
  static voteCountsToArray(voteCounts: Map<string, number>): VoteCount[] {
    return Array.from(voteCounts.entries()).map(([answerId, count]) => ({
      answerId,
      count
    }));
  }

  /**
   * Determine winners from a group of answers based on vote counts
   * Winners are answers with the highest vote count (must be > 0)
   * @param answers - Array of answers to evaluate
   * @param voteCounts - Map of answerId to vote count
   * @returns Set of answer IDs that are winners
   */
  static determineWinners(answers: Answer[], voteCounts: Map<string, number>): Set<string> {
    const winners = new Set<string>();
    let maxVotes = 0;

    answers.forEach((answer) => {
      const votesForAnswer = voteCounts.get(answer.id) ?? 0;
      if (votesForAnswer > maxVotes) {
        maxVotes = votesForAnswer;
        winners.clear();
        if (votesForAnswer > 0) {
          winners.add(answer.id);
        }
      } else if (votesForAnswer === maxVotes && votesForAnswer > 0) {
        winners.add(answer.id);
      }
    });

    return winners;
  }

  /**
   * Calculate points for an answer based on vote count
   * Points formula: voteCount * ANSWER_VALUE
   * @param voteCount - Number of votes for the answer
   * @returns Points earned for this answer
   */
  static calculatePoints(voteCount: number): number {
    const ANSWER_VALUE = 50;
    return voteCount * ANSWER_VALUE;
  }

  /**
   * Group answers by their group ID
   * @param answers - Array of answers to group
   * @returns Map of groupId to array of answers
   */
  static groupAnswersByGroup(answers: Answer[]): Map<string, Answer[]> {
    const grouped = new Map<string, Answer[]>();
    answers.forEach((answer) => {
      const group = grouped.get(answer.groupId) ?? [];
      group.push(answer);
      grouped.set(answer.groupId, group);
    });
    return grouped;
  }

  /**
   * Sort answers by vote count (descending)
   * @param answers - Array of answers to sort
   * @param voteCounts - Map of answerId to vote count
   * @returns Array of answers sorted by vote count
   */
  static sortByVotes(answers: Answer[], voteCounts: Map<string, number>): Answer[] {
    return [...answers].sort((a, b) => {
      const votesA = voteCounts.get(a.id) ?? 0;
      const votesB = voteCounts.get(b.id) ?? 0;
      return votesB - votesA; // Descending order
    });
  }

  /**
   * Create AnswerWithVotes objects from answers and vote counts
   * @param answers - Array of answers
   * @param voteCounts - Map of answerId to vote count
   * @param winners - Set of winning answer IDs
   * @returns Array of AnswerWithVotes objects
   */
  static createAnswersWithVotes(
    answers: Answer[], 
    voteCounts: Map<string, number>, 
    winners: Set<string>
  ): AnswerWithVotes[] {
    return answers.map((answer) => {
      const voteCount = voteCounts.get(answer.id) ?? 0;
      const isWinner = winners.has(answer.id);
      const points = this.calculatePoints(voteCount);
      
      return {
        answer,
        voteCount,
        isWinner,
        points
      };
    });
  }

  /**
   * Calculate complete round summaries for all groups in a round
   * @param groups - Array of round groups
   * @param answers - Array of all answers for the round
   * @param votes - Array of all votes for the round
   * @returns Array of round summaries
   */
  static calculateRoundSummaries(
    groups: { id: string; prompt: string; teamIds: string[] }[],
    answers: Answer[],
    votes: Vote[]
  ): RoundSummary[] {
    const voteCounts = this.calculateVoteCounts(votes);
    const answersByGroup = this.groupAnswersByGroup(answers);
    
    return groups.map((group) => {
      const groupAnswers = answersByGroup.get(group.id) ?? [];
      const winners = this.determineWinners(groupAnswers, voteCounts);
      const answersWithVotes = this.createAnswersWithVotes(groupAnswers, voteCounts, winners);
      
      return {
        roundIndex: groupAnswers[0]?.roundIndex ?? 0,
        groupId: group.id,
        answers: answersWithVotes,
        winners: answersWithVotes.filter(a => a.isWinner)
      };
    });
  }

  /**
   * Get total votes cast for a specific group
   * @param votes - Array of votes
   * @param groupId - Group ID to filter by
   * @returns Total number of votes for the group
   */
  static getTotalVotesForGroup(votes: Vote[], groupId: string): number {
    return votes.filter(vote => vote.groupId === groupId).length;
  }

  /**
   * Check if voting is complete for a group (all teams have voted)
   * @param votes - Array of votes
   * @param group - Group to check
   * @param teams - Array of all teams
   * @returns Whether voting is complete for the group
   */
  static isVotingCompleteForGroup(votes: Vote[], group: { id: string; teamIds: string[] }, teams: { id: string; isHost: boolean }[]): boolean {
    const eligibleVoters = teams.filter(team => !team.isHost && group.teamIds.includes(team.id));
    const votesForGroup = votes.filter(vote => vote.groupId === group.id);
    const voterIds = new Set(votesForGroup.map(vote => vote.voterId));
    
    return eligibleVoters.every(team => voterIds.has(team.id));
  }
}

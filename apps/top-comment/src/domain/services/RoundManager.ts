import type { RoundDefinition, RoundGroup, Team, Answer } from '../types/domain.types';

/**
 * Pure service for managing round-related logic
 * Contains no React dependencies and no side effects
 */
export class RoundManager {
  /**
   * Get the current round definition
   * @param rounds - Array of all rounds
   * @param roundIndex - Current round index
   * @returns Current round definition or null if invalid
   */
  static getCurrentRound(rounds: RoundDefinition[], roundIndex: number): RoundDefinition | null {
    if (roundIndex < 0 || roundIndex >= rounds.length) {
      return null;
    }
    return rounds[roundIndex];
  }

  /**
   * Get the groups for the current round
   * @param rounds - Array of all rounds
   * @param roundIndex - Current round index
   * @returns Array of round groups or empty array if invalid
   */
  static getCurrentGroups(rounds: RoundDefinition[], roundIndex: number): RoundGroup[] {
    const currentRound = this.getCurrentRound(rounds, roundIndex);
    return currentRound?.groups ?? [];
  }

  /**
   * Get the active voting group for the current round
   * @param rounds - Array of all rounds
   * @param roundIndex - Current round index
   * @param voteGroupIndex - Current vote group index
   * @returns Active voting group or null if invalid
   */
  static getActiveVoteGroup(rounds: RoundDefinition[], roundIndex: number, voteGroupIndex: number | null): RoundGroup | null {
    const groups = this.getCurrentGroups(rounds, roundIndex);
    
    if (voteGroupIndex === null || voteGroupIndex < 0 || voteGroupIndex >= groups.length) {
      return null;
    }
    
    return groups[voteGroupIndex];
  }

  /**
   * Find which group a team belongs to in the current round
   * @param groups - Array of round groups
   * @param teamId - Team ID to find
   * @returns Group containing the team or null if not found
   */
  static findTeamGroup(groups: RoundGroup[], teamId: string): RoundGroup | null {
    return groups.find(group => group.teamIds.includes(teamId)) ?? null;
  }

  /**
   * Get all teams assigned to a specific group
   * @param group - Round group
   * @param teams - Array of all teams
   * @returns Array of teams in the group
   */
  static getTeamsInGroup(group: RoundGroup, teams: Team[]): Team[] {
    return teams.filter(team => group.teamIds.includes(team.id));
  }

  /**
   * Get all answers for a specific group in a round
   * @param answers - Array of all answers
   * @param groupId - Group ID to filter by
   * @param roundIndex - Round index to filter by
   * @returns Array of answers for the group
   */
  static getGroupAnswers(answers: Answer[], groupId: string, roundIndex: number): Answer[] {
    return answers.filter(answer => 
      answer.groupId === groupId && answer.roundIndex === roundIndex
    );
  }

  /**
   * Check if all teams in a group have submitted answers
   * @param group - Round group
   * @param teams - Array of all teams
   * @param answers - Array of all answers
   * @param roundIndex - Current round index
   * @returns Whether all teams in the group have answered
   */
  static isGroupAnswerComplete(
    group: RoundGroup, 
    teams: Team[], 
    answers: Answer[], 
    roundIndex: number
  ): boolean {
    const teamsInGroup = this.getTeamsInGroup(group, teams);
    const groupAnswers = this.getGroupAnswers(answers, group.id, roundIndex);
    const answeringTeamIds = new Set(groupAnswers.map(answer => answer.teamId));
    
    // Check if all non-host teams in the group have answered
    return teamsInGroup
      .filter(team => !team.isHost)
      .every(team => answeringTeamIds.has(team.id));
  }

  /**
   * Check if all groups in the current round have complete answers
   * @param groups - Array of round groups
   * @param teams - Array of all teams
   * @param answers - Array of all answers
   * @param roundIndex - Current round index
   * @returns Whether all groups have complete answers
   */
  static isRoundAnswerComplete(
    groups: RoundGroup[], 
    teams: Team[], 
    answers: Answer[], 
    roundIndex: number
  ): boolean {
    return groups.every(group => 
      this.isGroupAnswerComplete(group, teams, answers, roundIndex)
    );
  }

  /**
   * Get the next vote group index
   * @param currentVoteGroupIndex - Current vote group index
   * @param totalGroups - Total number of groups in the round
   * @returns Next vote group index or null if no more groups
   */
  static getNextVoteGroupIndex(currentVoteGroupIndex: number | null, totalGroups: number): number | null {
    if (currentVoteGroupIndex === null) {
      return totalGroups > 0 ? 0 : null;
    }
    
    const nextIndex = currentVoteGroupIndex + 1;
    return nextIndex < totalGroups ? nextIndex : null;
  }

  /**
   * Check if this is the last group in the round for voting
   * @param voteGroupIndex - Current vote group index
   * @param totalGroups - Total number of groups
   * @returns Whether this is the last group
   */
  static isLastVoteGroup(voteGroupIndex: number | null, totalGroups: number): boolean {
    return voteGroupIndex !== null && voteGroupIndex >= totalGroups - 1;
  }

  /**
   * Check if a round is valid (has groups and teams assigned)
   * @param round - Round definition to validate
   * @param teams - Array of all teams
   * @returns Whether the round is valid
   */
  static validateRound(round: RoundDefinition, teams: Team[]): boolean {
    if (!round.groups || round.groups.length === 0) {
      return false;
    }

    // Check that all team IDs in groups exist
    const allTeamIds = new Set(teams.map(team => team.id));
    
    for (const group of round.groups) {
      if (!group.teamIds || group.teamIds.length === 0) {
        return false;
      }
      
      // Check that all team IDs in this group exist
      for (const teamId of group.teamIds) {
        if (!allTeamIds.has(teamId)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get total number of groups across all rounds
   * @param rounds - Array of all rounds
   * @returns Total number of groups
   */
  static getTotalGroups(rounds: RoundDefinition[]): number {
    return rounds.reduce((total, round) => total + round.groups.length, 0);
  }

  /**
   * Get the progress through voting groups as a percentage
   * @param voteGroupIndex - Current vote group index
   * @param totalGroups - Total number of groups in current round
   * @returns Progress percentage (0-100)
   */
  static getVotingProgress(voteGroupIndex: number | null, totalGroups: number): number {
    if (voteGroupIndex === null || totalGroups === 0) {
      return 0;
    }
    
    return Math.round(((voteGroupIndex + 1) / totalGroups) * 100);
  }

  /**
   * Get the progress through rounds as a percentage
   * @param currentRoundIndex - Current round index
   * @param totalRounds - Total number of rounds
   * @returns Progress percentage (0-100)
   */
  static getRoundProgress(currentRoundIndex: number, totalRounds: number): number {
    if (totalRounds === 0) {
      return 0;
    }
    
    return Math.round(((currentRoundIndex + 1) / totalRounds) * 100);
  }

  /**
   * Check if a team is participating in the current round
   * @param teamId - Team ID to check
   * @param groups - Array of round groups
   * @returns Whether the team is participating
   */
  static isTeamInRound(teamId: string, groups: RoundGroup[]): boolean {
    return groups.some(group => group.teamIds.includes(teamId));
  }

  /**
   * Get all teams that are not participating in the current round
   * @param teams - Array of all teams
   * @param groups - Array of round groups
   * @returns Array of teams not in any group
   */
  static getTeamsNotInRound(teams: Team[], groups: RoundGroup[]): Team[] {
    const participatingTeamIds = new Set<string>();
    
    groups.forEach(group => {
      group.teamIds.forEach(teamId => {
        participatingTeamIds.add(teamId);
      });
    });
    
    return teams.filter(team => !participatingTeamIds.has(team.id));
  }

  /**
   * Get the prompt for the current round
   * @param rounds - Array of all rounds
   * @param roundIndex - Current round index
   * @returns Round prompt or empty string
   */
  static getRoundPrompt(rounds: RoundDefinition[], roundIndex: number): string {
    const currentRound = this.getCurrentRound(rounds, roundIndex);
    return currentRound?.prompt ?? '';
  }

  /**
   * Check if we can advance to the next round
   * @param currentRoundIndex - Current round index
   * @param totalRounds - Total number of rounds
   * @param isCurrentRoundComplete - Whether current round is complete
   * @returns Whether we can advance to next round
   */
  static canAdvanceToNextRound(
    currentRoundIndex: number, 
    totalRounds: number, 
    isCurrentRoundComplete: boolean
  ): boolean {
    return isCurrentRoundComplete && currentRoundIndex < totalRounds - 1;
  }
}

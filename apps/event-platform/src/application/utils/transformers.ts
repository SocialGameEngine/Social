import type { LeaderboardEntry, RoundSummary as DomainRoundSummary } from '../../domain/types/domain.types';
import type { Team, Answer } from '../../shared/types';

/**
 * UI-specific type for leaderboard display
 */
export interface LeaderboardTeam extends Team {
  rank: number;
}

/**
 * UI-specific type for round summary display
 */
export interface RoundSummary {
  group: { id: string; prompt: string; teamIds: string[] };
  index: number;
  answers: (Answer & { teamName: string })[];
  winners: (Answer & { teamName: string })[];
}

/**
 * Transform domain LeaderboardEntry to UI LeaderboardTeam format
 * Merges leaderboard data with full team information
 */
export function transformLeaderboardForUI(
  entries: LeaderboardEntry[],
  teams: Team[]
): LeaderboardTeam[] {
  return entries
    .map(entry => {
      const team = teams.find(t => t.id === entry.teamId);
      if (!team) return null;
      return {
        ...team,
        rank: entry.rank
      };
    })
    .filter((team): team is LeaderboardTeam => team !== null);
}

/**
 * Transform domain RoundSummary to UI format with enriched data
 * Adds team names and group information
 */
export function transformRoundSummariesForUI(
  summaries: DomainRoundSummary[],
  groups: Array<{ id: string; prompt: string; teamIds: string[] }>,
  teams: Team[]
): RoundSummary[] {
  return summaries.map(summary => {
    const group = groups.find(g => g.id === summary.groupId) || {
      id: summary.groupId,
      prompt: '',
      teamIds: []
    };

    // Find the group's index in the groups array (0-based)
    const groupIndex = groups.findIndex(g => g.id === summary.groupId);

    const enrichAnswer = (answerData: { answer: Answer }) => {
      const team = teams.find(t => t.id === answerData.answer.teamId);
      return {
        ...answerData.answer,
        teamName: team?.teamName || 'Unknown'
      };
    };

    return {
      group,
      index: groupIndex,
      answers: summary.answers.map(enrichAnswer),
      winners: summary.winners.map(enrichAnswer)
    };
  });
}

/**
 * Simplified leaderboard transformation for basic display
 * Returns minimal data structure with just id, rank, teamName, score, mascotId
 */
export function transformLeaderboardSimple(entries: LeaderboardEntry[]) {
  return entries.map(entry => ({
    id: entry.teamId,
    rank: entry.rank,
    teamName: entry.teamName,
    score: entry.score,
    mascotId: entry.mascotId
  }));
}

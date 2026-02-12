import type { LeaderboardEntry, RoundSummary as DomainRoundSummary } from '../../domain/types/domain.types';
import type { Answer } from '../../shared/types';

/**
 * UI-specific type for leaderboard display
 */
export interface LeaderboardPlayer extends LeaderboardEntry {
  rank: number;
}

/**
 * UI-specific type for round summary display
 */
export interface RoundSummary {
  group: { id: string; prompt: string; teamIds: string[] };
  index: number;
  answers: (Answer & { playerName: string })[];
  winners: (Answer & { playerName: string })[];
}

/**
 * Transform domain LeaderboardEntry to UI LeaderboardPlayer format
 * Merges leaderboard data with full player information
 */
export function transformLeaderboardForUI(
  entries: LeaderboardEntry[],
  players: any[] // RoomMembership array
): LeaderboardPlayer[] {
  return entries
    .map(entry => {
      const player = players.find(p => p.id === entry.membershipId);
      if (!player) return null;
      return {
        ...entry,
        rank: entry.rank
      };
    })
    .filter((player): player is LeaderboardPlayer => player !== null);
}

/**
 * Transform domain RoundSummary to UI format with enriched data
 * Adds display names and group information
 */
export function transformRoundSummariesForUI(
  summaries: DomainRoundSummary[],
  groups: Array<{ id: string; prompt: string; teamIds: string[] }>,
  players: any[] // RoomMembership array
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
      const player = players.find(p => p.id === answerData.answer.membershipId);
      return {
        ...answerData.answer,
        playerName: player?.playerName || 'Unknown'
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
    id: entry.membershipId,
    rank: entry.rank,
    playerName: entry.playerName,
    score: entry.score,
    mascotId: entry.mascotId
  }));
}

/**
 * Team grouping utilities for fair team distribution
 * Creates balanced groups with 2-4 teams per group, max 4 groups
 */

/**
 * Fisher-Yates shuffle algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Create group sizes based on total teams
 * Rules: groups start at 2 teams, max 4 groups, distribute remaining evenly
 */
export function createGroupSizes(totalTeams: number): number[] {
  const groups: number[] = [];
  
  // Step 1: Determine number of groups
  const groupCount = Math.min(Math.floor(totalTeams / 2), 4);
  console.log(`createGroupSizes: ${totalTeams} teams → ${groupCount} groups`);
  
  // Step 2: Initialize groups with 2 teams each
  for (let i = 0; i < groupCount; i++) {
    groups[i] = 2;
  }
  
  // Step 3: Distribute remaining teams evenly
  let remainingTeams = totalTeams - (groupCount * 2);
  let index = 0;
  
  while (remainingTeams > 0) {
    groups[index] += 1;
    remainingTeams -= 1;
    index = (index + 1) % groupCount;
  }
  
  console.log(`createGroupSizes result:`, groups);
  return groups;
}

/**
 * Distribute team IDs into groups based on group sizes
 */
export function distributeTeamsIntoGroups(
  teamIds: string[], 
  groupSizes: number[]
): string[][] {
  const groups: string[][] = [];
  let teamIndex = 0;
  
  // Shuffle teams for random distribution
  const shuffledTeamIds = shuffleArray(teamIds);
  
  for (const size of groupSizes) {
    const groupTeams = shuffledTeamIds.slice(teamIndex, teamIndex + size);
    groups.push(groupTeams);
    teamIndex += size;
  }
  
  return groups;
}

/**
 * Complete grouping function - takes team IDs and returns grouped teams
 */
export function createTeamGroups(teamIds: string[]): string[][] {
  if (teamIds.length < 2) {
    return [teamIds]; // Edge case: less than 2 teams
  }
  
  const groupSizes = createGroupSizes(teamIds.length);
  return distributeTeamsIntoGroups(teamIds, groupSizes);
}

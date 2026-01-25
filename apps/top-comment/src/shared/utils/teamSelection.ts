import type { Team } from "../types";

/**
 * Select a random team from a list
 * @returns Random team or null if list is empty
 */
export function selectRandomTeam(teams: Team[]): Team | null {
  if (teams.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * teams.length);
  return teams[randomIndex];
}

/**
 * Select one random team per group for category selection
 * @param groups - Array of groups with teamIds
 * @param allTeams - All teams in the session
 * @returns Map of groupId to selected teamId
 */
export function selectTeamsForGroups(
  groups: { id: string; teamIds: string[] }[],
  allTeams: Team[]
): Map<string, string> {
  const selections = new Map<string, string>();
  
  groups.forEach(group => {
    const groupTeams = allTeams.filter(t => group.teamIds.includes(t.id));
    const selectedTeam = selectRandomTeam(groupTeams);
    if (selectedTeam) {
      selections.set(group.id, selectedTeam.id);
    }
  });
  
  return selections;
}

/**
 * Check if a team is the selecting team for their group
 */
export function isSelectingTeam(
  teamId: string,
  groupSelectingTeamId: string | undefined
): boolean {
  return groupSelectingTeamId === teamId;
}

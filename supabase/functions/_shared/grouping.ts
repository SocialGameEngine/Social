// Team grouping utilities

export interface TeamGroup {
  id: string;
  prompt: string;
  teamIds: string[];
}

export function createTeamGroups(players: any[], teamsPerRound: number): TeamGroup[] {
  const groups: TeamGroup[] = [];
  const playersPerTeam = Math.ceil(players.length / teamsPerRound);
  
  for (let i = 0; i < teamsPerRound; i++) {
    const startIndex = i * playersPerTeam;
    const endIndex = Math.min(startIndex + playersPerTeam, players.length);
    const groupPlayers = players.slice(startIndex, endIndex);
    
    groups.push({
      id: crypto.randomUUID(),
      prompt: '', // Will be set later
      teamIds: groupPlayers.map(p => p.id),
    });
  }
  
  return groups;
}

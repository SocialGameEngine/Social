import { Card } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { DrinkTank } from "../../../components/DrinkTank";
import { TeamMembersCard } from "../components/TeamMembersCard";
import { useTeamSession } from "../useTeamSession";
import { useAuth } from "../../../shared/providers/AuthContext";
import type { Team } from "../../../shared/types";


interface LobbyPhaseProps {
  teams: Team[];
}

export function LobbyPhase({ teams }: LobbyPhaseProps) {
  const { isDark } = useTheme();
  const { teamSession } = useTeamSession();
  const { user } = useAuth();
  
  // Find the current user's team
  const currentTeam = teams.find(team => {
    // Primary check: teamId from session
    if (teamSession?.teamId && team.id === teamSession.teamId) {
      return true;
    }
    // Fallback: check if team has members and user is in them
    if (team.team_members && team.team_members.length > 0) {
      // For authenticated users, check user_id match
      if (user?.id) {
        return team.team_members.some(member => member.user_id === user.id);
      }
      // For anonymous users, we can't reliably identify them by user_id (all NULL)
      // So we'll rely on the teamId from session primarily
    }
    return false;
  });
  
  // Calculate captain count first
  const captainCount = currentTeam?.team_members?.filter(m => m.is_captain).length || 0;
  
  // Always log for debugging team members issue
  console.log("LobbyPhase debug:", {
    teams: teams.length,
    teamId: teamSession?.teamId,
    userId: user?.id,
    currentTeam: currentTeam?.teamName,
    hasMembers: currentTeam?.team_members?.length || 0,
    captainCount,
    allTeamsMembers: teams.map(t => ({ id: t.id, name: t.teamName, memberCount: t.team_members?.length || 0 }))
  });
  
  // Only log when there are captain status issues
  if (captainCount !== 1) {
    console.log("Captain issue detected - see above for team data");
  }
  
  return (
    <>
      <Card className="space-y-5" isDark={isDark}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-pink-400">You're in!</h2>
          <p className="text-sm text-cyan-300">
            Waiting for host to start the game.
          </p>
        </div>
      </Card>

      {/* Team members card */}
      {currentTeam && currentTeam.team_members && Array.isArray(currentTeam.team_members) && currentTeam.team_members.length > 0 ? (
        <TeamMembersCard 
          key={`${currentTeam.id}-${currentTeam.team_members.length}-${currentTeam.team_members.map(m => m.id).join(',')}`}
          teamMembers={currentTeam.team_members}
          teamName={currentTeam.teamName}
        />
      ) : null}

      {/* Floating mascot drink tank */}
      <DrinkTank teams={teams} className="mt-6" />
    </>
  );
}


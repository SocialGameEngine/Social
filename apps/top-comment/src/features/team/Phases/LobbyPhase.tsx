import { Card } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { DrinkTank } from "../../../components/DrinkTank";
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
  
  // Find the current player's record
  const currentTeam = teams.find(team => {
    if (teamSession?.teamId && team.id === teamSession.teamId) {
      return true;
    }
    if (user?.id) {
      return team.uid === user.id;
    }
    return false;
  });
  
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

      {/* Floating mascot drink tank */}
      <DrinkTank teams={teams} className="mt-6" />
    </>
  );
}


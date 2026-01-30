import { useTheme } from "../../../shared/providers/ThemeProvider";
import { DrinkTank } from "../../../components/DrinkTank";
import type { Team } from "../../../shared/types";


interface LobbyPhaseProps {
  teams: Team[];
}

export function LobbyPhase({ teams }: LobbyPhaseProps) {
  useTheme();
  
  return (
    <>
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-pink-400">You're in!</h2>
        <p className="text-sm text-cyan-300">
          Waiting for host to start the game.
        </p>
      </div>

      {/* Floating mascot drink tank */}
      <DrinkTank teams={teams} className="mt-6" />
    </>
  );
}


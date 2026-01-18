import type { Session } from "../../../shared/types";
import type { Toast } from "../../../shared/hooks/useToast";
import { kickPlayer } from "../../session/sessionService";

interface KickTeamDeps {
  session: Session | null;
  toast: Toast;
  setKickingTeamId: React.Dispatch<React.SetStateAction<string | null>>;
  // Optional: Force refresh of game state if available
  refresh?: () => void;
}

export const handleKickTeam =
  (deps: KickTeamDeps) => async (teamId: string, userId?: string) => {
    const { session, toast, setKickingTeamId, refresh } = deps;

    if (!session) return;

    setKickingTeamId(teamId);
    try {
      await kickPlayer({ sessionId: session.id, teamId, userId: userId || "" });
      
      // Force refresh if available - this ensures UI updates immediately
      if (refresh) {
        setTimeout(refresh, 100); // Small delay to allow backend to process
      }
      
      toast({ title: "Team removed", variant: "info" });
    } catch (error: unknown) {
      console.log(error);
      toast({ title: "Could not kick team. Please try again.", variant: "error" });
    } finally {
      setKickingTeamId(null);
    }
  };

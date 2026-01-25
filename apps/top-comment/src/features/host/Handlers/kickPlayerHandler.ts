import type { Session } from "../../../shared/types";
import type { Toast } from "../../../shared/hooks/useToast";
import { kickPlayer } from "../../session/sessionService";

interface KickPlayerDeps {
  session: Session | null;
  toast: Toast;
  setKickingPlayerId: React.Dispatch<React.SetStateAction<string | null>>;
  // Optional: Force refresh of game state if available
  refresh?: () => void;
}

export const handleKickPlayer =
  (deps: KickPlayerDeps) => async (playerId: string, userId?: string) => {
    const { session, toast, setKickingPlayerId, refresh } = deps;

    if (!session) return;

    setKickingPlayerId(playerId);
    try {
      await kickPlayer({ sessionId: session.id, teamId: playerId, userId: userId || "" });
      
      // Force refresh if available - this ensures UI updates immediately
      if (refresh) {
        setTimeout(refresh, 100); // Small delay to allow backend to process
      }
      
      toast({ title: "Player removed", variant: "info" });
    } catch (error: unknown) {
      console.log(error);
      toast({ title: "Could not kick player. Please try again.", variant: "error" });
    } finally {
      setKickingPlayerId(null);
    }
  };

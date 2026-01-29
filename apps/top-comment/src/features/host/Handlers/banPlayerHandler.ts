import type { Session } from "../../../shared/types";
import type { Toast } from "../../../shared/hooks/useToast";
import { banPlayer } from "../../session/sessionService";

interface BanPlayerDeps {
  session: Session | null;
  toast: Toast;
  setBanningPlayerId: React.Dispatch<React.SetStateAction<string | null>>;
  refresh?: () => void;
}

export const handleBanPlayer =
  (deps: BanPlayerDeps) => async (playerId: string, userId: string) => {
    const { session, toast, setBanningPlayerId, refresh } = deps;

    if (!session) return;

    setBanningPlayerId(playerId);
    try {
      await banPlayer({ sessionId: session.id, teamId: playerId, userId });
      
      if (refresh) {
        setTimeout(refresh, 100);
      }
      
      toast({ title: "Player banned from session", variant: "info" });
    } catch (error: unknown) {
      console.log(error);
      toast({ title: "Could not ban player. Please try again.", variant: "error" });
    } finally {
      setBanningPlayerId(null);
    }
  };

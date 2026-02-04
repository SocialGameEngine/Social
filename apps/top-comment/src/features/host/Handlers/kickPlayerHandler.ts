import type { Toast } from "../../../shared/hooks/useToast";
import { roomMembershipService } from "../../../services/roomMembershipService";

interface KickPlayerDeps {
  roomId: string | null;
  toast: Toast;
  setKickingPlayerId: React.Dispatch<React.SetStateAction<string | null>>;
  // Optional: Force refresh of game state if available
  refresh?: () => void;
}

export const handleKickPlayer =
  (deps: KickPlayerDeps) => async (playerId: string, userId?: string) => {
    const { roomId, toast, setKickingPlayerId, refresh } = deps;

    if (!roomId || !userId) return;

    setKickingPlayerId(playerId);
    try {
      await roomMembershipService.kickMember({ 
        roomId, 
        userId,
        reason: "Kicked by host" 
      });
      
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

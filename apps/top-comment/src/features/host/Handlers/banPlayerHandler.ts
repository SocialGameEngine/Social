import type { Toast } from "../../../shared/hooks/useToast";
import { roomMembershipService } from "../../../services/roomMembershipService";

interface BanPlayerDeps {
  roomId: string | null;
  toast: Toast;
  setBanningPlayerId: React.Dispatch<React.SetStateAction<string | null>>;
  refresh?: () => void;
}

export const handleBanPlayer =
  (deps: BanPlayerDeps) => async (playerId: string, userId: string) => {
    const { roomId, toast, setBanningPlayerId, refresh } = deps;

    if (!roomId || !userId) return;

    setBanningPlayerId(playerId);
    try {
      await roomMembershipService.banMember({ 
        roomId, 
        userId,
        reason: "Banned by host" 
      });
      
      if (refresh) {
        setTimeout(refresh, 100);
      }
      
      toast({ title: "Player banned from room", variant: "info" });
    } catch (error: unknown) {
      console.log(error);
      toast({ title: "Could not ban player. Please try again.", variant: "error" });
    } finally {
      setBanningPlayerId(null);
    }
  };

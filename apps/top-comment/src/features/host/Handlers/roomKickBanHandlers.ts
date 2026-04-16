import type { Toast } from "../../../shared/hooks/useToast";
import { roomMembershipService } from "../../../services/roomMembershipService";

interface RoomKickBanDeps {
  toast: Toast;
  setKickingPlayerId?: React.Dispatch<React.SetStateAction<string | null>>;
  setBanningPlayerId?: React.Dispatch<React.SetStateAction<string | null>>;
  refresh?: () => void;
}

export const handleRoomKickPlayer = ({
  toast,
  setKickingPlayerId,
  refresh,
}: RoomKickBanDeps) => {
  return async (playerId: string, userId: string, roomId: string) => {
    if (!userId || !roomId) {
      toast({ title: "Cannot kick: missing player data", variant: "error" });
      return;
    }
    
    setKickingPlayerId?.(playerId);
    
    try {
      await roomMembershipService.kickMember({
        roomId,
        userId,
        reason: "Kicked by host",
      });
      
      toast({ 
        title: "Player kicked from room", 
        variant: "success" 
      });
      
      // Refresh the player list
      refresh?.();
    } catch (error) {
      console.error("Failed to kick player from room:", error);
      toast({ 
        title: "Failed to kick player", 
        variant: "error" 
      });
    } finally {
      setKickingPlayerId?.(null);
    }
  };
};

export const handleRoomBanPlayer = ({
  toast,
  setBanningPlayerId,
  refresh,
}: RoomKickBanDeps) => {
  return async (playerId: string, userId: string, roomId: string) => {
    if (!userId || !roomId) {
      toast({ title: "Cannot ban: missing player data", variant: "error" });
      return;
    }
    
    setBanningPlayerId?.(playerId);
    
    try {
      await roomMembershipService.banMember({
        roomId,
        userId,
        reason: "Banned by host",
      });
      
      toast({ 
        title: "Player banned from room", 
        variant: "success" 
      });
      
      // Refresh the player list
      refresh?.();
    } catch (error) {
      console.error("Failed to ban player from room:", error);
      toast({ 
        title: "Failed to ban player", 
        variant: "error" 
      });
    } finally {
      setBanningPlayerId?.(null);
    }
  };
};

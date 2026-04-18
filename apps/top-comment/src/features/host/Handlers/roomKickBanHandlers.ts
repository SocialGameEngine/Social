import type { Toast } from "../../../shared/hooks/useToast";
import { roomMembershipService } from "../../../services/roomMembershipService";
import { handleAsyncError } from '../../../shared/utils/handleAsyncError';

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
      handleAsyncError(error, {
        toast,
        context: 'kickPlayer',
        userMessage: 'Failed to kick player',
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
      handleAsyncError(error, {
        toast,
        context: 'banPlayer',
        userMessage: 'Failed to ban player',
      });
    } finally {
      setBanningPlayerId?.(null);
    }
  };
};

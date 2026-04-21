import type { Sociale } from "../../../domain/types/sociale.types";
import type { Toast } from "../../../shared/hooks/useToast";
import type { QueryClient } from "@tanstack/react-query";
import { roomService } from "../../../services/roomService";
import { advanceSocialePhase, pauseSociale } from "../../sociale/socialeService";
import { getErrorMessage } from '../../../shared/utils/errors';
import { logger } from "../../../shared/utils/logger";

interface SocialePrimaryActionDeps {
  sociale: Sociale | null;
  roomId: string;
  isPerformingAction: boolean;
  triggerPerformingAction: (value: boolean) => void;
  toast: Toast;
  setShowCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
  queryClient?: QueryClient;
}

export const handleSocialePrimaryAction = (deps: SocialePrimaryActionDeps) => async () => {
  const {
    sociale,
    roomId,
    isPerformingAction,
    triggerPerformingAction,
    toast,
    setShowCreateModal,
    queryClient,
  } = deps;

  if (!sociale) {
    setShowCreateModal(true);
    return;
  }
  
  if (isPerformingAction) return;

  triggerPerformingAction(true);
  try {
    // Draft or lobby: Start the Sociale
    if (sociale.status === "draft" || sociale.status === "lobby") {
      try {
        const result = await roomService.startSocialeInRoom({
          roomId,
          socialeSettings: {
            socialeId: sociale.id,
          },
        }, queryClient);
        toast({ title: "Sociale started", variant: "success" });
      } catch (serviceError) {
        logger.error('roomService.startSocialeInRoom failed', { error: serviceError instanceof Error ? serviceError.message : String(serviceError) });
        throw serviceError;
      }
    } 
    // Active or paused: Advance phase
    else if (sociale.status === "active" || sociale.status === "paused") {
      // If paused, unpause first
      if (sociale.status === "paused") {
        await pauseSociale(sociale.id, false);
      }
      
      const result = await advanceSocialePhase({ socialeId: sociale.id, targetPhase: 'next' });
      
      toast({ title: "Phase advanced", variant: "success" });
    }
    // Completed or cancelled: Open create modal for new Sociale
    else if (sociale.status === "completed" || sociale.status === "cancelled") {
      setShowCreateModal(true);
    }
  } catch (error: unknown) {
    logger.error('Sociale primary action error', { error: error instanceof Error ? error.message : String(error) });
    toast({ title: getErrorMessage(error, "Please try again."), variant: "error" });
  } finally {
    triggerPerformingAction(false);
  }
};

import type { Sociale } from "../../../domain/types/sociale.types";
import type { Toast } from "../../../shared/hooks/useToast";
import type { QueryClient } from "@tanstack/react-query";
import { roomService } from "../../../services/roomService";
import { advanceSocialePhase, pauseSociale } from "../../sociale/socialeService";

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

  console.log('🔥 Handler called with queryClient:', !!queryClient, 'roomId:', roomId);

  if (!sociale) {
    setShowCreateModal(true);
    return;
  }
  
  if (isPerformingAction) return;

  triggerPerformingAction(true);
  try {
    // Draft or lobby: Start the Sociale
    if (sociale.status === "draft" || sociale.status === "lobby") {
      console.log('🔥 About to call roomService.startSocialeInRoom with queryClient:', !!queryClient);
      console.log('🔥 Sociale details:', { id: sociale.id, status: sociale.status });
      
      try {
        const result = await roomService.startSocialeInRoom({
          roomId,
          socialeSettings: {
            socialeId: sociale.id,
          },
        }, queryClient);
        console.log('🔥 roomService.startSocialeInRoom completed:', result);
        toast({ title: "Sociale started", variant: "success" });
      } catch (serviceError) {
        console.error('🔥 roomService.startSocialeInRoom failed:', serviceError);
        throw serviceError;
      }
    } 
    // Active or paused: Advance phase
    else if (sociale.status === "active" || sociale.status === "paused") {
      // If paused, unpause first
      if (sociale.status === "paused") {
        console.log('🔥 Unpausing Sociale before advancing phase');
        await pauseSociale(sociale.id, false);
      }
      
      console.log('🔥 Advancing phase from current phase:', sociale.currentPhase);
      const result = await advanceSocialePhase({ socialeId: sociale.id, targetPhase: 'next' });
      console.log('🔥 Phase advanced to:', result.sociale.currentPhase);
      console.log('🔥 New phase ends at:', result.sociale.phaseEndsAt);
      
      toast({ title: "Phase advanced", variant: "success" });
    }
    // Completed or cancelled: Open create modal for new Sociale
    else if (sociale.status === "completed" || sociale.status === "cancelled") {
      setShowCreateModal(true);
    }
  } catch (error: unknown) {
    console.error("Sociale primary action error:", error);

    let errorMessage = "Please try again.";
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      errorMessage = error.message;
    }

    toast({ title: errorMessage, variant: "error" });
  } finally {
    triggerPerformingAction(false);
  }
};

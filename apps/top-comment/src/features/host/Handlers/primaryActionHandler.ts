import type { Session } from "../../../shared/types";
import type { Toast } from "../../../shared/hooks/useToast";
import { advancePhase, startGame, pauseSession } from "../../session/sessionService";
import { getErrorMessage } from '../../../shared/utils/errors';
import { logger } from '../../../shared/utils/logger';

interface PrimaryActionDeps {
  session: Session | null;
  players: any[]; // RoomMembership array
  isPerformingAction: boolean;
  triggerPerformingAction: (value: boolean) => void;
  toast: Toast;
  setShowCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export const handlePrimaryAction = (deps: PrimaryActionDeps) => async () => {
  const {
    session,
    isPerformingAction,
    triggerPerformingAction,
    toast,
    setShowCreateModal,
  } = deps;

  if (!session) {
    setShowCreateModal(true);
    return;
  }
  if (isPerformingAction) return;

  triggerPerformingAction(true);
  try {
    if (session.status === "lobby") {
      await startGame({ sessionId: session.id });
      
      // Locked tiles are already set by sessions-start Edge Function with seeded RNG
      // No need to recalculate here
      
      toast({ title: "Game started", variant: "success" });
    } else if (
      session.status === "answer" ||
      session.status === "vote" ||
      session.status === "results"
    ) {
      // If paused, unpause first, then advance
      if (session.paused) {
        await pauseSession({ sessionId: session.id, pause: false });
      }
      await advancePhase({ sessionId: session.id, targetPhase: 'next' });
    }
  } catch (error: unknown) {
    logger.error('Primary action error', { error: error instanceof Error ? error.message : String(error) });
    toast({ title: getErrorMessage(error, "Please try again."), variant: "error" });
  } finally {
    triggerPerformingAction(false);
  }
};

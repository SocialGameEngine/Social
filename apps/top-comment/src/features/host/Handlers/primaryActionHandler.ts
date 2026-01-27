import type { Session, Team } from "../../../shared/types";
import type { Toast } from "../../../shared/hooks/useToast";
import { advancePhase, startGame, pauseSession } from "../../session/sessionService";
import { updateCategoryGridLocks } from "../../../shared/utils/categoryGrid";
import { supabase } from "../../../supabase/client";

interface PrimaryActionDeps {
  session: Session | null;
  players: Team[];
  isPerformingAction: boolean;
  triggerPerformingAction: (value: boolean) => void;
  toast: Toast;
  setShowCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export const handlePrimaryAction = (deps: PrimaryActionDeps) => async () => {
  const {
    session,
    players,
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
      session.status === "category-select" &&
      session.settings?.gameMode === "jeopardy" && 
      session.categoryGrid && 
      session.settings.selectedCategories &&
      (!session.categoryGrid.lockedTiles || session.categoryGrid.lockedTiles.length === 0)
    ) {
      // Fallback: Calculate locked tiles if session is in category-select but no locked tiles exist
      const numGroups = Math.ceil(players.length / 4);
      const rounds = (session.settings as any).totalRounds || 1;
      
      const updatedGrid = updateCategoryGridLocks(session.categoryGrid, numGroups, rounds);
      
      await supabase
        .from('top_comment_sessions')
        .update({ category_grid: updatedGrid } as any)
        .eq('id', session.id);
        
      toast({ title: "Updated category grid with locked tiles", variant: "success" });
    } else if (session.status === "category-select") {
      // Auto-select categories for groups that haven't chosen before advancing
      if (session.settings?.gameMode === "jeopardy" && session.categoryGrid) {
        const { getCardCategories, getActiveCard, isPromptLocked } = await import("../../../shared/utils/categoryGrid");
        
        const activeCard = getActiveCard(session.categoryGrid, session.roundIndex, session.rounds?.length);
        const cardCategories = getCardCategories(session.categoryGrid, activeCard);
        
        // Find unlocked categories on current card
        const unlockedCategories = cardCategories.filter(cat => 
          !isPromptLocked(session.categoryGrid, cat.id, 0)
        );
        
        // Get current groups to check which need auto-selection
        const currentGroups = session.rounds?.[session.roundIndex]?.groups || [];
        
        // Auto-select for groups without promptLibraryId
        const groupsNeedingSelection = currentGroups.filter(group => !group.promptLibraryId);
        
        if (groupsNeedingSelection.length > 0 && unlockedCategories.length > 0) {
          // Assign random unlocked categories to groups that need selection
          const updatedGroups = currentGroups.map(group => {
            if (!group.promptLibraryId) {
              // Pick a random unlocked category
              const randomCategory = unlockedCategories[Math.floor(Math.random() * unlockedCategories.length)];
              return { ...group, promptLibraryId: randomCategory.id };
            }
            return group;
          });
          
          // Update the session with auto-selected categories
          const updatedRounds = [...session.rounds];
          updatedRounds[session.roundIndex] = {
            ...updatedRounds[session.roundIndex],
            groups: updatedGroups
          };
          
          await supabase
            .from('top_comment_sessions')
            .update({ rounds: updatedRounds } as any)
            .eq('id', session.id);
            
          console.log("Auto-selected categories for", groupsNeedingSelection.length, "groups");
        }
      }
      
      // If paused, unpause first, then advance
      if (session.paused) {
        await pauseSession({ sessionId: session.id, pause: false });
      }
      await advancePhase({ sessionId: session.id });
    } else if (
      session.status === "answer" ||
      session.status === "vote" ||
      session.status === "results"
    ) {
      // If paused, unpause first, then advance
      if (session.paused) {
        await pauseSession({ sessionId: session.id, pause: false });
      }
      await advancePhase({ sessionId: session.id });
    }
  } catch (error: unknown) {
    console.error("Primary action error:", error);

    // Extract error message
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

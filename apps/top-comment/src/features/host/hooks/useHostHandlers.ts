import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import type { Session, RoomMembership, SessionAnalytics } from "../../../shared/types";
import type { Sociale } from "../../../domain/types/sociale.types";
import type { RoundGroup } from "../../../domain/types/domain.types";
import type { Toast } from "../../../shared/utils/error-handling";
import { 
  handleCreateSession, 
  handleUpdateSession, 
  handleEndSession, 
  handleHostVote, 
  handlePrimaryAction, 
  handleSocialePrimaryAction,
  handleCopyLink 
} from "../Handlers";
import { handleRoomKickPlayer, handleRoomBanPlayer } from "../Handlers/roomKickBanHandlers";
import { roomService } from "../../../services/roomService";
import { usePauseManager } from "../../../shared/hooks/usePauseManager";
import { getErrorMessage } from "../../../shared/utils/errors";

interface UseHostHandlersParams {
  // Auth & user
  user: User | null;
  authLoading: boolean;
  isVenueAccount: boolean;
  
  // Session state
  session: Session | null;
  sessionId: string | null;
  setSessionId: Dispatch<SetStateAction<string | null>>;
  setHostSession: (data: { sessionId: string; code: string }) => void;
  clearHostSession: () => void;
  
  // Room state
  storedRoomId: string | null;
  storedRoomCode: string | null;
  refreshMembers: () => void;
  
  // Sociale state
  activeSociale: Sociale | null;
  
  // Game state
  players: RoomMembership[];
  activeGroup: RoundGroup | null;
  activeGroupVote: string | null;

  // Form state
  createForm: { venueName: string; gameMode: 'classic' | 'mashup'; selectedLibraries: string[]; totalRounds?: number };
  setCreateErrors: Dispatch<SetStateAction<Record<string, string>>>;
  
  // Loading states
  isCreating: boolean;
  setIsCreating: Dispatch<SetStateAction<boolean>>;
  isUpdatingSession: boolean;
  setIsUpdatingSession: Dispatch<SetStateAction<boolean>>;
  isEndingSession: boolean;
  setIsEndingSession: Dispatch<SetStateAction<boolean>>;
  isPausingSession: boolean;
  setIsPausingSession: Dispatch<SetStateAction<boolean>>;
  isPerformingAction: boolean;
  triggerPerformingAction: (value: boolean) => void;
  isSubmittingVote: boolean;
  setIsSubmittingVote: Dispatch<SetStateAction<boolean>>;
  
  // Player management
  setKickingPlayerId: Dispatch<SetStateAction<string | null>>;
  setBanningPlayerId: Dispatch<SetStateAction<string | null>>;
  
  // Modal state
  setShowCreateModal: Dispatch<SetStateAction<boolean>>;
  setShowEditModal: Dispatch<SetStateAction<boolean>>;
  setShowEndSessionModal: Dispatch<SetStateAction<boolean>>;
  setShowPromptLibraryModal: Dispatch<SetStateAction<boolean>>;
  setShowSocialeModal: Dispatch<SetStateAction<boolean>>;
  
  // Analytics
  setAnalytics: Dispatch<SetStateAction<SessionAnalytics | null>>;
  setHostGroupVotes: Dispatch<SetStateAction<Record<string, string>>>;

  // Utils
  toast: Toast;
  queryClient: ReturnType<typeof useQueryClient>;
}

export function useHostHandlers(params: UseHostHandlersParams) {
  const {
    user,
    authLoading,
    isVenueAccount,
    session,
    sessionId,
    setSessionId,
    setHostSession,
    clearHostSession,
    storedRoomId,
    storedRoomCode,
    refreshMembers,
    activeSociale,
    players,
    activeGroup,
    activeGroupVote,
    createForm,
    setCreateErrors,
    isCreating,
    setIsCreating,
    isUpdatingSession,
    setIsUpdatingSession,
    isEndingSession,
    setIsEndingSession,
    isPausingSession,
    setIsPausingSession,
    isPerformingAction,
    triggerPerformingAction,
    isSubmittingVote,
    setIsSubmittingVote,
    setKickingPlayerId,
    setBanningPlayerId,
    setShowCreateModal,
    setShowEditModal,
    setShowEndSessionModal,
    setShowPromptLibraryModal,
    setShowSocialeModal,
    setAnalytics,
    setHostGroupVotes,
    toast,
    queryClient,
  } = params;

  // Session creation handler
  const createSession = handleCreateSession({
    user,
    authLoading,
    isVenueAccount,
    toast,
    setCreateErrors,
    isCreating,
    setIsCreating,
    setSessionId,
    setHostSession,
    setShowCreateModal,
    onSessionCreated: () => {
      if (storedRoomId) {
        refreshMembers();
      }
    },
    roomId: storedRoomId,
    roomCode: storedRoomCode,
    gameMode: createForm.gameMode,
    selectedLibraries: createForm.selectedLibraries,
    totalRounds: createForm.totalRounds,
  });

  // Session update handler
  const updateSession = handleUpdateSession({
    user,
    authLoading,
    isVenueAccount,
    toast,
    setCreateErrors,
    isUpdating: isUpdatingSession,
    setIsUpdating: setIsUpdatingSession,
    sessionId: session?.id ?? "",
    onUpdated: ({ sessionId }) => {
      setSessionId(sessionId);
      if (storedRoomCode) {
        setHostSession({ sessionId, code: storedRoomCode });
      }
    },
    setShowEditModal,
    gameMode: createForm.gameMode,
    selectedLibraries: createForm.selectedLibraries,
    totalRounds: createForm.totalRounds,
  });

  // Primary action handler (advance phase)
  const primaryAction = handlePrimaryAction({
    session,
    players,
    isPerformingAction,
    triggerPerformingAction,
    toast,
    setShowCreateModal,
  });

  // Sociale primary action handler
  const socialePrimaryAction = handleSocialePrimaryAction({
    sociale: activeSociale,
    roomId: storedRoomId ?? '',
    isPerformingAction,
    triggerPerformingAction,
    toast,
    setShowCreateModal: setShowSocialeModal,
    queryClient,
  });

  // End session handler
  const confirmEndSession = handleEndSession({
    session,
    isEndingSession,
    setIsEndingSession,
    toast,
    setAnalytics,
    setHostGroupVotes,
  });

  // End Sociale handler
  const endSociale = useCallback(async () => {
    if (!activeSociale || !storedRoomId) return;

    setIsEndingSession(true);
    try {
      await roomService.endSocialeInRoom({
        roomId: storedRoomId,
        socialeId: activeSociale.id,
        mode: 'end',
      });
      toast({
        title: "Sociale ended",
        variant: "success"
      });
      queryClient.invalidateQueries({ queryKey: ['room', storedRoomId] });
      queryClient.invalidateQueries({ queryKey: ['sociale', activeSociale.id] });
    } catch (error: unknown) {
      toast({
        title: getErrorMessage(error, "Failed to end Sociale"),
        variant: "error"
      });
    } finally {
      setIsEndingSession(false);
    }
  }, [activeSociale, storedRoomId, toast, queryClient, setIsEndingSession]);

  // Show end session modal (or end Sociale directly)
  const showEndSessionModal = useCallback(() => {
    if (activeSociale) {
      endSociale();
      return;
    }
    setShowEndSessionModal(true);
  }, [activeSociale, endSociale, setShowEndSessionModal]);

  // Kick player handler
  const kickPlayer = handleRoomKickPlayer({
    toast,
    setKickingPlayerId,
    refresh: refreshMembers,
  });

  // Ban player handler
  const banPlayer = handleRoomBanPlayer({
    toast,
    setBanningPlayerId,
    refresh: refreshMembers,
  });

  // Copy link handler
  const copyLink = handleCopyLink({ toast });

  // Pause/resume toggle handler using unified usePauseManager hook
  const sessionPauseManager = usePauseManager({
    id: session?.id ?? '',
    type: 'session',
    toast,
    onPause: () => setIsPausingSession(false),
    onResume: () => setIsPausingSession(false),
  });

  const socialePauseManager = usePauseManager({
    id: activeSociale?.id ?? '',
    type: 'sociale',
    toast,
    onPause: () => setIsPausingSession(false),
    onResume: () => setIsPausingSession(false),
  });

  const pauseToggle = useCallback(async () => {
    // Handle Sociale pause/resume
    if (activeSociale) {
      setIsPausingSession(true);
      await socialePauseManager.togglePause(activeSociale.status === 'paused');
      return;
    }

    // Handle Session pause/resume
    if (session) {
      setIsPausingSession(true);
      await sessionPauseManager.togglePause(session.paused ?? false);
    }
  }, [session, activeSociale, sessionPauseManager, socialePauseManager, setIsPausingSession]);

  // Leave session handler
  const leaveSession = useCallback(() => {
    clearHostSession();
    setSessionId(null);
    setAnalytics(null);
    setHostGroupVotes({});
    setShowCreateModal(false);
    setShowPromptLibraryModal(false);
    setShowEndSessionModal(false);
  }, [
    clearHostSession,
    setSessionId,
    setAnalytics,
    setHostGroupVotes,
    setShowCreateModal,
    setShowPromptLibraryModal,
    setShowEndSessionModal
  ]);

  // Host vote handler
  const vote = handleHostVote({
    session,
    activeGroup,
    activeGroupVote,
    isSubmittingVote,
    setIsSubmittingVote,
    setHostGroupVotes,
    toast,
  });

  return {
    // Session handlers
    createSession,
    updateSession,
    confirmEndSession,
    leaveSession,
    
    // Action handlers
    primaryAction,
    socialePrimaryAction,
    pauseToggle,
    showEndSessionModal,
    endSociale,
    
    // Player management
    kickPlayer,
    banPlayer,
    
    // Voting
    vote,
    
    // Utils
    copyLink,
  };
}

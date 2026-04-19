import { useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { setPromptLibrary } from "../../session/sessionService";
import { getDefaultPromptLibraryId } from "../../../shared/constants";
import { getErrorMessage } from "../../../shared/utils/errors";
import { logger } from "../../../shared/utils/logger";
import { supabase } from "../../../supabase/client";
import type { PromptLibraryId } from "../../../shared/promptLibraries";
import type { Room, Session } from "../../../shared/types";

interface UseHostCallbacksParams {
  user: { id: string; is_anonymous?: boolean } | null;
  session: Session | null;
  sessionId: string | null;
  storedRoomId: string | null;
  storedRoomCode: string | null;
  canCreateSession: boolean;
  authLoading: boolean;
  venueAccountLoading: boolean;
  isUpdatingPromptLibrary: boolean;
  setIsUpdatingPromptLibrary: (v: boolean) => void;
  setShowCreateModal: (v: boolean) => void;
  setShowEditModal: (v: boolean) => void;
  setShowRoomCreateModal: (v: boolean) => void;
  setShowSocialeModal: (v: boolean) => void;
  setShowVenueAuthPrompt: (v: boolean) => void;
  setShowJoinModal: (v: boolean) => void;
  setShowJoinSocialeModal: (v: boolean) => void;
  setIsJoiningSession: (v: boolean) => void;
  setIsJoiningSociale: (v: boolean) => void;
  setActiveSocialeId: (v: string | null) => void;
  setCreateForm: React.Dispatch<React.SetStateAction<any>>;
  setCreateErrors: React.Dispatch<React.SetStateAction<any>>;
  setSessionId: (id: string | null) => void;
  setHostSession: (data: { sessionId: string; code: string }) => void;
  setHostRoom: (data: { roomId: string; code: string }) => void;
  toast: (options: { title: string; variant?: 'success' | 'error' | 'info'; description?: string }) => void;
  navigate: ReturnType<typeof useNavigate>;
  requireVenueAccount: () => boolean;
  primaryActionHandler: () => void;
  socialePrimaryActionHandler: () => void;
  activeSocialeData: { id: string; currentPhase?: string | null } | null;
}

export function useHostCallbacks(params: UseHostCallbacksParams) {
  const {
    user,
    session,
    sessionId,
    storedRoomId,
    storedRoomCode,
    canCreateSession,
    authLoading,
    venueAccountLoading,
    isUpdatingPromptLibrary,
    setIsUpdatingPromptLibrary,
    setShowCreateModal,
    setShowEditModal,
    setShowRoomCreateModal,
    setShowSocialeModal,
    setShowVenueAuthPrompt,
    setShowJoinModal,
    setShowJoinSocialeModal,
    setIsJoiningSession,
    setIsJoiningSociale,
    setActiveSocialeId,
    setCreateForm,
    setCreateErrors,
    setSessionId,
    setHostSession,
    setHostRoom,
    toast,
    navigate,
    requireVenueAccount,
    primaryActionHandler,
    socialePrimaryActionHandler,
    activeSocialeData,
  } = params;

  const [searchParams] = useSearchParams();

  const handleOpenSocialeSettings = useCallback(() => {
    if (!requireVenueAccount()) {
      return;
    }
    if (!storedRoomId) {
      setShowRoomCreateModal(true);
      return;
    }
    setShowSocialeModal(true);
  }, [requireVenueAccount, storedRoomId, setShowRoomCreateModal]);

  const handleCreateNewSession = useCallback(() => {
    if (!requireVenueAccount()) {
      return;
    }
    if (!storedRoomId) {
      setShowRoomCreateModal(true);
      return;
    }
    setShowCreateModal(true);
  }, [requireVenueAccount, setShowCreateModal, setShowRoomCreateModal, storedRoomId]);

  const handleOpenCreateModal = useCallback(() => {
    if (!requireVenueAccount()) {
      return;
    }
    if (!storedRoomId) {
      setShowRoomCreateModal(true);
      return;
    }
    setShowCreateModal(true);
  }, [requireVenueAccount, setShowCreateModal, setShowRoomCreateModal, storedRoomId]);

  const handleOpenSocialeModal = useCallback(() => {
    if (!requireVenueAccount()) {
      return;
    }
    if (!storedRoomId) {
      setShowRoomCreateModal(true);
      return;
    }
    setShowSocialeModal(true);
  }, [requireVenueAccount, setShowSocialeModal, setShowRoomCreateModal, storedRoomId]);

  const handlePromptLibrarySelect = useCallback(
    async (libraryId: PromptLibraryId) => {
      if (!session || session.status !== "lobby") return;
      if (isUpdatingPromptLibrary) return;
      const defaultId = await getDefaultPromptLibraryId();
      if (libraryId === (session.promptLibraryId ?? defaultId)) {
        return;
      }
      setIsUpdatingPromptLibrary(true);
      setPromptLibrary({ sessionId: session.id, promptLibraryId: libraryId })
        .then(() => {
          toast({
            title: "Prompt library updated! New prompts will be used next round.",
            variant: "success"
          });
        })
        .catch((error: unknown) => {
          toast({
            title: getErrorMessage(error, "Could not update prompts. Please try again."),
            variant: "error"
          });
        })
        .finally(() => {
          setIsUpdatingPromptLibrary(false);
        });
    },
    [session, isUpdatingPromptLibrary, toast],
  );

  const handlePrimaryClick = useCallback(() => {
    if (!session && !activeSocialeData) {
      if (!storedRoomId) {
        if (!requireVenueAccount()) {
          return;
        }
        setShowRoomCreateModal(true);
        return;
      }
      handleOpenSocialeModal();
      return;
    }
    
    if (activeSocialeData) {
      socialePrimaryActionHandler();
      return;
    }
    
    primaryActionHandler();
  }, [session, activeSocialeData, storedRoomId, requireVenueAccount, setShowRoomCreateModal, handleOpenSocialeModal, primaryActionHandler, socialePrimaryActionHandler]);

  const handleOpenEditModal = useCallback(() => {
    if (!requireVenueAccount()) {
      return;
    }
    if (!session) {
      return;
    }

    const sessionSettings = session.settings ?? {};
    setCreateForm({
      venueName: session.venueName ?? "",
      gameMode: sessionSettings.gameMode === "mashup" ? "mashup" : "classic",
      selectedLibraries: Array.isArray(session.selectedLibraries) ? session.selectedLibraries : [],
      totalRounds: typeof sessionSettings.totalRounds === "number" ? sessionSettings.totalRounds : 5,
    });
    setCreateErrors({});
    setShowEditModal(true);
  }, [requireVenueAccount, session, setCreateErrors, setCreateForm, setShowEditModal]);

  const handleCreateModalClose = useCallback(() => {
    setShowCreateModal(false);
    if (!session && !storedRoomId) {
      navigate("/");
    }
  }, [setShowCreateModal, session, storedRoomId, navigate]);

  useEffect(() => {
    const roomCode = searchParams.get('roomCode');
    
    if (roomCode && roomCode !== storedRoomCode) {
      setHostRoom({ roomId: roomCode, code: roomCode });
    }
  }, [searchParams, storedRoomCode, setHostRoom]);

  const handleJoinSession = useCallback(async (joinSessionId: string) => {
    setIsJoiningSession(true);
    try {
      const { data: sessionData, error } = await supabase
        .from('top_comment_sessions')
        .select('id, code')
        .eq('id', joinSessionId)
        .single();

      if (error || !sessionData) {
        toast({ title: 'Session not found', description: 'Please check the session ID and try again', variant: 'error' });
        setIsJoiningSession(false);
        return;
      }

      setSessionId(joinSessionId);
      if (storedRoomCode) {
        setHostSession({ sessionId: joinSessionId, code: storedRoomCode });
      } else {
        logger.warn('Room code not available when joining session');
      }
      setShowJoinModal(false);
      toast({ title: 'Joined session successfully', variant: 'success' });
    } catch (error) {
      toast({ title: getErrorMessage(error, 'Failed to join session'), variant: 'error' });
    } finally {
      setIsJoiningSession(false);
    }
  }, [toast, setSessionId, setHostSession]);

  const handleJoinSociale = async (socialeId: string) => {
    setIsJoiningSociale(true);
    try {
      if (storedRoomId) {
        const { error } = await supabase
          .from('rooms')
          .update({ current_sociale_id: socialeId } as any)
          .eq('id', storedRoomId);

        if (error) {
          throw new Error(`Failed to set room pointer: ${error.message}`);
        }

        setActiveSocialeId(socialeId);
        setShowJoinSocialeModal(false);
        toast({ title: 'Sociale loaded successfully', variant: 'success' });
      } else {
        throw new Error('No room found');
      }
    } catch (error) {
      toast({ title: getErrorMessage(error, 'Failed to load Sociale'), variant: 'error' });
    } finally {
      setIsJoiningSociale(false);
    }
  };

  const handleRoomCreateSuccess = (newRoom: Room) => {
    setShowRoomCreateModal(false);
    setHostRoom({ roomId: newRoom.id, code: newRoom.code });
  };

  return {
    handleOpenSocialeSettings,
    handleCreateNewSession,
    handleOpenCreateModal,
    handleOpenSocialeModal,
    handlePromptLibrarySelect,
    handlePrimaryClick,
    handleOpenEditModal,
    handleCreateModalClose,
    handleJoinSession,
    handleJoinSociale,
    handleRoomCreateSuccess,
  };
}

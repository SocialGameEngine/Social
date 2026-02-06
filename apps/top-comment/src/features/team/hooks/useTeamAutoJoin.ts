import { useEffect } from "react";
import { joinSchema } from "../../../shared/schemas";
import { roomService } from "../../../services/roomService";
import { roomMembershipService } from "../../../services/roomMembershipService";
import { DUPLICATE_TEAM_NAME_MESSAGE, HAS_MANUALLY_LEFT_KEY } from "../utils/teamConstants";

interface UseTeamAutoJoinProps {
  allowAutoJoin: boolean;
  autoJoinAttempted: boolean;
  hasManuallyLeft: boolean;
  authLoading: boolean;
  formattedQueryCode: string;
  isJoining: boolean;
  joinErrors: Record<string, string>;
  teamSession: { sessionId: string; code: string; teamName: string } | null;
  queryTeamName: string;
  sessionId: string | null;
  setAutoJoinAttempted: (attempted: boolean) => void;
  setJoinForm: (form: { code: string; teamName: string }) => void;
  setJoinErrors: (errors: Record<string, string>) => void;
  setIsJoining: (joining: boolean) => void;
  setSessionId: (id: string | null) => void;
  setTeamSession: (session: any) => void;
  clearTeamSession: () => void;
  removeKickedSession: (sessionId: string) => void;
  getKickedFromSessions: () => Map<string, string>;
  isKickedFromCode: (code: string) => boolean;
  isDuplicateTeamNameError: (error: unknown) => boolean;
  getErrorMessage: (error: unknown, fallback?: string) => string;
  toast: (options: { title: string; description?: string; variant: "success" | "error" }) => void;
}

export function useTeamAutoJoin({
  allowAutoJoin,
  autoJoinAttempted,
  hasManuallyLeft,
  authLoading,
  formattedQueryCode,
  isJoining,
  joinErrors,
  teamSession,
  queryTeamName,
  sessionId,
  setAutoJoinAttempted,
  setJoinForm,
  setJoinErrors,
  setIsJoining,
  setSessionId,
  setTeamSession,
  isKickedFromCode,
  isDuplicateTeamNameError,
  getErrorMessage,
  toast,
}: UseTeamAutoJoinProps) {
  const attemptJoin = async (
    values: { code: string; playerName: string },
    options: {
      showFieldErrors?: boolean;
      notifySuccess?: boolean;
      notifyError?: boolean;
    } = {}
  ): Promise<boolean> => {
    const {
      showFieldErrors = true,
      notifySuccess = true,
      notifyError = true,
    } = options;

    const parsed = joinSchema.safeParse(values);

    if (!parsed.success) {
      if (showFieldErrors) {
        const fieldErrors: Record<string, string> = {};
        parsed.error.issues.forEach((issue) => {
          const path = issue.path[0];
          if (typeof path === "string") {
            fieldErrors[path] = issue.message;
          }
        });
        setJoinErrors(fieldErrors);
      }
      return false;
    }

    setJoinErrors({});

    const sessionCode = parsed.data.code.toUpperCase();
    if (isKickedFromCode(sessionCode)) {
      if (notifyError) {
        toast({
          title: "Cannot rejoin session",
          description: "You were removed from this session and cannot rejoin.",
          variant: "error",
        });
      }
      return false;
    }

    setIsJoining(true);
    try {
      // DEPRECATED: joinSession removed - using room-based approach only
      const roomResponse = await roomService.getRoom({ code: sessionCode });
      
      if (!roomResponse?.room) {
        throw new Error("Room not found");
      }

      // Join the room
      await roomMembershipService.joinRoom({
        code: sessionCode,
        playerName: values.playerName,
      });

      // Handle session if room has active session
      const joinedSessionId = roomResponse.room.currentSessionId;
      if (joinedSessionId) {
        setSessionId(joinedSessionId);
        setTeamSession({
          sessionId: joinedSessionId,
          teamId: "", // Will be set when session starts
          teamName: values.playerName,
          code: roomResponse.room.code,
          uid: "", // Will be set when session starts
        });
      } else {
        // No active session - just join room lobby
        setSessionId(null);
        setTeamSession({
          sessionId: "",
          teamId: "",
          teamName: values.playerName,
          code: roomResponse.room.code,
          uid: "",
        });
      }

      setJoinForm({
        code: roomResponse.room.code,
        teamName: values.playerName,
      });

      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.removeItem(HAS_MANUALLY_LEFT_KEY);
        } catch {
          // Ignore sessionStorage errors
        }
      }

      if (notifySuccess) {
        toast({ 
          title: joinedSessionId ? "You joined the session!" : "You're in the room lobby", 
          variant: "success" 
        });
      }
      
      return true;
    } catch (error: unknown) {
      const duplicateTeamName = isDuplicateTeamNameError(error);
      if (duplicateTeamName && showFieldErrors) {
        setJoinErrors({
          ...joinErrors,
          teamName: DUPLICATE_TEAM_NAME_MESSAGE,
        });
      }
      if (notifyError) {
        toast({
          title: "Could not join session",
          description: duplicateTeamName
            ? DUPLICATE_TEAM_NAME_MESSAGE
            : getErrorMessage(error, "Check the code and try again."),
          variant: "error",
        });
      }
      return false;
    } finally {
      setIsJoining(false);
    }
  };

  // Auto-join logic
  useEffect(() => {
    if (!allowAutoJoin) return;
    if (autoJoinAttempted) return;
    if (hasManuallyLeft) return;
    if (!formattedQueryCode || formattedQueryCode.length !== 6) return;
    if (sessionId) return;
    if (isJoining) return;
    if (authLoading) return;

    const fallbackTeamName = queryTeamName || teamSession?.teamName || "";
    if (!fallbackTeamName) return;

    setAutoJoinAttempted(true);
    void attemptJoin(
      { code: formattedQueryCode, playerName: fallbackTeamName },
      { showFieldErrors: false, notifySuccess: false }
    );
  }, [
    allowAutoJoin,
    autoJoinAttempted,
    hasManuallyLeft,
    authLoading,
    attemptJoin,
    formattedQueryCode,
    isJoining,
    teamSession?.teamName,
    queryTeamName,
    sessionId,
    setAutoJoinAttempted,
  ]);

  return { attemptJoin };
}

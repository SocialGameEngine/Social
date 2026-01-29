import { useEffect } from "react";
import { joinSchema } from "../../../shared/schemas";
import { joinSession } from "../../session/sessionService";
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
  clearTeamSession,
  removeKickedSession,
  getKickedFromSessions,
  isKickedFromCode,
  isDuplicateTeamNameError,
  getErrorMessage,
  toast,
}: UseTeamAutoJoinProps) {
  const attemptJoin = async (
    values: { code: string; teamName: string },
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
      const response = await joinSession({
        code: sessionCode,
        teamName: values.teamName,
      });

      const kickedFromSessions = getKickedFromSessions();
      if (response && kickedFromSessions.has(response.sessionId)) {
        setSessionId(null);
        clearTeamSession();
        removeKickedSession(response.sessionId);
        if (notifyError) {
          toast({
            title: "Cannot rejoin session",
            description: "You were removed from this session and cannot rejoin.",
            variant: "error",
          });
        }
        return false;
      }

      if (response) {
        removeKickedSession(response.sessionId);
        setSessionId(response.sessionId);
        setTeamSession({
          sessionId: response.sessionId,
          teamId: response.team.id,
          teamName: response.team.teamName,
          code: response.session.code,
          uid: response.team.uid,
        });
        setJoinForm({
          code: response.session.code,
          teamName: response.team.teamName,
        });

        if (typeof window !== "undefined") {
          try {
            window.sessionStorage.removeItem(HAS_MANUALLY_LEFT_KEY);
          } catch {
            // Ignore sessionStorage errors
          }
        }

        if (notifySuccess) {
          toast({ title: "You joined the lobby", variant: "success" });
        }
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
      { code: formattedQueryCode, teamName: fallbackTeamName },
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

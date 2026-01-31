import type { FormEvent } from "react";
import type { Toast } from "../../../shared/hooks/useToast";
import { createSession } from "../../session/sessionService";
import { createSessionSchema } from "../../../shared/schemas";
import { getErrorMessage } from "../../../shared/utils/errors";
import type { User } from "@supabase/supabase-js";

interface CreateSessionHandlersDeps {
  user: User | null;
  authLoading: boolean;
  isVenueAccount: boolean;
  toast: Toast;
  setCreateErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isCreating: boolean; // Added this prop
  setIsCreating: React.Dispatch<React.SetStateAction<boolean>>;
  setSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  setHostSession: (sessionInfo: { sessionId: string; code: string }) => void;
  setShowCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
  onSessionCreated: () => void;
  gameMode: "classic" | "mashup";
  selectedLibraries: string[];
  totalRounds?: number;
}

export const handleCreateSession =
  (deps: CreateSessionHandlersDeps) =>
  async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const {
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
      onSessionCreated,
      gameMode,
      selectedLibraries,
      totalRounds,
    } = deps;

    if (isCreating) {
      // Prevent multiple submissions while request is in flight
      return;
    }

    if (authLoading) {
      toast({ title: "Hang tight - finishing sign-in before creating your room", variant: "info" });
      return;
    }
    if (!user) {
      toast({ title: "Sign-in failed - refresh the page and try again once connected", variant: "error" });
      return;
    }
    if (!isVenueAccount) {
      toast({ title: "Only venue accounts can host games. Please sign in with your venue credentials.", variant: "error" });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const values = {
      venueName: String(formData.get("venueName") ?? ""),
    };

    const parsed = createSessionSchema.safeParse(values);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0];
        fieldErrors[String(path)] = issue.message;
      });
      setCreateErrors(fieldErrors);
      return;
    }

    setCreateErrors({});
    setIsCreating(true);

    try {
      const response = await createSession({
        venueName: parsed.data.venueName || undefined,
        gameMode,
        selectedLibraries: gameMode === 'mashup' ? selectedLibraries : undefined,
        totalRounds: totalRounds || 5,
      });
      if (response) {
        setSessionId(response.sessionId);
        setHostSession({ sessionId: response.sessionId, code: response.code });
        setShowCreateModal(false);
        onSessionCreated();
        toast({ title: `Game room ready! Share code ${response.session.code} to invite teams`, variant: "success" });
      }
    } catch (error: unknown) {
      toast({ title: getErrorMessage(error, "Could not create session. Please try again in a moment."), variant: "error" });
    } finally {
      setIsCreating(false);
    }
  };

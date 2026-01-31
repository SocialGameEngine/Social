import type { FormEvent } from "react";
import type { Toast } from "../../../shared/hooks/useToast";
import { updateSession } from "../../session/sessionService";
import { createSessionSchema } from "../../../shared/schemas";
import { getErrorMessage } from "../../../shared/utils/errors";
import type { User } from "@supabase/supabase-js";

interface UpdateSessionHandlersDeps {
  user: User | null;
  authLoading: boolean;
  isVenueAccount: boolean;
  toast: Toast;
  setCreateErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isUpdating: boolean;
  setIsUpdating: React.Dispatch<React.SetStateAction<boolean>>;
  sessionId: string;
  onUpdated: (sessionInfo: { sessionId: string; code: string }) => void;
  setShowEditModal: React.Dispatch<React.SetStateAction<boolean>>;
  gameMode: "classic" | "mashup";
  selectedLibraries: string[];
  totalRounds?: number;
}

export const handleUpdateSession =
  (deps: UpdateSessionHandlersDeps) =>
  async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const {
      user,
      authLoading,
      isVenueAccount,
      toast,
      setCreateErrors,
      isUpdating,
      setIsUpdating,
      sessionId,
      onUpdated,
      setShowEditModal,
      gameMode,
      selectedLibraries,
      totalRounds,
    } = deps;

    if (isUpdating) return;

    if (authLoading) {
      toast({ title: "Hang tight - finishing sign-in before updating your room", variant: "info" });
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
    setIsUpdating(true);

    try {
      const response = await updateSession({
        sessionId,
        venueName: parsed.data.venueName || undefined,
        gameMode,
        selectedLibraries: gameMode === "mashup" ? selectedLibraries : undefined,
        totalRounds: totalRounds || 5,
      });

      onUpdated({ sessionId: response.sessionId, code: response.code });
      setShowEditModal(false);
      toast({ title: "Session updated", description: "Your room settings have been applied.", variant: "success" });
    } catch (error: unknown) {
      toast({ title: getErrorMessage(error, "Could not update session. Please try again in a moment."), variant: "error" });
    } finally {
      setIsUpdating(false);
    }
  };


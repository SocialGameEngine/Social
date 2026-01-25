import type { Session } from "../../../shared/types";
import type { Toast } from "../../../shared/hooks/useToast";
import { endSession } from "../../session/sessionService";
import type { SessionAnalytics } from "../../../shared/types";

interface EndSessionDeps {
  session: Session | null;
  isEndingSession: boolean;
  setIsEndingSession: React.Dispatch<React.SetStateAction<boolean>>;
  toast: Toast;
  setAnalytics: React.Dispatch<React.SetStateAction<SessionAnalytics | null>>;
  setHostGroupVotes: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
}

export const handleEndSession = (deps: EndSessionDeps) => async () => {
  const {
    session,
    isEndingSession,
    setIsEndingSession,
    toast,
    setAnalytics,
    setHostGroupVotes,
  } = deps;

  if (!session || isEndingSession) return;

  setIsEndingSession(true);
  try {
    if (session.status !== "ended") {
      await endSession({ sessionId: session.id });
    }
    toast({ title: "Session ended", variant: "info" });
    setAnalytics(null);
    setHostGroupVotes({});
  } catch (error: unknown) {
    console.log(error);
    toast({ title: "Could not end session. Please try again.", variant: "error" });
  } finally {
    setIsEndingSession(false);
  }
};

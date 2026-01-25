import { useMemo } from "react";

interface UsePhaseTimerProps {
  session: any;
}

/**
 * Shared phase timer hook
 * Provides total seconds for different session phases
 */
export function usePhaseTimer({ session }: UsePhaseTimerProps) {
  const totalSeconds = useMemo(() => {
    if (!session) return 90;
    if (session.status === "vote") {
      return session.settings.voteSecs ?? 90;
    }
    if (session.status === "results") {
      return 12;
    }
    return session.settings.answerSecs ?? 90;
  }, [session?.status, session?.settings]);

  return { totalSeconds };
}

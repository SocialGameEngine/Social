import { useMemo } from "react";

interface PhaseTimerSessionShape {
  status?: string;
  /** ISO timestamp when the current phase started (server-authoritative). */
  phaseStartedAt?: string | null;
  /** ISO timestamp when the current phase ends (server-authoritative). */
  phaseEndsAt?: string | null;
  /** Legacy/alternate field name some shims use. */
  endsAt?: string | null;
  settings?: {
    answerSecs?: number;
    voteSecs?: number;
    revealSecs?: number;
    resultsSecs?: number;
  };
}

interface UsePhaseTimerProps {
  session: PhaseTimerSessionShape | null | undefined;
}

/**
 * Shared phase timer hook.
 *
 * Produces a `totalSeconds` value so the CountdownRing can correctly scale its
 * progress fraction for whatever phase is running. Preference order:
 *
 *   1. Server-authoritative: (phaseEndsAt - phaseStartedAt) when both exist.
 *      This is the only source that always matches the real phase length,
 *      including phases whose default we do not know (reveal, results, custom).
 *   2. Settings-based fallback per status (answer / vote / reveal / results).
 *   3. A 90s safety net for anything else.
 */
export function usePhaseTimer({ session }: UsePhaseTimerProps) {
  const totalSeconds = useMemo(() => {
    if (!session) return 90;

    const startedAt = session.phaseStartedAt;
    const endsAt = session.phaseEndsAt ?? session.endsAt;
    if (startedAt && endsAt) {
      const startMs = new Date(startedAt).getTime();
      const endMs = new Date(endsAt).getTime();
      const diffSec = Math.round((endMs - startMs) / 1000);
      if (Number.isFinite(diffSec) && diffSec > 0) {
        return diffSec;
      }
    }

    const status = session.status;
    const settings = session.settings ?? {};
    if (status === "vote") {
      return settings.voteSecs ?? 30;
    }
    if (status === "reveal") {
      return settings.revealSecs ?? 15;
    }
    if (status === "results") {
      return settings.resultsSecs ?? 12;
    }
    return settings.answerSecs ?? 90;
  }, [session]);

  return { totalSeconds };
}

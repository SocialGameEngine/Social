import { useMemo } from "react";

export type PrimaryButtonState =
  | "idle"
  | "comingSoon"
  | "actNow"
  | "wait"
  | "pending";

export interface UsePrimaryButtonStateInput {
  /** The sociale / session status from the server. */
  socialeStatus?: string | null;
  /** Current phase (answer/vote/reveal/results/lobby/break/ended). */
  phase?: string | null;
  /** Whether the current player already submitted an answer/vote for this phase. */
  hasSubmitted?: boolean;
  /** There is an active Sociale the player can join/play. */
  isActive?: boolean;
  /** A phase transition is in flight (e.g. edge function round-advance). */
  isTransitioning?: boolean;
}

/**
 * Maps sociale + phase state to the P1-32 five-state button machine.
 * Any phase-specific UI consumes the return and merges the matching
 * `p1-pab-*` class with its own styling.
 */
export function usePrimaryButtonState(input: UsePrimaryButtonStateInput): PrimaryButtonState {
  const { socialeStatus, phase, hasSubmitted, isActive, isTransitioning } = input;

  return useMemo<PrimaryButtonState>(() => {
    if (isTransitioning) return "pending";
    if (!isActive) return "idle";

    if (socialeStatus === "lobby" || phase === "lobby" || socialeStatus === "draft") {
      return "comingSoon";
    }

    if (phase === "answer" || phase === "vote") {
      return hasSubmitted ? "wait" : "actNow";
    }

    if (phase === "reveal" || phase === "results" || phase === "break") {
      return "wait";
    }

    if (phase === "ended" || socialeStatus === "completed" || socialeStatus === "ended") {
      return "idle";
    }

    return "pending";
  }, [socialeStatus, phase, hasSubmitted, isActive, isTransitioning]);
}

/**
 * Picks the CSS class that applies the P1-32 treatment.
 * Use alongside the existing `.chaos-session-button` classes.
 */
export function primaryButtonStateClass(state: PrimaryButtonState): string {
  switch (state) {
    case "comingSoon":
      return "p1-pab-coming-soon";
    case "actNow":
      return "p1-pab-act-now";
    case "wait":
      return "p1-pab-wait";
    case "pending":
      return "p1-pab-pending";
    case "idle":
    default:
      return "p1-pab-idle";
  }
}

export default usePrimaryButtonState;

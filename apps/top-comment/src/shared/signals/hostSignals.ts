/**
 * Typed contract for host → room / TV ephemeral signals (Supabase Realtime broadcast).
 * Event names match `useHostSignals` channel payloads on `host_signals:${roomId}`.
 *
 * Canonical string literals — use these from publishers so refactors stay grep-friendly.
 */
export const HOST_SIGNAL_EVENTS = {
  ATTENTION_LOCK: "attention:lock",
  ATTENTION_RELEASE: "attention:release",
  SOUND_PLAY: "sound:play",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  SUBMITTED_SET: "submitted:set",
  SUBMITTED_CLEAR: "submitted:clear",
  LOCKIN_REQUIRED: "lockin:required",
  LEADERBOARD_SHOW: "leaderboard:show",
  /** P1-27 — optional future: host forces look-up overlay timing */
  LOOKUP_LOCK: "lookup:lock",
} as const;

export type HostSignalEventName =
  (typeof HOST_SIGNAL_EVENTS)[keyof typeof HOST_SIGNAL_EVENTS];

export type SoundPlayPayload = { id: string };
export type TypingPayload = { id: string };
export type LockInRequiredPayload = { enabled: boolean };

// Re-export hook state + hook for consumers that import from one place
export {
  useHostSignals,
  type HostSignalState,
} from "../../features/room/hooks/useHostSignals";

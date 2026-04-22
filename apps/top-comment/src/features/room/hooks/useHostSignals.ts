import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../../../supabase/client";

/**
 * Shared ephemeral host signalling channel (Wave 4 primitive).
 *
 * Uses Supabase Realtime broadcast (NOT postgres_changes) so we don't persist
 * transient UI signals. Single channel per room, multiple event types:
 *
 *   - attention:lock / attention:release   (P1-6 "All Eyes Up")
 *   - sound:play { id }                    (P1-4 soundboard)
 *   - typing:start / typing:stop { id }    (P1-5 typing indicator)
 *   - lockin:required { enabled }          (P1-17 lock-it-in toggle)
 *
 * The hook returns:
 *   - `signals` — latest state snapshot derived from the stream
 *   - `send(event, payload)` — publisher (host-only in practice, not enforced)
 *
 * NOTE: broadcast is best-effort; late-joiners don't get backfilled state.
 * For the MVP surfaces above that's fine — attention/sound/typing are short-
 * lived and the host can re-toggle if needed.
 */

export interface HostSignalState {
  /** Host has currently locked attention to the TV. */
  attentionLocked: boolean;
  /** Most recent soundboard cue (id + nonce so repeat plays refire). */
  lastSound: { id: string; nonce: number } | null;
  /** Set of membership ids currently "typing" (have focused a text input). */
  typingMemberships: Set<string>;
  /** Host has toggled the lock-it-in confirmation requirement. */
  lockInRequired: boolean;
}

type HostSignalEvent =
  | { event: "attention:lock" }
  | { event: "attention:release" }
  | { event: "sound:play"; payload: { id: string } }
  | { event: "typing:start"; payload: { id: string } }
  | { event: "typing:stop"; payload: { id: string } }
  | { event: "lockin:required"; payload: { enabled: boolean } };

const DEFAULT_STATE: HostSignalState = {
  attentionLocked: false,
  lastSound: null,
  typingMemberships: new Set<string>(),
  lockInRequired: false,
};

export function useHostSignals(roomId: string | null | undefined) {
  const [state, setState] = useState<HostSignalState>(DEFAULT_STATE);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const channel = supabase.channel(`host_signals:${roomId}`, {
      config: { broadcast: { self: true } },
    });

    channel
      .on("broadcast", { event: "attention:lock" }, () =>
        setState((s) => ({ ...s, attentionLocked: true }))
      )
      .on("broadcast", { event: "attention:release" }, () =>
        setState((s) => ({ ...s, attentionLocked: false }))
      )
      .on("broadcast", { event: "sound:play" }, ({ payload }) =>
        setState((s) => ({
          ...s,
          lastSound: { id: String(payload?.id ?? ""), nonce: Date.now() },
        }))
      )
      .on("broadcast", { event: "typing:start" }, ({ payload }) =>
        setState((s) => {
          if (!payload?.id) return s;
          const next = new Set(s.typingMemberships);
          next.add(String(payload.id));
          return { ...s, typingMemberships: next };
        })
      )
      .on("broadcast", { event: "typing:stop" }, ({ payload }) =>
        setState((s) => {
          if (!payload?.id) return s;
          const next = new Set(s.typingMemberships);
          next.delete(String(payload.id));
          return { ...s, typingMemberships: next };
        })
      )
      .on("broadcast", { event: "lockin:required" }, ({ payload }) =>
        setState((s) => ({
          ...s,
          lockInRequired: Boolean(payload?.enabled),
        }))
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId]);

  const send = useCallback(<T extends HostSignalEvent>(
    event: T["event"],
    payload?: T extends { payload: infer P } ? P : never
  ) => {
    const channel = channelRef.current;
    if (!channel) return;
    void channel.send({ type: "broadcast", event, payload: payload ?? {} });
  }, []);

  return { signals: state, send };
}

export default useHostSignals;

import { useEffect, useRef } from "react";
import { useConnectionHealth } from "../../../shared/hooks/useConnectionHealth";
import { submitSocialeResponse } from "../../sociale/socialeService";
import {
  incrementPendingAttempts,
  listPendingAnswers,
  removePendingAnswer,
} from "../utils/pendingAnswerQueue";
import { logger } from "../../../shared/utils/logger";

/**
 * Drains the `pendingAnswerQueue` whenever the Supabase realtime connection
 * transitions from disconnected → connected. Answers submitted while offline
 * are persisted locally, then this hook pushes them to the `sociales-submit-
 * response` edge function once connectivity returns. De-duped per round by
 * the queue itself (last-write-wins per round).
 *
 * Safe no-op on desktops that stay connected — flush runs at most once per
 * reconnect event, and entries are removed on success or re-queued with an
 * incremented attempts counter on failure.
 */
const MAX_ATTEMPTS = 5;

export function usePendingAnswerFlush(): void {
  const { isConnected } = useConnectionHealth();
  const wasConnectedRef = useRef<boolean>(isConnected);
  const flushingRef = useRef(false);

  useEffect(() => {
    const wasConnected = wasConnectedRef.current;
    wasConnectedRef.current = isConnected;

    // Only flush on reconnect edge, not every render while connected.
    if (!isConnected || wasConnected) return;
    if (flushingRef.current) return;

    const pending = listPendingAnswers();
    if (pending.length === 0) return;

    flushingRef.current = true;

    (async () => {
      for (const entry of pending) {
        if (entry.attempts >= MAX_ATTEMPTS) {
          // Give up after 5 tries. Removing silently is preferable to
          // infinite retries that spam the server on a permanent error.
          removePendingAnswer(entry.id);
          logger.warn("Dropped pending answer after max attempts", { id: entry.id });
          continue;
        }
        try {
          await submitSocialeResponse({
            socialeId: entry.socialeId,
            roundId: entry.roundId,
            socialiteId: entry.socialiteId,
            type: entry.type,
            value: entry.value,
          });
          removePendingAnswer(entry.id);
        } catch (err) {
          incrementPendingAttempts(entry.id);
          logger.warn("Pending answer flush failed — will retry on next reconnect", {
            id: entry.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
      flushingRef.current = false;
    })();
  }, [isConnected]);
}

export default usePendingAnswerFlush;

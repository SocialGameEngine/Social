/**
 * localStorage-backed queue of pending sociale answer submissions.
 *
 * Used by P1-3 reconnect flow: when Supabase realtime or the edge function
 * rejects an answer submission (offline, 5xx, 0-network), the RoomPage
 * enqueues it here, then a `usePendingAnswerFlush` hook drains the queue
 * once the Supabase channel reconnects.
 *
 * Storage format: `social_pending_answers: PendingAnswer[]` (JSON).
 */

const STORAGE_KEY = "social_pending_answers";

export interface PendingAnswer {
  id: string; // local UUID used as dedupe key across retries
  socialeId: string;
  roundId: string;
  socialiteId: string;
  type: "text" | "multiple_choice";
  value: string;
  createdAt: number;
  attempts: number;
}

function readQueue(): PendingAnswer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: PendingAnswer[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    /* storage full / denied — accept loss */
  }
}

export function enqueuePendingAnswer(
  entry: Omit<PendingAnswer, "id" | "createdAt" | "attempts">,
): PendingAnswer {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const pending: PendingAnswer = {
    ...entry,
    id,
    createdAt: Date.now(),
    attempts: 0,
  };
  const queue = readQueue();
  // Dedupe by (socialeId, roundId, socialiteId) — last-write-wins.
  const filtered = queue.filter(
    (p) =>
      !(
        p.socialeId === entry.socialeId &&
        p.roundId === entry.roundId &&
        p.socialiteId === entry.socialiteId
      ),
  );
  filtered.push(pending);
  writeQueue(filtered);
  return pending;
}

export function listPendingAnswers(): PendingAnswer[] {
  return readQueue();
}

export function removePendingAnswer(id: string): void {
  const queue = readQueue().filter((p) => p.id !== id);
  writeQueue(queue);
}

export function incrementPendingAttempts(id: string): void {
  const queue = readQueue().map((p) =>
    p.id === id ? { ...p, attempts: p.attempts + 1 } : p,
  );
  writeQueue(queue);
}

export function clearPendingAnswers(): void {
  writeQueue([]);
}

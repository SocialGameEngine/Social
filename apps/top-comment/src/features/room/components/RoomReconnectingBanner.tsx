import { useConnectionHealth } from "../../../shared/hooks/useConnectionHealth";

/**
 * Thin yellow "Reconnecting…" banner for the player phone (P1-3).
 * Renders only when the Supabase realtime connection drops. Uses the shared
 * `useConnectionHealth` hook that already monitors the channel system.
 * Pairs with `pendingAnswerQueue` to flush queued answers on reconnect.
 */
export function RoomReconnectingBanner() {
  const { isConnected, reconnectAttempts, secondsSinceLastUpdate } = useConnectionHealth();

  // Wave R5: the RoomHeader's connection dot covers short blips; only show the
  // full-width banner on prolonged outages (>12s offline, or after multiple
  // reconnect attempts have failed).
  const isProlongedOutage =
    !isConnected && (secondsSinceLastUpdate > 12 || reconnectAttempts >= 2);
  if (!isProlongedOutage) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 px-3 py-1.5 bg-amber-400/95 text-amber-950 text-xs font-semibold shadow-md"
    >
      <svg
        className="w-3.5 h-3.5 animate-spin"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-80"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span>
        Reconnecting
        {reconnectAttempts > 1 ? ` · attempt ${reconnectAttempts}` : ""}
        …
      </span>
    </div>
  );
}

export default RoomReconnectingBanner;

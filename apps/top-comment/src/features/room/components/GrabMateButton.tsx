import { useCallback, useState } from "react";
import { useToast } from "../../../shared/hooks";

interface GrabMateButtonProps {
  roomCode: string | null | undefined;
  /** Optional tone accent for the copy in the share link. */
  occasion?: string;
}

/**
 * P1-23: "Grab your mate" one-tap invite.
 *
 * Opens the Web Share API with a pre-filled deep-link when available
 * (iOS 17+ / Chrome on Android). Falls back to copying the URL + a pair of
 * WhatsApp / SMS links that open the system share picker.
 *
 * The URL format (`/join?code=XXXXXX`) is already consumed by `JoinPage`.
 * We also stamp `&inv=1` so analytics downstream can attribute mate-joins.
 */
export function GrabMateButton({ roomCode, occasion }: GrabMateButtonProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const handleClick = useCallback(async () => {
    if (!roomCode) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/join?code=${encodeURIComponent(roomCode)}&inv=1`;
    const message = `Grab your mate — we're playing Sociales${occasion ? ` ${occasion}` : ""}. Join room ${roomCode}: ${url}`;

    setBusy(true);
    try {
      const nav = typeof navigator !== "undefined" ? navigator : undefined;
      if (nav && typeof nav.share === "function") {
        try {
          await nav.share({
            title: `Join room ${roomCode}`,
            text: message,
            url,
          });
          return;
        } catch (err) {
          // Aborted share is fine; fall through to clipboard
          if (err instanceof DOMException && err.name === "AbortError") return;
        }
      }

      if (nav && nav.clipboard && typeof nav.clipboard.writeText === "function") {
        await nav.clipboard.writeText(url);
        toast({
          title: "Invite copied",
          description: "Paste it into WhatsApp / iMessage / wherever your mate lives.",
          variant: "success",
        });
        return;
      }

      // Final fallback — open sms: deep link.
      window.location.href = `sms:?&body=${encodeURIComponent(message)}`;
    } finally {
      setBusy(false);
    }
  }, [occasion, roomCode, toast]);

  if (!roomCode) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/90 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-pink-500/40 transition hover:bg-pink-400 active:scale-[0.97] disabled:opacity-60"
      aria-label="Grab your mate — share this room"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-3.5 h-3.5"
        aria-hidden="true"
      >
        <path d="M18 8a3 3 0 10-2.83-4H15a3 3 0 00-6 0H8.83A3 3 0 106 8v1H4a1 1 0 00-1 1v9a2 2 0 002 2h14a2 2 0 002-2v-9a1 1 0 00-1-1h-2V8zM8 6a1 1 0 110-2 1 1 0 010 2zm8 0a1 1 0 110-2 1 1 0 010 2z" />
      </svg>
      Grab a mate
    </button>
  );
}

export default GrabMateButton;

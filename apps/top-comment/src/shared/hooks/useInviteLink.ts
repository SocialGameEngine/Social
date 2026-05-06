import { useMemo } from "react";
import type { Session } from "../types";

/**
 * Generates an invite link for a session based on its code
 * Used by HostPage and PresenterPage to display QR codes and shareable links
 */
export function useInviteLink(session: Session | null): string {
  return useMemo(() => {
    if (!session?.code) return "";
    // Use network URL from env var for mobile access, fallback to window.location.origin
    const origin = import.meta.env.VITE_NETWORK_URL || (typeof window !== "undefined" ? window.location.origin : "");
    if (!origin) return "";
    return `${origin}/room/${session.code}`;
  }, [session?.code]);
}

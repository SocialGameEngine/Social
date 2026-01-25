import { useMemo } from "react";
import type { Session } from "../types";

/**
 * Generates an invite link for a session based on its code
 * Used by HostPage and PresenterPage to display QR codes and shareable links
 */
export function useInviteLink(session: Session | null): string {
  return useMemo(() => {
    if (!session?.code) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    if (!origin) return "";
    return `${origin}/join?code=${session.code}`;
  }, [session?.code]);
}

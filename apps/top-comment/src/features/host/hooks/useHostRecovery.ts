import { useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../../supabase/client";

interface UseHostRecoveryProps {
  user: User | null;
  authLoading: boolean;
  isVenueAccount: boolean;
  venueAccountLoading: boolean;
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  setHostSession: (session: { sessionId: string; code: string }) => void;
  setShowCreateModal: (show: boolean) => void;
}

export function useHostRecovery({
  user,
  authLoading,
  isVenueAccount,
  venueAccountLoading,
  sessionId,
  setSessionId,
  setHostSession,
  setShowCreateModal,
}: UseHostRecoveryProps) {
  const recoveryAttemptedRef = useRef(false);

  useEffect(() => {
    if (recoveryAttemptedRef.current) return;
    if (authLoading || venueAccountLoading) return;
    if (!user || user.is_anonymous || !isVenueAccount) return;
    
    // If we already have a session (e.g. from local storage), we don't need to recover from DB
    if (sessionId) {
      recoveryAttemptedRef.current = true;
      return;
    }

    recoveryAttemptedRef.current = true;
    setShowCreateModal(false); // Hide create modal while we check

    const recoverSession = async () => {
      try {
        const { data, error } = await supabase
          .from("top_comment_sessions")
          .select("id, code, status, created_at")
          .eq("host_uid", user.id)
          .neq("status", "ended")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Failed to recover host session:", error);
          setShowCreateModal(true);
          return;
        }

        if (data?.id && data?.code) {
          setSessionId(data.id);
          setHostSession({ sessionId: data.id, code: data.code });
          setShowCreateModal(false);
        } else {
          // No active session found for this user in DB
          setShowCreateModal(true);
        }
      } catch (error: unknown) {
        console.error("Unexpected error during host recovery:", error);
        setShowCreateModal(true);
      }
    };

    recoverSession();
  }, [
    authLoading,
    venueAccountLoading,
    user,
    isVenueAccount,
    sessionId,
    setSessionId,
    setHostSession,
    setShowCreateModal,
  ]);
}

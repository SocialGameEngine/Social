import { useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { User } from "@supabase/supabase-js";
import {
  supabase,
  signInWithEmail,
  signInAnonymouslyUser,
} from "../../supabase/client";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // Don't block UI - load auth in background
  const [error, setError] = useState<Error | null>(null);


  useEffect(() => {
    let cancelled = false;

    // Initial session check
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (cancelled) return;

      if (sessionError) {
        setError(sessionError);
        setLoading(false);
        return;
      }

      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (cancelled) return;
        setUser(session?.user ?? null);
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);


  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    setError(null);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (signUpError) throw signUpError;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      // Try global sign out first
      await supabase.auth.signOut({ scope: 'global' });
    } catch (error) {
      console.error("Global sign out failed, trying local:", error);
      try {
        // Fallback to local sign out
        await supabase.auth.signOut({ scope: 'local' });
      } catch (localError) {
        console.error("Local sign out also failed:", localError);
      }
    }
    
    // Always clear local state regardless of API success
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("host_session_v2");
      window.localStorage.removeItem("host_room_v2");
    }
    setUser(null);
  };

  const signInAnonymously = async () => {
    setError(null);
    try {
      await signInAnonymouslyUser();
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    }
  };

  const isAuthenticated = Boolean(user && !user.is_anonymous);
  const isAnonymous = user?.is_anonymous ?? false;

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated,
      isAnonymous,
      signIn,
      signUp,
      signOut,
      signInAnonymously,
    }),
    [
      user,
      loading,
      error,
      isAuthenticated,
      isAnonymous,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

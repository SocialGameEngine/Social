import { useCallback, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { User } from "@supabase/supabase-js";
import {
  supabase,
  ensureAnonymousAuth,
  signInWithEmail,
  createUserWithEmail,
  signInAnonymouslyUser,
} from "../../supabase/client";
import { AuthContext } from "./AuthContext";
import type { VenueAccount } from "./AuthContext";

interface VenueAccountRow {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: "bar_owner" | "staff";
  avatar_url: string | null;
  created_at: string;
  last_active_at: string | null;
  is_active: boolean;
}

const mapVenueAccount = (row: VenueAccountRow): VenueAccount => ({
  id: row.id,
  authUserId: row.auth_user_id,
  email: row.email,
  fullName: row.full_name,
  phone: row.phone,
  role: row.role,
  avatarUrl: row.avatar_url ?? undefined,
  createdAt: row.created_at,
  lastActiveAt: row.last_active_at ?? undefined,
  isActive: row.is_active,
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [venueAccount, setVenueAccount] = useState<VenueAccount | null>(null);
  const [venueAccountLoading, setVenueAccountLoading] = useState(false);

  const fetchVenueAccount = useCallback(async (userId: string): Promise<VenueAccount | null> => {
    try {
      // Use any type to bypass TypeScript issues for now
      const { data, error } = await (supabase as any)
        .from('venue_accounts')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (error) {
        // If table doesn't exist or other error, return null
        console.error("Venue account query failed:", error);
        return null;
      }

      return data ? mapVenueAccount(data as VenueAccountRow) : null;
    } catch (error) {
      // Handle any unexpected errors
      console.error("Unexpected error fetching venue account:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Get initial session and handle guest auth in single flow
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!cancelled) {
        if (session?.user) {
          // User is already authenticated
          setUser(session.user);
          setLoading(false);
        } else {
          // No user - try anonymous auth
          try {
            const guestUser = await ensureAnonymousAuth();
            setUser(guestUser);
          } catch (error: any) {
            console.error("Failed to authenticate anonymously:", error);
            setUser(null);
          } finally {
            setLoading(false);
          }
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!cancelled) {
          setUser(session?.user ?? null);
          setLoading(false);
          
          // Clear venue account when user signs out
          if (!session?.user) {
            setVenueAccount(null);
            setVenueAccountLoading(false);
          }
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Removed automatic venue account loading - now only loaded on demand via refreshVenueAccount

  const refreshVenueAccount = useCallback(async () => {
    if (!user || user.is_anonymous) {
      setVenueAccount(null);
      setVenueAccountLoading(false);
      return null;
    }

    setVenueAccountLoading(true);
    try {
      const account = await fetchVenueAccount(user.id);
      setVenueAccount(account);
      return account;
    } catch (error) {
      console.error("Failed to refresh venue account:", error);
      setVenueAccount(null);
      return null;
    } finally {
      setVenueAccountLoading(false);
    }
  }, [user, fetchVenueAccount]);

  const signIn = async (email: string, password: string) => {
    await signInWithEmail(email, password);
  };

  const signUp = async (
    email: string,
    password: string,
    displayName?: string,
  ) => {
    await createUserWithEmail(email, password, displayName);
  };

  const signOut = async () => {
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
      window.localStorage.removeItem("sidebets_host_session");
    }
    setUser(null);
    setVenueAccount(null);
    setVenueAccountLoading(false);
  };

  const signInAnonymously = async () => {
    await signInAnonymouslyUser();
  };

  const isGuest = user?.is_anonymous ?? false;
  const isVenueAccount = Boolean(venueAccount?.isActive);

  const value = useMemo(
    () => ({
      user,
      loading,
      venueAccount,
      venueAccountLoading,
      refreshVenueAccount,
      isVenueAccount,
      signIn,
      signUp,
      signOut,
      signInAnonymously,
      isGuest,
    }),
    [
      user,
      loading,
      venueAccount,
      venueAccountLoading,
      refreshVenueAccount,
      isVenueAccount,
      isGuest,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

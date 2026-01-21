import { useCallback, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { User } from "@supabase/supabase-js";
import {
  supabase,
  ensureAnonymousAuth,
  signInWithEmail,
  createUserWithEmail,
  signOutUser,
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
  const [venueAccountLoading, setVenueAccountLoading] = useState(true);

  const fetchVenueAccount = useCallback(async (authUserId: string) => {
    const { data, error } = await supabase
      .from("venue_accounts")
      .select("id, auth_user_id, email, full_name, phone, role, avatar_url, created_at, last_active_at, is_active")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data ? mapVenueAccount(data as VenueAccountRow) : null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    // Ensure anonymous auth if needed
    ensureAnonymousAuth().catch((error) => {
      // Log authentication errors for debugging
      console.error("Failed to authenticate anonymously:", error);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!cancelled) {
          setUser(session?.user ?? null);
          setLoading(false);
          
          // If user just signed in, ensure venue account is loaded immediately
          if (session?.user && (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED')) {
            try {
              const account = await fetchVenueAccount(session.user.id);
              if (!cancelled) {
                setVenueAccount(account);
                setVenueAccountLoading(false);
              }
            } catch (error) {
              if (!cancelled) {
                console.error("Failed to load venue account on auth change:", error);
                setVenueAccount(null);
                setVenueAccountLoading(false);
              }
            }
          }
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchVenueAccount]);

  useEffect(() => {
    let cancelled = false;

    const loadVenueAccount = async () => {
      if (!user) {
        if (!cancelled) {
          setVenueAccount(null);
          setVenueAccountLoading(false);
        }
        return;
      }

      setVenueAccountLoading(true);
      try {
        const account = await fetchVenueAccount(user.id);
        if (!cancelled) {
          setVenueAccount(account);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load venue account:", error);
          setVenueAccount(null);
        }
      } finally {
        if (!cancelled) {
          setVenueAccountLoading(false);
        }
      }
    };

    loadVenueAccount();

    return () => {
      cancelled = true;
    };
  }, [user, fetchVenueAccount]);

  const refreshVenueAccount = useCallback(async () => {
    if (!user) {
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
      throw error;
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
    await signOutUser();
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

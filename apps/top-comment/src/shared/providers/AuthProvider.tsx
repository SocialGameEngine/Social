import { useCallback, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { User } from "@supabase/supabase-js";
import {
  supabase,
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
      const { data, error } = await supabase
        .from('venue_accounts' as 'venue_accounts')
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

    // Get initial session - do NOT automatically sign in as guest
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!cancelled) {
        if (session?.user) {
          // User is already authenticated
          setUser(session.user);
        } else {
          // No user - stay signed out (user must explicitly sign in)
          setUser(null);
        }
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!cancelled) {
          setUser(session?.user ?? null);
          setLoading(false);
          
          // Clear venue account when user signs out
          if (!session?.user) {
            setVenueAccount(null);
            setVenueAccountLoading(false);
          } else {
            // Load venue account when user signs in with timeout
            setVenueAccountLoading(true);
            try {
              const venueAcc = await Promise.race([
                fetchVenueAccount(session.user.id),
                new Promise<never>((_, reject) => 
                  setTimeout(() => reject(new Error("Venue account loading timeout")), 10000)
                )
              ]);
              
              if (!cancelled) {
                setVenueAccount(venueAcc);
                setVenueAccountLoading(false);
              }
            } catch (error) {
              console.error("Failed to load venue account:", error);
              if (!cancelled) {
                // Sign user out if venue account fails to load
                await supabase.auth.signOut();
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
    
    // Create player account after successful sign in if it doesn't exist
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        await (supabase as any).rpc('get_or_create_player_account', {
          p_user_id: user.id,
          p_display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Player',
        });
      } catch (error) {
        console.error('Failed to create player account:', error);
        // Don't throw error - the auth was successful
      }
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName?: string,
  ) => {
    return await createUserWithEmail(email, password, displayName);
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

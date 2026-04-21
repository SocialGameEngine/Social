import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../shared/providers/AuthContext';
import { supabase } from '../../supabase/client';

export interface VenueAccount {
  id: string;
  authUserId: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: "bar_owner" | "staff";
  avatarUrl?: string | null;
  createdAt: string;
  lastActiveAt?: string | null;
  isActive: boolean;
  roomId?: string | null;
}

export interface VenueAccountResolverResult {
  venueAccount: VenueAccount | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<VenueAccount | null>;
}

/**
 * Hook to resolve venue account in host contexts (/host).
 *
 * Uses `resolvedForUserId` state so that `loading` becomes `true` synchronously
 * the moment a new authenticated user appears — before the fetch effect fires.
 * This prevents useHostRoomRecovery from racing ahead and prematurely marking
 * "no_room_confirmed" while the venue account is still being fetched.
 */
export function useVenueAccountResolver(): VenueAccountResolverResult {
  const { user } = useAuth();
  const [venueAccount, setVenueAccount] = useState<VenueAccount | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  // Tracks which user ID we have already resolved. Null means "not yet resolved".
  const [resolvedForUserId, setResolvedForUserId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const fetchInProgressRef = useRef(false);

  const authenticatedUserId = (user && !user.is_anonymous) ? user.id : null;

  // Derived loading: true whenever there is an authenticated user we have not yet resolved.
  // This is computed synchronously on every render so there is no race window where
  // loading appears false before the fetch effect has a chance to run.
  const loading = isFetching || (authenticatedUserId !== null && resolvedForUserId !== authenticatedUserId);

  const doFetch = useCallback(async (userId: string): Promise<VenueAccount | null> => {
    if (fetchInProgressRef.current) return null;
    fetchInProgressRef.current = true;
    setIsFetching(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('venue_accounts')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch venue account: ${fetchError.message}`);
      }

      let account: VenueAccount | null = null;
      if (data) {
        account = {
          id: data.id,
          authUserId: data.auth_user_id,
          email: data.email,
          fullName: data.full_name,
          phone: data.phone ?? undefined,
          role: data.role as "bar_owner" | "staff",
          avatarUrl: data.avatar_url ?? undefined,
          createdAt: data.created_at || new Date().toISOString(),
          lastActiveAt: data.last_active_at ?? undefined,
          isActive: data.is_active ?? false,
          roomId: data.room_id ?? undefined,
        };
      }

      setVenueAccount(account);
      setResolvedForUserId(userId);
      return account;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      setVenueAccount(null);
      setResolvedForUserId(userId); // Mark resolved even on error so loading clears
      return null;
    } finally {
      setIsFetching(false);
      fetchInProgressRef.current = false;
    }
  }, []); // stable: only uses setState functions and the ref

  // Auto-fetch whenever a new authenticated user appears
  useEffect(() => {
    if (authenticatedUserId && resolvedForUserId !== authenticatedUserId && !fetchInProgressRef.current) {
      doFetch(authenticatedUserId).catch((err) => {
        console.error('Failed to auto-fetch venue account:', err);
      });
    }
  }, [authenticatedUserId, resolvedForUserId, doFetch]);

  const refresh = useCallback(async (): Promise<VenueAccount | null> => {
    if (!authenticatedUserId) return null;
    // Reset resolved state so the effect re-fetches and loading re-derives to true
    setResolvedForUserId(null);
    return doFetch(authenticatedUserId);
  }, [authenticatedUserId, doFetch]);

  return {
    venueAccount,
    loading,
    error,
    refresh,
  };
}

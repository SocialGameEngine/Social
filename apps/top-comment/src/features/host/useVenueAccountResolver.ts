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
 * This hook:
 * - Checks if a venue_accounts record exists for the authenticated user
 * - If not, returns null (does NOT auto-create)
 * - Provides refresh() to refetch after explicit venue account creation
 * - Should only be used in host contexts
 */
export function useVenueAccountResolver(): VenueAccountResolverResult {
  const { user } = useAuth();
  const [venueAccount, setVenueAccount] = useState<VenueAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const resolutionAttemptedRef = useRef(false);
  const resolutionInProgressRef = useRef(false);

  const fetchVenueAccount = useCallback(async (): Promise<VenueAccount | null> => {
    if (!user || user.is_anonymous) {
      return null;
    }

    // Prevent concurrent fetches
    if (resolutionInProgressRef.current) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!resolutionInProgressRef.current) {
            clearInterval(checkInterval);
            resolve(venueAccount);
          }
        }, 100);
      });
    }

    resolutionInProgressRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('venue_accounts')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch venue account: ${fetchError.message}`);
      }

      if (!data) {
        setVenueAccount(null);
        resolutionAttemptedRef.current = true;
        return null;
      }

      const account: VenueAccount = {
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

      setVenueAccount(account);
      resolutionAttemptedRef.current = true;
      return account;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      setVenueAccount(null);
      return null;
    } finally {
      setLoading(false);
      resolutionInProgressRef.current = false;
    }
  }, [user, venueAccount]);

  const refresh = useCallback(async (): Promise<VenueAccount | null> => {
    resolutionAttemptedRef.current = false;
    return fetchVenueAccount();
  }, [fetchVenueAccount]);

  // Auto-fetch on mount if user is authenticated
  useEffect(() => {
    if (user && !user.is_anonymous && !resolutionAttemptedRef.current && !resolutionInProgressRef.current) {
      fetchVenueAccount().catch((err) => {
        console.error('Failed to auto-fetch venue account:', err);
      });
    }
  }, [user, fetchVenueAccount]);

  return {
    venueAccount,
    loading,
    error,
    refresh,
  };
}

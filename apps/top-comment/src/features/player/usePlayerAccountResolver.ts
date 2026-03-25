import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../shared/providers/AuthContext';
import { supabase } from '../../supabase/client';

export interface PlayerAccount {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  playerLevel: number;
  totalGamesPlayed: number;
  totalWins: number;
  totalPoints: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerAccountResolverResult {
  playerAccount: PlayerAccount | null;
  loading: boolean;
  error: Error | null;
  ensurePlayerAccount: () => Promise<PlayerAccount>;
}

/**
 * Hook to resolve or create player account in player contexts (room/join).
 * 
 * This hook:
 * - Checks if a player_accounts record exists for the authenticated user
 * - If not, creates one via get_or_create_player_account RPC
 * - Is idempotent and safe for concurrent calls
 * - Should only be used in player contexts (room/join pages)
 */
export function usePlayerAccountResolver(): PlayerAccountResolverResult {
  const { user } = useAuth();
  const [playerAccount, setPlayerAccount] = useState<PlayerAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const resolutionAttemptedRef = useRef(false);
  const resolutionInProgressRef = useRef(false);

  const ensurePlayerAccount = useCallback(async (): Promise<PlayerAccount> => {
    if (!user) {
      throw new Error('User must be authenticated to create player account');
    }

    // Prevent concurrent resolution attempts
    if (resolutionInProgressRef.current) {
      // Wait for in-progress resolution
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (!resolutionInProgressRef.current) {
            clearInterval(checkInterval);
            if (playerAccount) {
              resolve(playerAccount);
            } else if (error) {
              reject(error);
            } else {
              reject(new Error('Player account resolution failed'));
            }
          }
        }, 100);
      });
    }

    resolutionInProgressRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // First, try to fetch existing player account
      const { data: existingAccount, error: fetchError } = await supabase
        .from('player_accounts')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch player account: ${fetchError.message}`);
      }

      if (existingAccount) {
        const account: PlayerAccount = {
          id: existingAccount.id,
          userId: existingAccount.user_id,
          displayName: existingAccount.display_name,
          avatarUrl: existingAccount.avatar_url ?? undefined,
          playerLevel: existingAccount.player_level || 1,
          totalGamesPlayed: existingAccount.total_games_played || 0,
          totalWins: existingAccount.total_wins || 0,
          totalPoints: existingAccount.total_points || 0,
          status: existingAccount.status || 'active',
          createdAt: existingAccount.created_at || new Date().toISOString(),
          updatedAt: existingAccount.updated_at || new Date().toISOString(),
        };
        setPlayerAccount(account);
        resolutionAttemptedRef.current = true;
        return account;
      }

      // No existing account, create one via RPC
      const baseName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Player';
      const uniqueSuffix = Math.random().toString(36).substring(2, 8);
      const uniqueDisplayName = `${baseName}_${uniqueSuffix}`;

      const { data: rpcData, error: rpcError } = await (supabase as any).rpc('get_or_create_player_account', {
        p_user_id: user.id,
        p_display_name: uniqueDisplayName,
      });

      if (rpcError) {
        throw new Error(`Failed to create player account: ${rpcError.message}`);
      }

      if (!rpcData || rpcData.length === 0) {
        throw new Error('Player account creation returned no data');
      }

      const createdAccount = rpcData[0];
      const account: PlayerAccount = {
        id: createdAccount.id,
        userId: createdAccount.user_id,
        displayName: createdAccount.display_name,
        avatarUrl: createdAccount.avatar_url ?? undefined,
        playerLevel: createdAccount.player_level || 1,
        totalGamesPlayed: createdAccount.total_games_played || 0,
        totalWins: createdAccount.total_wins || 0,
        totalPoints: createdAccount.total_points || 0,
        status: createdAccount.status || 'active',
        createdAt: createdAccount.created_at || new Date().toISOString(),
        updatedAt: createdAccount.updated_at || new Date().toISOString(),
      };

      setPlayerAccount(account);
      resolutionAttemptedRef.current = true;
      return account;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
      resolutionInProgressRef.current = false;
    }
  }, [user, playerAccount, error]);

  // Auto-resolve on mount if user is authenticated
  useEffect(() => {
    if (user && !user.is_anonymous && !resolutionAttemptedRef.current && !resolutionInProgressRef.current) {
      ensurePlayerAccount().catch((err) => {
        console.error('Failed to auto-resolve player account:', err);
      });
    }
  }, [user, ensurePlayerAccount]);

  return {
    playerAccount,
    loading,
    error,
    ensurePlayerAccount,
  };
}

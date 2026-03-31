// =============================================================================
// SOCIALITES DATA HOOK
// =============================================================================
// Hook for fetching and managing Socialite data.

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';
import type { Socialite, JoinSocialeRequest } from '../../domain/types/sociale.types';
import { mapSocialite, joinSociale } from '../socialeService';

/**
 * Hook for fetching Socialites by Sociale
 */
export function useSocialites(socialeId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socialeId) return;

    const channel = supabase
      .channel(`socialites:${socialeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'socialites', filter: `sociale_id=eq.${socialeId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['socialites', socialeId] });
          void queryClient.invalidateQueries({ queryKey: ['socialite', socialeId] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [socialeId, queryClient]);

  return useQuery({
    queryKey: ['socialites', socialeId],
    queryFn: async () => {
      if (!socialeId) return [];
      
      const { data, error } = await supabase
        .from('socialites')
        .select('*')
        .eq('sociale_id', socialeId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data.map(mapSocialite).filter(Boolean) as Socialite[];
    },
    enabled: !!socialeId,
  });
}

/**
 * Hook for fetching current user's Socialite
 */
export function useCurrentSocialite(socialeId?: string, userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socialeId || !userId) return;

    const channel = supabase
      .channel(`socialite:${socialeId}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'socialites',
          filter: `sociale_id=eq.${socialeId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['socialite', socialeId, userId] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [socialeId, userId, queryClient]);

  return useQuery({
    queryKey: ['socialite', socialeId, userId],
    queryFn: async () => {
      if (!socialeId || !userId) return null;
      
      const { data, error } = await supabase
        .from('socialites')
        .select('*')
        .eq('sociale_id', socialeId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data ? mapSocialite(data) : null;
    },
    enabled: !!socialeId && !!userId,
  });
}

/**
 * Hook for joining a Sociale
 */
export function useJoinSociale() {
  return useMutation({
    mutationFn: async (request: JoinSocialeRequest) => {
      const response = await joinSociale({
        socialeId: request.socialeId,
        roomId: request.roomId,
        userId: request.userId,
        displayName: request.displayName ?? 'Player',
        mascotId: request.mascotId,
        joinNextRound: request.joinNextRound ?? false,
      });

      return response.socialite;
    },
  });
}

/**
 * Hook for updating a Socialite
 */
export function useUpdateSocialite() {
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Socialite> }) => {
      const { data, error } = await supabase
        .from('socialites')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return mapSocialite(data);
    },
  });
}

/**
 * Hook for leaving a Sociale
 */
export function useLeaveSociale() {
  return useMutation({
    mutationFn: async (socialiteId: string) => {
      const { error } = await supabase
        .from('socialites')
        .delete()
        .eq('id', socialiteId);
      
      if (error) throw error;
      return true;
    },
  });
}

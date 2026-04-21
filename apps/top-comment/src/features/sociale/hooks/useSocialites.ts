// =============================================================================
// SOCIALITES DATA HOOK
// =============================================================================
// Hook for fetching and managing Socialite data.

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../../../supabase/client';
import type { Socialite, JoinSocialeRequest } from '../../../domain/types/sociale.types';
import { mapSocialite, joinSociale } from '../socialeService';
import { useSocialeChannel } from './useSocialeChannel';

/**
 * Hook for fetching Socialites by Sociale
 */
export function useSocialites(socialeId?: string) {
  const queryClient = useQueryClient();

  // Use unified sociale channel instead of dedicated socialites channel
  const onPayload = useCallback((payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
    if (payload?.table === 'socialites') {
      void queryClient.invalidateQueries({ queryKey: ['socialites', socialeId] });

      // For precise invalidation of individual socialite queries
      const userId = payload.eventType === 'DELETE'
        ? payload.old?.user_id
        : payload.new?.user_id;

      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: ['socialite', socialeId, userId]
        });
      }
    }
  }, [socialeId, queryClient]);

  useSocialeChannel(socialeId, onPayload);

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

  // Use unified sociale channel — filters by table + userId in callback
  const onPayload = useCallback((payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
    if (payload?.table === 'socialites' && userId) {
      const payloadUserId = payload.eventType === 'DELETE'
        ? payload.old?.user_id
        : payload.new?.user_id;

      if (payloadUserId === userId) {
        void queryClient.invalidateQueries({
          queryKey: ['socialite', socialeId, userId]
        });
      }
    }
  }, [socialeId, userId, queryClient]);

  useSocialeChannel(socialeId, onPayload);

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
  const queryClient = useQueryClient();

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
    onSuccess: (updatedSocialite) => {
      // Precise invalidation for the updated socialite
      if (updatedSocialite?.userId) {
        void queryClient.invalidateQueries({ 
          queryKey: ['socialite', updatedSocialite.socialeId, updatedSocialite.userId] 
        });
      }
      
      // Also invalidate the socialites list for the Sociale
      if (updatedSocialite?.socialeId) {
        void queryClient.invalidateQueries({ queryKey: ['socialites', updatedSocialite.socialeId] });
      }
    },
  });
}

/**
 * Hook for leaving a Sociale
 */
export function useLeaveSociale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (socialiteId: string) => {
      const { error } = await supabase
        .from('socialites')
        .delete()
        .eq('id', socialiteId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      // Broad invalidation since we don't know which Sociale the deleted socialite belonged to
      void queryClient.invalidateQueries({ queryKey: ['socialites'] });
      void queryClient.invalidateQueries({ queryKey: ['socialite'] });
    },
  });
}

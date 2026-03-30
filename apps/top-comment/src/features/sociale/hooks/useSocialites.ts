// =============================================================================
// SOCIALITES DATA HOOK
// =============================================================================
// Hook for fetching and managing Socialite data.

import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';
import type { Socialite, JoinSocialeRequest } from '../../domain/types/sociale.types';
import { mapSocialite } from '../socialeService';

/**
 * Hook for fetching Socialites by Sociale
 */
export function useSocialites(socialeId?: string) {
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
  return useQuery({
    queryKey: ['socialite', socialeId, userId],
    queryFn: async () => {
      if (!socialeId || !userId) return null;
      
      const { data, error } = await supabase
        .from('socialites')
        .select('*')
        .eq('sociale_id', socialeId)
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
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
      // For now, create directly via Supabase
      // In production, this should use an Edge Function
      const { data, error } = await (supabase as any)
        .from('socialites')
        .insert({
          sociale_id: request.socialeId,
          room_id: request.roomId, // Add room_id
          user_id: request.userId,
          display_name: request.displayName,
          mascot_id: request.mascotId,
          is_host: request.isHost ?? false,
          is_active: true,
          is_banned: false,
          score: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return mapSocialite(data);
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

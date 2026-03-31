// =============================================================================
// SOCIALE RESPONSES DATA HOOK
// =============================================================================
// Hook for fetching and managing Sociale response data.

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';
import type { SocialeResponse, SubmitSocialeResponseRequest } from '../../domain/types/sociale.types';
import { mapSocialeResponse, submitSocialeResponse } from '../socialeService';

/**
 * Hook for fetching responses by Sociale
 */
export function useSocialeResponses(socialeId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socialeId) return;

    const channel = supabase
      .channel(`sociale-responses:${socialeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sociale_responses', filter: `sociale_id=eq.${socialeId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['sociale-responses', socialeId] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [socialeId, queryClient]);

  return useQuery({
    queryKey: ['sociale-responses', socialeId],
    queryFn: async () => {
      if (!socialeId) return [];
      
      const { data, error } = await supabase
        .from('sociale_responses')
        .select('*')
        .eq('sociale_id', socialeId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data.map(mapSocialeResponse).filter(Boolean) as SocialeResponse[];
    },
    enabled: !!socialeId,
  });
}

/**
 * Hook for fetching responses by round
 */
export function useRoundResponses(socialeId?: string, roundId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socialeId || !roundId) return;

    const channel = supabase
      .channel(`sociale-responses:${socialeId}:${roundId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sociale_responses', filter: `round_id=eq.${roundId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['sociale-responses', socialeId, roundId] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [socialeId, roundId, queryClient]);

  return useQuery({
    queryKey: ['sociale-responses', socialeId, roundId],
    queryFn: async () => {
      if (!socialeId || !roundId) return [];
      
      const { data, error } = await supabase
        .from('sociale_responses')
        .select('*')
        .eq('sociale_id', socialeId)
        .eq('round_id', roundId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      const mapped = data.map(mapSocialeResponse).filter(Boolean) as SocialeResponse[];

      // Ensure at most one response per socialite per round by keeping the
      // latest-created response for each socialiteId.
      const latestBySocialiteId = new Map<string, SocialeResponse>();
      for (const response of mapped) {
        latestBySocialiteId.set(response.socialiteId, response);
      }
      return Array.from(latestBySocialiteId.values());
    },
    enabled: !!socialeId && !!roundId,
  });
}

/**
 * Hook for fetching current user's responses
 */
export function useMyResponses(socialeId?: string, socialiteId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socialeId || !socialiteId) return;

    const channel = supabase
      .channel(`sociale-responses:${socialeId}:me:${socialiteId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sociale_responses', filter: `socialite_id=eq.${socialiteId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['sociale-responses', socialeId, socialiteId] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [socialeId, socialiteId, queryClient]);

  return useQuery({
    queryKey: ['sociale-responses', socialeId, socialiteId],
    queryFn: async () => {
      if (!socialeId || !socialiteId) return [];
      
      const { data, error } = await supabase
        .from('sociale_responses')
        .select('*')
        .eq('sociale_id', socialeId)
        .eq('socialite_id', socialiteId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      const mapped = data.map(mapSocialeResponse).filter(Boolean) as SocialeResponse[];
      // Keep only the latest response for this player (if they somehow have more).
      return mapped.length <= 1
        ? mapped
        : [mapped[mapped.length - 1]];
    },
    enabled: !!socialeId && !!socialiteId,
  });
}

/**
 * Hook for submitting a response
 */
export function useSubmitResponse() {
  return useMutation({
    mutationFn: async (request: SubmitSocialeResponseRequest) => {
      // Use edge function for phase validation + server-side upsert behavior.
      return submitSocialeResponse(request);
    },
  });
}

/**
 * Hook for updating a response
 */
export function useUpdateResponse() {
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SocialeResponse> }) => {
      const { data, error } = await supabase
        .from('sociale_responses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return mapSocialeResponse(data);
    },
  });
}

/**
 * Hook for deleting a response
 */
export function useDeleteResponse() {
  return useMutation({
    mutationFn: async (responseId: string) => {
      const { error } = await supabase
        .from('sociale_responses')
        .delete()
        .eq('id', responseId);
      
      if (error) throw error;
      return true;
    },
  });
}

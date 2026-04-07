// =============================================================================
// SOCIALE RESPONSES DATA HOOK
// =============================================================================
// Hook for fetching and managing Sociale response data.

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';
import type { SocialeResponse, SubmitSocialeResponseRequest } from '../../../domain/types/sociale.types';
import { mapSocialeResponse, submitSocialeResponse } from '../socialeService';
import { useSocialeChannel } from './useSocialeChannel';

/**
 * Hook for fetching responses by Sociale
 */
export function useSocialeResponses(socialeId?: string) {
  const queryClient = useQueryClient();

  // Use unified sociale channel instead of dedicated responses channel
  const onPayload = useCallback((payload: any) => {
    if (payload?.table === 'sociale_responses') {
      void queryClient.invalidateQueries({ queryKey: ['sociale-responses', socialeId] });
    }
  }, [socialeId, queryClient]);

  useSocialeChannel(socialeId, onPayload);

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

  // Use unified sociale channel — filters by table + roundId in callback
  const onPayload = useCallback((payload: any) => {
    if (payload?.table === 'sociale_responses' && roundId) {
      const record = payload.new || payload.old;
      if (record?.round_id === roundId) {
        void queryClient.invalidateQueries({ queryKey: ['sociale-responses', socialeId, roundId] });
      }
    }
  }, [socialeId, roundId, queryClient]);

  useSocialeChannel(socialeId, onPayload);

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

  // Use unified sociale channel — filters by table + socialiteId in callback
  const onPayload = useCallback((payload: any) => {
    if (payload?.table === 'sociale_responses' && socialiteId) {
      const record = payload.new || payload.old;
      if (record?.socialite_id === socialiteId) {
        void queryClient.invalidateQueries({ queryKey: ['sociale-responses', socialeId, socialiteId] });
      }
    }
  }, [socialeId, socialiteId, queryClient]);

  useSocialeChannel(socialeId, onPayload);

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
      // Convert the domain type to database-compatible updates
      const dbUpdates = {
        ...updates,
        // Convert value to JSONB-compatible format if present
        ...(updates.value !== undefined && { 
          value: updates.value as any // Cast to any to bypass TypeScript Json type checking
        })
      };
      
      const { data, error } = await supabase
        .from('sociale_responses')
        .update(dbUpdates)
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

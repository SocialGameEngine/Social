// =============================================================================
// SOCIALE RESPONSES DATA HOOK
// =============================================================================
// Hook for fetching and managing Sociale response data.

import { useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';
import type { SocialeResponse, SubmitSocialeResponseRequest } from '../../../domain/types/sociale.types';
import { mapSocialeResponse, submitSocialeResponse } from '../socialeService';
import { useSocialeChannel } from './useSocialeChannel';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { handleSupabaseError } from '../../../shared/utils/handleAsyncError';
import { logger } from '../../../shared/utils/logger';

/**
 * Hook for fetching responses by Sociale
 */
export function useSocialeResponses(socialeId?: string) {
  const queryClient = useQueryClient();

  // Use unified sociale channel instead of dedicated responses channel
  const onPayload = useCallback((payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
    if (payload?.table === 'sociale_responses') {
      void queryClient.invalidateQueries({ queryKey: ['sociale-responses', socialeId] });
    }
  }, [socialeId, queryClient]);

  const onPayloadRef = useRef(onPayload);
  onPayloadRef.current = onPayload;

  const stableCallback = useCallback((payload: any) => {
    onPayloadRef.current(payload);
  }, []);

  useSocialeChannel(socialeId, stableCallback);

  return useQuery({
    queryKey: ['sociale-responses', socialeId],
    queryFn: async () => {
      if (!socialeId) return [];
      
      const { data, error } = await supabase
        .from('sociale_responses')
        .select('*')
        .eq('sociale_id', socialeId)
        .order('created_at', { ascending: true });
      
      if (error) {
        if (error.code === 'PGRST116') return [];
        throw error;
      }
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
  const onPayload = useCallback((payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
    if (payload?.table === 'sociale_responses' && roundId) {
      const record = (payload.new || payload.old) as Record<string, unknown> | undefined;
      if (record && record.round_id === roundId) {
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
      
      if (error) {
        if (error.code === 'PGRST116') return [];
        throw error;
      }
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
  const onPayload = useCallback((payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
    if (payload?.table === 'sociale_responses' && socialiteId) {
      const record = (payload.new || payload.old) as Record<string, unknown> | undefined;
      if (record && record.socialite_id === socialiteId) {
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
      
      if (error) {
        if (error.code === 'PGRST116') return [];
        throw error;
      }
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
export function useSubmitResponse(socialeId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: SubmitSocialeResponseRequest) => {
      return submitSocialeResponse(request);
    },

    onMutate: async (newResponse) => {
      const queryKey = ['sociale-responses', socialeId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SocialeResponse[]>(queryKey);

      queryClient.setQueryData<SocialeResponse[]>(queryKey, (old = []) => [
        ...old,
        {
          id: `temp-${Date.now()}`,
          socialeId: newResponse.socialeId,
          roundId: newResponse.roundId,
          socialiteId: newResponse.socialiteId,
          type: newResponse.type,
          value: newResponse.value,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as SocialeResponse,
      ]);

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['sociale-responses', socialeId], context.previous);
      }
      logger.error('Failed to submit response', { error: _err instanceof Error ? _err.message : String(_err) });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['sociale-responses', socialeId] });
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
      const dbUpdates: Record<string, unknown> = {
        ...updates,
      };
      
      const { data, error } = await supabase
        .from('sociale_responses')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        handleSupabaseError(error, { context: 'updateResponse', rethrow: true });
      }
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
      
      if (error) {
        if (error.code === 'PGRST116') return true;
        throw error;
      }
      return true;
    },
    onError: (error) => {
      logger.error('Failed to delete response', { error: error instanceof Error ? error.message : String(error) });
    },
  });
}

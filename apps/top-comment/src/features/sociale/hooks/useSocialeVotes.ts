// =============================================================================
// SOCIALE VOTES DATA HOOK
// =============================================================================
// Hook for fetching and managing Sociale vote data.

import { useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../../../supabase/client';
import type { SocialeVote, SubmitSocialeVoteRequest } from '../../../domain/types/sociale.types';
import { mapSocialeVote } from '../socialeService';
import { useSocialeChannel } from './useSocialeChannel';
import { logger } from '../../../shared/utils/logger';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Hook for fetching votes by Sociale
 */
export function useSocialeVotes(socialeId?: string) {
  const queryClient = useQueryClient();

  // Use unified sociale channel instead of dedicated votes channel
  const onPayload = useCallback((payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
    if (payload?.table === 'sociale_votes') {
      void queryClient.invalidateQueries({ queryKey: ['sociale-votes', socialeId] });
    }
  }, [socialeId, queryClient]);

  const onPayloadRef = useRef(onPayload);
  onPayloadRef.current = onPayload;

  const stableCallback = useCallback((payload: any) => {
    onPayloadRef.current(payload);
  }, []);

  useSocialeChannel(socialeId, stableCallback);

  return useQuery({
    queryKey: ['sociale-votes', socialeId],
    queryFn: async () => {
      if (!socialeId) return [];
      
      const { data, error } = await supabase
        .from('sociale_votes')
        .select('*')
        .eq('sociale_id', socialeId)
        .order('created_at', { ascending: true });
      
      if (error) {
        if (error.code === 'PGRST116') return [];
        throw error;
      }
      return data.map(mapSocialeVote).filter(Boolean) as SocialeVote[];
    },
    enabled: !!socialeId,
  });
}

/**
 * Hook for fetching votes by round
 */
export function useRoundVotes(socialeId?: string, roundId?: string) {
  const queryClient = useQueryClient();

  // Use unified sociale channel — filters by table + roundId in callback
  const onPayload = useCallback((payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
    if (payload?.table === 'sociale_votes' && roundId) {
      const record = payload.new || payload.old;
      if ((record as any)?.round_id === roundId) {
        void queryClient.invalidateQueries({ queryKey: ['sociale-votes', socialeId, roundId] });
      }
    }
  }, [socialeId, roundId, queryClient]);

  useSocialeChannel(socialeId, onPayload);

  return useQuery({
    queryKey: ['sociale-votes', socialeId, roundId],
    queryFn: async () => {
      if (!socialeId || !roundId) return [];
      
      const { data, error } = await supabase
        .from('sociale_votes')
        .select('*')
        .eq('sociale_id', socialeId)
        .eq('round_id', roundId)
        .order('created_at', { ascending: true });
      
      if (error) {
        if (error.code === 'PGRST116') return [];
        throw error;
      }
      return data.map(mapSocialeVote).filter(Boolean) as SocialeVote[];
    },
    enabled: !!socialeId && !!roundId,
  });
}

/**
 * Hook for fetching current user's votes
 */
export function useMyVotes(socialeId?: string, socialiteId?: string) {
  const queryClient = useQueryClient();

  // Use unified sociale channel — filters by table + socialiteId in callback
  const onPayload = useCallback((payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
    if (payload?.table === 'sociale_votes' && socialiteId) {
      const record = payload.new || payload.old;
      if ((record as any)?.socialite_id === socialiteId) {
        void queryClient.invalidateQueries({ queryKey: ['sociale-votes', socialeId, socialiteId] });
      }
    }
  }, [socialeId, socialiteId, queryClient]);

  useSocialeChannel(socialeId, onPayload);

  return useQuery({
    queryKey: ['sociale-votes', socialeId, socialiteId],
    queryFn: async () => {
      if (!socialeId || !socialiteId) return [];
      
      const { data, error } = await supabase
        .from('sociale_votes')
        .select('*')
        .eq('sociale_id', socialeId)
        .eq('socialite_id', socialiteId)
        .order('created_at', { ascending: true });
      
      if (error) {
        if (error.code === 'PGRST116') return [];
        throw error;
      }
      return data.map(mapSocialeVote).filter(Boolean) as SocialeVote[];
    },
    enabled: !!socialeId && !!socialiteId,
  });
}

/**
 * Hook for submitting a vote
 */
export function useSubmitVote(socialeId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: SubmitSocialeVoteRequest) => {
      // Use the existing Edge Function which has proper RLS permissions
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${supabaseUrl}/functions/v1/sociales-submit-vote`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to submit vote' }));
        throw new Error(errorData.error || errorData.error || 'Failed to submit vote');
      }
      
      const result = await response.json();
      return result.vote; // Return the vote object from Edge Function response
    },

    onMutate: async (newVote) => {
      const queryKey = ['sociale-votes', socialeId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SocialeVote[]>(queryKey);

      queryClient.setQueryData<SocialeVote[]>(queryKey, (old = []) => [
        ...old,
        {
          id: `temp-${Date.now()}`,
          socialeId: newVote.socialeId,
          roundId: newVote.roundId,
          socialiteId: newVote.socialiteId,
          targetResponseId: newVote.targetResponseId,
          createdAt: new Date().toISOString(),
        } as SocialeVote,
      ]);

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['sociale-votes', socialeId], context.previous);
      }
      logger.error('Vote submission failed', { error: _err instanceof Error ? _err.message : String(_err) });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['sociale-votes', socialeId] });
    },
  });
}

/**
 * Hook for updating a vote
 */
export function useUpdateVote() {
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SocialeVote> }) => {
      const { data, error } = await supabase
        .from('sociale_votes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return mapSocialeVote(data);
    },
    onError: (error) => {
      logger.error('Vote mutation failed', { error: error instanceof Error ? error.message : String(error) });
    },
  });
}

/**
 * Hook for deleting a vote
 */
export function useDeleteVote() {
  return useMutation({
    mutationFn: async (voteId: string) => {
      const { error } = await supabase
        .from('sociale_votes')
        .delete()
        .eq('id', voteId);
      
      if (error) {
        if (error.code === 'PGRST116') return true;
        throw error;
      }
      return true;
    },
    onError: (error) => {
      logger.error('Vote mutation failed', { error: error instanceof Error ? error.message : String(error) });
    },
  });
}

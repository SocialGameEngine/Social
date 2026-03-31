// =============================================================================
// SOCIALE VOTES DATA HOOK
// =============================================================================
// Hook for fetching and managing Sociale vote data.

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';
import type { SocialeVote, SubmitSocialeVoteRequest } from '../../domain/types/sociale.types';
import { mapSocialeVote } from '../socialeService';

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

  useEffect(() => {
    if (!socialeId) return;

    const channel = supabase
      .channel(`sociale-votes:${socialeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sociale_votes', filter: `sociale_id=eq.${socialeId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['sociale-votes', socialeId] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [socialeId, queryClient]);

  return useQuery({
    queryKey: ['sociale-votes', socialeId],
    queryFn: async () => {
      if (!socialeId) return [];
      
      const { data, error } = await supabase
        .from('sociale_votes')
        .select('*')
        .eq('sociale_id', socialeId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
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

  useEffect(() => {
    if (!socialeId || !roundId) return;

    const channel = supabase
      .channel(`sociale-votes:${socialeId}:${roundId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sociale_votes', filter: `round_id=eq.${roundId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['sociale-votes', socialeId, roundId] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [socialeId, roundId, queryClient]);

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
      
      if (error) throw error;
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

  useEffect(() => {
    if (!socialeId || !socialiteId) return;

    const channel = supabase
      .channel(`sociale-votes:${socialeId}:me:${socialiteId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sociale_votes', filter: `socialite_id=eq.${socialiteId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['sociale-votes', socialeId, socialiteId] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [socialeId, socialiteId, queryClient]);

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
      
      if (error) throw error;
      return data.map(mapSocialeVote).filter(Boolean) as SocialeVote[];
    },
    enabled: !!socialeId && !!socialiteId,
  });
}

/**
 * Hook for submitting a vote
 */
export function useSubmitVote() {
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
      
      if (error) throw error;
      return mapSocialeVote(data);
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
      
      if (error) throw error;
      return true;
    },
  });
}

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';
import type { 
  SocialeBanter, 
  SocialeBanterUpvote,
  SubmitSocialeBanterRequest,
  SubmitSocialeBanterUpvoteRequest,
  ModerateSocialeBanterRequest 
} from '../../../domain/types/sociale.types';

// =============================================================================
// QUERY KEYS
// =============================================================================

export const banterQueryKeys = {
  all: ['sociale-banter'] as const,
  forSociale: (socialeId: string) => [...banterQueryKeys.all, socialeId] as const,
  forSocialeWithStatus: (socialeId: string, status?: string) => 
    [...banterQueryKeys.forSociale(socialeId), status] as const,
  upvotes: (banterId: string) => [...banterQueryKeys.all, 'upvotes', banterId] as const,
  userUpvotes: (socialiteId: string) => [...banterQueryKeys.all, 'user-upvotes', socialiteId] as const,
};

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook for fetching banter messages for a Sociale
 */
export function useSocialeBanter(socialeId?: string, status?: string) {
  return useQuery({
    queryKey: banterQueryKeys.forSocialeWithStatus(socialeId || '', status),
    queryFn: async () => {
      if (!socialeId) return [];
      
      let query = supabase
        .from('sociale_banter')
        .select('*')
        .eq('sociale_id', socialeId)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as unknown as SocialeBanter[];
    },
    enabled: !!socialeId,
  });
}

/**
 * Hook for fetching approved banter messages (for display)
 */
export function useApprovedSocialeBanter(socialeId?: string) {
  return useSocialeBanter(socialeId, 'approved');
}

/**
 * Hook for fetching pending banter messages (for moderation)
 */
export function usePendingSocialeBanter(socialeId?: string) {
  return useSocialeBanter(socialeId, 'pending');
}

/**
 * Hook for fetching user's upvoted banter messages
 */
export function useUserBanterUpvotes(socialiteId?: string) {
  return useQuery({
    queryKey: banterQueryKeys.userUpvotes(socialiteId || ''),
    queryFn: async () => {
      if (!socialiteId) return [];
      
      const { data, error } = await supabase
        .from('sociale_banter_upvotes')
        .select('*')
        .eq('socialite_id', socialiteId);
      
      if (error) throw error;
      return data as unknown as SocialeBanterUpvote[];
    },
    enabled: !!socialiteId,
  });
}

/**
 * Hook for checking if user has upvoted a specific banter message
 */
export function useBanterUpvoteStatus(banterId?: string, socialiteId?: string) {
  const { data: userUpvotes = [] } = useUserBanterUpvotes(socialiteId);
  
  return useMemo(() => {
    if (!banterId) return false;
    return userUpvotes.some(upvote => upvote.banterId === banterId);
  }, [banterId, userUpvotes]);
}

/**
 * Hook for submitting a banter message
 */
export function useSubmitBanter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: SubmitSocialeBanterRequest): Promise<SocialeBanter> => {
      const { data, error } = await supabase
        .from('sociale_banter')
        .insert({
          sociale_id: request.socialeId,
          socialite_id: request.socialiteId,
          membership_id: request.membershipId,
          display_name: request.displayName,
          content: request.content,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as SocialeBanter;
    },

    onMutate: async (newBanter) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: banterQueryKeys.forSociale(newBanter.socialeId) });

      // Snapshot the previous value
      const previousBanter = queryClient.getQueryData<SocialeBanter[]>(
        banterQueryKeys.forSociale(newBanter.socialeId)
      );

      // Optimistically update to the new value
      const optimisticBanter: SocialeBanter = {
        id: `temp-${Date.now()}`,
        socialeId: newBanter.socialeId,
        socialiteId: newBanter.socialiteId,
        membershipId: newBanter.membershipId,
        displayName: newBanter.displayName,
        content: newBanter.content,
        status: 'pending',
        upvoteCount: 0,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<SocialeBanter[]>(
        banterQueryKeys.forSociale(newBanter.socialeId),
        (old = []) => [optimisticBanter, ...old]
      );

      return { previousBanter };
    },

    onError: (err, newBanter, context) => {
      // If the mutation fails, roll back to the previous value
      if (context?.previousBanter) {
        queryClient.setQueryData(
          banterQueryKeys.forSociale(newBanter.socialeId),
          context.previousBanter
        );
      }
    },

    onSettled: (newBanter) => {
      // Refetch to ensure server state
      if (newBanter) {
        queryClient.invalidateQueries({ queryKey: banterQueryKeys.forSociale(newBanter.socialeId) });
      }
    },
  });
}

/**
 * Hook for upvoting a banter message
 */
export function useUpvoteBanter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: SubmitSocialeBanterUpvoteRequest): Promise<void> => {
      const { error } = await supabase
        .from('sociale_banter_upvotes')
        .insert({
          banter_id: request.banterId,
          socialite_id: request.socialiteId,
        });

      if (error) throw error;
    },

    onMutate: async (request) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: banterQueryKeys.all });

      // Get current banter data to update optimistically
      const currentBanter = queryClient.getQueryData<SocialeBanter[]>(
        banterQueryKeys.forSociale('')
      );

      // Find and update the specific banter message
      if (currentBanter) {
        const updatedBanter = currentBanter.map(banter => 
          banter.id === request.banterId 
            ? { ...banter, upvoteCount: banter.upvoteCount + 1 }
            : banter
        );

        // Update all relevant queries
        queryClient.setQueryData(banterQueryKeys.forSociale(''), updatedBanter);
        queryClient.setQueryData(banterQueryKeys.forSocialeWithStatus('', 'approved'), updatedBanter);
      }

      // Add to user's upvotes
      const currentUpvotes = queryClient.getQueryData<SocialeBanterUpvote[]>(
        banterQueryKeys.userUpvotes(request.socialiteId)
      ) || [];

      queryClient.setQueryData(
        banterQueryKeys.userUpvotes(request.socialiteId),
        [...currentUpvotes, {
          banterId: request.banterId,
          socialiteId: request.socialiteId,
          createdAt: new Date().toISOString(),
        }]
      );
    },

    onError: (err, request, context) => {
      // Rollback on error
      queryClient.invalidateQueries({ queryKey: banterQueryKeys.all });
    },

    onSettled: () => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: banterQueryKeys.all });
    },
  });
}

/**
 * Hook for removing an upvote from a banter message
 */
export function useRemoveBanterUpvote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ banterId, socialiteId }: { banterId: string; socialiteId: string }): Promise<void> => {
      const { error } = await supabase
        .from('sociale_banter_upvotes')
        .delete()
        .eq('banter_id', banterId)
        .eq('socialite_id', socialiteId);

      if (error) throw error;
    },

    onMutate: async ({ banterId, socialiteId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: banterQueryKeys.all });

      // Get current banter data to update optimistically
      const currentBanter = queryClient.getQueryData<SocialeBanter[]>(
        banterQueryKeys.forSociale('')
      );

      // Find and update the specific banter message
      if (currentBanter) {
        const updatedBanter = currentBanter.map(banter => 
          banter.id === banterId 
            ? { ...banter, upvoteCount: Math.max(0, banter.upvoteCount - 1) }
            : banter
        );

        // Update all relevant queries
        queryClient.setQueryData(banterQueryKeys.forSociale(''), updatedBanter);
        queryClient.setQueryData(banterQueryKeys.forSocialeWithStatus('', 'approved'), updatedBanter);
      }

      // Remove from user's upvotes
      const currentUpvotes = queryClient.getQueryData<SocialeBanterUpvote[]>(
        banterQueryKeys.userUpvotes(socialiteId)
      ) || [];

      queryClient.setQueryData(
        banterQueryKeys.userUpvotes(socialiteId),
        currentUpvotes.filter(upvote => upvote.banterId !== banterId)
      );
    },

    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.invalidateQueries({ queryKey: banterQueryKeys.all });
    },

    onSettled: () => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: banterQueryKeys.all });
    },
  });
}

/**
 * Hook for host moderation of banter messages
 */
export function useModerateBanter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ModerateSocialeBanterRequest): Promise<SocialeBanter> => {
      const { data, error } = await supabase
        .from('sociale_banter')
        .update({
          status: request.status,
          moderated_at: new Date().toISOString(),
          moderated_by: request.moderatedBy,
        })
        .eq('id', request.banterId)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as SocialeBanter;
    },

    onSettled: (updatedBanter) => {
      // Refetch all banter queries to reflect moderation changes
      queryClient.invalidateQueries({ queryKey: banterQueryKeys.forSociale('') });
      queryClient.invalidateQueries({ queryKey: banterQueryKeys.forSocialeWithStatus('', 'pending') });
      queryClient.invalidateQueries({ queryKey: banterQueryKeys.forSocialeWithStatus('', 'approved') });
    },
  });
}

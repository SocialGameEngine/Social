/**
 * Optimistic Vote Submission Hook
 * 
 * Provides optimistic UI for vote submissions with automatic rollback on error.
 * Immediately highlights the voted answer before server confirmation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitVote } from '../../features/session/sessionService';
import type { Vote, SubmitVoteRequest } from '../../shared/types';
import { useToast } from '../../shared/hooks/useToast';

interface OptimisticVote extends Vote {
  isPending?: boolean;
}

export function useOptimisticVote(sessionId: string, roundIndex: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (request: SubmitVoteRequest) => submitVote(request),
    
    // Optimistic update: Add vote immediately
    onMutate: async (newVote: SubmitVoteRequest) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: ['votes', sessionId, roundIndex] 
      });

      // Snapshot the previous value
      const previousVotes = queryClient.getQueryData<Vote[]>([
        'votes',
        sessionId,
        roundIndex,
      ]);

      // Optimistically update to the new value
      const optimisticVote: OptimisticVote = {
        id: `temp-${Date.now()}`,
        voterId: newVote.voterId,
        roundIndex: newVote.roundIndex,
        groupId: newVote.groupId || 'g0',
        answerId: newVote.answerId,
        createdAt: new Date().toISOString(),
        isPending: true, // Mark as pending
      };

      queryClient.setQueryData<Vote[]>(
        ['votes', sessionId, roundIndex],
        (old = []) => [...old, optimisticVote]
      );

      // Return context with previous value for rollback
      return { previousVotes };
    },

    // Rollback on error
    onError: (err, newVote, context) => {
      // Restore previous votes
      if (context?.previousVotes) {
        queryClient.setQueryData(
          ['votes', sessionId, roundIndex],
          context.previousVotes
        );
      }

      // Show error toast
      toast({
        title: "Vote didn't count",
        description: "Please try voting again",
        variant: "destructive",
      });
    },

    // Refetch on success to get server data
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ 
        queryKey: ['votes', sessionId, roundIndex] 
      });

      // Show subtle success feedback (optional - votes are usually silent)
      // toast({
      //   title: "Vote recorded!",
      //   variant: "default",
      // });
    },
  });

  return {
    submitVote: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

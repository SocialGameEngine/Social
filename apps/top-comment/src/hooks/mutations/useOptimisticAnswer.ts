/**
 * Optimistic Answer Submission Hook
 * 
 * Provides optimistic UI for answer submissions with automatic rollback on error.
 * Uses React Query's mutation hooks with optimistic updates.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitAnswer } from '../../features/session/sessionService';
import type { Answer, SubmitAnswerRequest } from '../../shared/types';
import { useToast } from '../../shared/hooks/useToast';

interface OptimisticAnswer extends Answer {
  isPending?: boolean;
}

export function useOptimisticAnswer(sessionId: string, roundIndex: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (request: SubmitAnswerRequest) => submitAnswer(request),
    
    // Optimistic update: Add answer immediately
    onMutate: async (newAnswer: SubmitAnswerRequest) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: ['answers', sessionId, roundIndex] 
      });

      // Snapshot the previous value
      const previousAnswers = queryClient.getQueryData<Answer[]>([
        'answers',
        sessionId,
        roundIndex,
      ]);

      // Optimistically update to the new value
      const optimisticAnswer: OptimisticAnswer = {
        id: `temp-${Date.now()}`,
        membershipId: newAnswer.membershipId,
        roundIndex: newAnswer.roundIndex,
        text: newAnswer.text,
        createdAt: new Date().toISOString(),
        masked: false,
        groupId: newAnswer.groupId || 'g0',
        isPending: true, // Mark as pending
      };

      queryClient.setQueryData<Answer[]>(
        ['answers', sessionId, roundIndex],
        (old = []) => [...old, optimisticAnswer]
      );

      // Return context with previous value for rollback
      return { previousAnswers };
    },

    // Rollback on error
    onError: (err, newAnswer, context) => {
      // Restore previous answers
      if (context?.previousAnswers) {
        queryClient.setQueryData(
          ['answers', sessionId, roundIndex],
          context.previousAnswers
        );
      }

      // Show error toast
      toast({
        title: "Couldn't submit answer",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    },

    // Refetch on success to get server data
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ 
        queryKey: ['answers', sessionId, roundIndex] 
      });

      // Show success toast
      toast({
        title: "Answer submitted!",
        description: "Your answer has been recorded",
        variant: "default",
      });
    },
  });

  return {
    submitAnswer: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

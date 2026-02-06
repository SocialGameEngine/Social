import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { interactionService } from '../services/interactionService';
import type { InteractionResponse } from '../shared/types';

interface UseResponsesOptions {
  interactionId?: string;
}

export function useResponses({ interactionId }: UseResponsesOptions) {
  const [responses, setResponses] = useState<InteractionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!interactionId) return;
    try {
      const data = await interactionService.getResponses(interactionId);
      setResponses(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load responses');
    }
  }, [interactionId]);

  // Initial load
  useEffect(() => {
    if (!interactionId) {
      setResponses([]);
      return;
    }
    setIsLoading(true);
    refresh().finally(() => setIsLoading(false));
  }, [interactionId, refresh]);

  // Real-time subscription
  useEffect(() => {
    if (!interactionId) return;

    const channel = supabase
      .channel(`responses:${interactionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'responses',
          filter: `interaction_id=eq.${interactionId}`,
        },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [interactionId, refresh]);

  // Actions
  const submitResponse = useCallback(
    async (membershipId: string, text: string) => {
      if (!interactionId) throw new Error('No interaction ID');
      const response = await interactionService.submitResponse(interactionId, membershipId, text);
      // Optimistic: add/update in list
      setResponses((prev) => {
        const existing = prev.findIndex((r) => r.membershipId === membershipId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = response;
          return updated;
        }
        return [...prev, response];
      });
      return response;
    },
    [interactionId]
  );

  return {
    responses,
    isLoading,
    error,
    submitResponse,
    refresh,
  };
}

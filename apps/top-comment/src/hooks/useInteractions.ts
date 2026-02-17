import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { interactionService } from '../services/interactionService';
import type { Interaction } from '../shared/types';

interface UseInteractionsOptions {
  roomId?: string;
}

export function useInteractions({ roomId }: UseInteractionsOptions) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!roomId) return;
    try {
      const data = await interactionService.getAllInteractions(roomId);
      // Filter out closed interactions - show active/voting/results interactions to all users
      const activeInteractions = data.filter(interaction => interaction.status !== 'closed');
      setInteractions(activeInteractions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load interactions');
    }
  }, [roomId]);

  // Initial load
  useEffect(() => {
    if (!roomId) {
      setInteractions([]);
      return;
    }
    setIsLoading(true);
    refresh().finally(() => setIsLoading(false));
  }, [roomId, refresh]);

  // Real-time subscription on interactions table (new prompts, status changes)
  // AND responses table (response_count updates via trigger)
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`interactions:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interactions',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'responses',
        },
        () => {
          // A new response was submitted — refresh to get updated response_count
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, refresh]);

  // Actions
  const createInteraction = useCallback(
    async (question: string, description?: string) => {
      if (!roomId) throw new Error('No room ID');
      const interaction = await interactionService.createInteraction(roomId, question, description);
      // Optimistic: add to list immediately
      setInteractions((prev) => [interaction, ...prev]);
      return interaction;
    },
    [roomId]
  );

  const closeInteraction = useCallback(async (interactionId: string) => {
    await interactionService.closeInteraction(interactionId);
    // Optimistic: remove from active list
    setInteractions((prev) => prev.filter((i) => i.id !== interactionId));
  }, []);

  return {
    interactions,
    isLoading,
    error,
    createInteraction,
    closeInteraction,
    refresh,
  };
}

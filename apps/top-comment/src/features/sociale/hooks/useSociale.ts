// =============================================================================
// SOCIALE DATA HOOK
// =============================================================================
// Hook for fetching and managing Sociale data.

import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';
import type { Sociale, CreateSocialeRequest, UpdateSocialeRequest } from '../../../domain/types/sociale.types';
import { mapSociale, createSociale, updateSociale } from '../socialeService';
import { subscriptionPool } from '../../../shared/services/SubscriptionPool';

/**
 * Hook for fetching a single Sociale
 */
export function useSociale(socialeId?: string) {
  const queryClient = useQueryClient();

  // Keep a stable ref to queryClient so the effect only re-runs when socialeId changes.
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  useEffect(() => {
    if (!socialeId) return;

    // Use SubscriptionPool so that multiple callers (RoomPageContent,
    // RoomMainEventPanel, SocialeRoomPhaseController) all share ONE channel
    // instead of creating three competing channels with the same name.
    const unsub = subscriptionPool.subscribe(
      `sociale:${socialeId}`,
      [{ event: '*', schema: 'public', table: 'sociales', filter: `id=eq.${socialeId}` }],
      () => {
        void queryClientRef.current.invalidateQueries({ queryKey: ['sociale', socialeId] });
      },
    );

    // Catch-up fetch once the channel is confirmed SUBSCRIBED so we never
    // miss a status change (e.g. lobby → active) that fired during setup.
    // SubscriptionPool doesn't expose the SUBSCRIBED callback, so we do a
    // one-shot direct subscribe just for the status signal then clean it up.
    const catchUpChannel = supabase
      .channel(`sociale-catchup:${socialeId}`)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void queryClientRef.current.invalidateQueries({ queryKey: ['sociale', socialeId] });
          // Immediately tear down — its only job was the SUBSCRIBED signal.
          void catchUpChannel.unsubscribe();
          void supabase.removeChannel(catchUpChannel);
        }
      });

    return () => {
      unsub();
      // catchUpChannel cleans itself up on SUBSCRIBED; guard in case it never fired.
      void catchUpChannel.unsubscribe();
      void supabase.removeChannel(catchUpChannel);
    };
  }, [socialeId]);

  return useQuery({
    queryKey: ['sociale', socialeId],
    queryFn: async () => {
      if (!socialeId) return null;
      
      const { data, error } = await supabase
        .from('sociales')
        .select('*')
        .eq('id', socialeId)
        .single();
      
      if (error) {
        // Supabase/PostgREST returns HTTP 406 for `.single()` when there are 0 rows.
        // Treat that as "not found" so UI updates cleanly after deletes/ends.
        if (error.code === 'PGRST116' || /0 rows/i.test(error.message || '')) {
          return null;
        }
        throw error;
      }
      return data ? mapSociale(data) : null;
    },
    enabled: !!socialeId,
  });
}

/**
 * Hook for fetching Sociales by room
 */
export function useSocialesByRoom(roomId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`sociales-room:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sociales', filter: `room_id=eq.${roomId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['sociales', 'room', roomId] });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  return useQuery({
    queryKey: ['sociales', 'room', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      
      const { data, error } = await supabase
        .from('sociales')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data.map(mapSociale).filter((s): s is Sociale => s !== null);
    },
    enabled: !!roomId,
  });
}

/**
 * Hook for creating a Sociale
 */
export function useCreateSociale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: CreateSocialeRequest) => {
      const data = await createSociale(request);
      return data.sociale;
    },
    onSuccess: (sociale, request) => {
      // Invalidate Sociales list to include the newly created Sociale
      queryClient.invalidateQueries({ queryKey: ['sociales', 'room', request.roomId] });
      
      // Invalidate specific Sociale query
      queryClient.invalidateQueries({ queryKey: ['sociale', sociale.id] });
    },
  });
}

/**
 * Hook for updating a Sociale
 */
export function useUpdateSociale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: UpdateSocialeRequest) => {
      return await updateSociale(updates);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['sociale', variables.socialeId] });
      void queryClient.invalidateQueries({ queryKey: ['sociales-by-room'] });
    },
  });
}

/**
 * Hook for deleting a Sociale
 */
export function useDeleteSociale() {
  return useMutation({
    mutationFn: async (socialeId: string) => {
      const { error } = await supabase
        .from('sociales')
        .delete()
        .eq('id', socialeId);
      
      if (error) throw error;
      return true;
    },
  });
}

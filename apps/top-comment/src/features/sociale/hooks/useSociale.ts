// =============================================================================
// SOCIALE DATA HOOK
// =============================================================================
// Hook for fetching and managing Sociale data.

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';
import type { Sociale, CreateSocialeRequest, UpdateSocialeRequest } from '../../domain/types/sociale.types';
import { mapSociale, createSociale, updateSociale } from '../socialeService';

/**
 * Hook for fetching a single Sociale
 */
export function useSociale(socialeId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socialeId) return;

    const channel = supabase
      .channel(`sociale:${socialeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sociales', filter: `id=eq.${socialeId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['sociale', socialeId] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [socialeId, queryClient]);

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
      return data.map(mapSociale);
    },
    enabled: !!roomId,
  });
}

/**
 * Hook for creating a Sociale
 */
export function useCreateSociale() {
  return useMutation({
    mutationFn: async (request: CreateSocialeRequest) => {
      const data = await createSociale(request);
      return data.sociale;
    },
  });
}

/**
 * Hook for updating a Sociale
 */
export function useUpdateSociale() {
  return useMutation({
    mutationFn: async (updates: UpdateSocialeRequest) => {
      return await updateSociale(updates);
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

// =============================================================================
// SOCIALE DATA HOOK
// =============================================================================
// Hook for fetching and managing Sociale data.

import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';
import type { Sociale, CreateSocialeRequest, UpdateSocialeRequest } from '../../domain/types/sociale.types';
import { mapSociale } from '../socialeService';

/**
 * Hook for fetching a single Sociale
 */
export function useSociale(socialeId?: string) {
  return useQuery({
    queryKey: ['sociale', socialeId],
    queryFn: async () => {
      if (!socialeId) return null;
      
      const { data, error } = await supabase
        .from('sociales')
        .select('*')
        .eq('id', socialeId)
        .single();
      
      if (error) throw error;
      return data ? mapSociale(data) : null;
    },
    enabled: !!socialeId,
  });
}

/**
 * Hook for fetching Sociales by room
 */
export function useSocialesByRoom(roomId?: string) {
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
      // Use the Edge Function for proper authentication and validation
      const { data, error } = await supabase.functions.invoke('sociales-create', {
        body: request,
      });

      if (error) throw error;
      return data.sociale;
    },
  });
}

/**
 * Hook for updating a Sociale
 */
export function useUpdateSociale() {
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateSocialeRequest }) => {
      const { data, error } = await supabase
        .from('sociales')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return mapSociale(data);
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

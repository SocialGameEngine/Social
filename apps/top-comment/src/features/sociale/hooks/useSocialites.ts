// =============================================================================
// SOCIALITES DATA HOOK
// =============================================================================
// Hook for fetching and managing Socialite data.

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Socialite, JoinSocialeRequest } from '../../../domain/types/sociale.types';
import { mapSocialite, joinSociale } from '../socialeService';

/**
 * Internal helper for authenticated realtime subscription setup.
 * Centralizes auth sync and channel creation for consistency.
 */
async function setupAuthenticatedRealtimeSubscription({
  channelName,
  table,
  filter,
  onPayload,
  onStatus,
}: {
  channelName: string;
  table: string;
  filter: string;
  onPayload: (payload: any) => void;
  onStatus?: (status: string, err?: any) => void;
}): Promise<RealtimeChannel> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Explicitly sync auth before subscribing
  console.log('🔥 Setting up realtime subscription:', {
    channelName,
    table,
    hasSession: !!session,
    sessionUserId: session?.user?.id,
  });

  // Explicitly set auth for realtime before subscribing
  if (session?.access_token) {
    console.log('🔥 Setting realtime auth token');
    await supabase.realtime.setAuth(session.access_token);
  }

  return supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter,
      },
      onPayload
    )
    .subscribe((status, err) => {
      console.log(`${channelName} subscription status:`, status, err);
      onStatus?.(status, err);
    });
}

/**
 * Hook for fetching Socialites by Sociale
 */
export function useSocialites(socialeId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socialeId) return;

    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    async function setupRealtime() {
      if (cancelled) return;

      const channelName = `socialites:${socialeId}:${crypto.randomUUID()}`;

      channel = await setupAuthenticatedRealtimeSubscription({
        channelName,
        table: 'socialites',
        filter: `sociale_id=eq.${socialeId}`,
        onPayload: (payload) => {
          // Debug logging - can be removed in production
          console.log('🔥 Socialites realtime payload:', {
            eventType: payload.eventType,
            oldRecord: payload.oldRecord?.user_id,
            newRecord: payload.newRecord?.user_id,
          });

          // Always invalidate the socialites list for this Sociale
          void queryClient.invalidateQueries({ queryKey: ['socialites', socialeId] });

          // For precise invalidation of individual socialite queries
          const userId = payload.eventType === 'DELETE' 
            ? payload.oldRecord?.user_id 
            : payload.newRecord?.user_id;
            
          if (userId) {
            void queryClient.invalidateQueries({ 
              queryKey: ['socialite', socialeId, userId] 
            });
          }
        },
        onStatus: (status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Socialites realtime subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Socialites realtime subscription failed:', err);
          } else {
            console.log('socialites subscription status:', status, err);
          }
        }
      });
    }

    void setupRealtime();

    return () => {
      cancelled = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [socialeId, queryClient]);

  return useQuery({
    queryKey: ['socialites', socialeId],
    queryFn: async () => {
      if (!socialeId) return [];
      
      const { data, error } = await supabase
        .from('socialites')
        .select('*')
        .eq('sociale_id', socialeId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data.map(mapSocialite).filter(Boolean) as Socialite[];
    },
    enabled: !!socialeId,
  });
}

/**
 * Hook for fetching current user's Socialite
 */
export function useCurrentSocialite(socialeId?: string, userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socialeId || !userId) return;

    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    async function setupRealtime() {
      if (cancelled) return;

      const channelName = `socialite:${socialeId}:${userId}:${crypto.randomUUID()}`;

      channel = await setupAuthenticatedRealtimeSubscription({
        channelName,
        table: 'socialites',
        filter: `sociale_id=eq.${socialeId}`,
        onPayload: (payload) => {
          // Debug logging - can be removed in production
          console.log('🔥 Current socialite realtime payload:', {
            eventType: payload.eventType,
            targetUserId: userId,
            payloadUserId: payload.eventType === 'DELETE' 
              ? payload.oldRecord?.user_id 
              : payload.newRecord?.user_id,
          });

          // Only invalidate if this payload affects the current user's socialite
          const payloadUserId = payload.eventType === 'DELETE' 
            ? payload.oldRecord?.user_id 
            : payload.newRecord?.user_id;

          if (payloadUserId === userId) {
            void queryClient.invalidateQueries({ 
              queryKey: ['socialite', socialeId, userId] 
            });
          }
        },
        onStatus: (status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Current socialite realtime subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Current socialite realtime subscription failed:', err);
          } else {
            console.log('current socialite subscription status:', status, err);
          }
        }
      });
    }

    void setupRealtime();

    return () => {
      cancelled = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [socialeId, userId, queryClient]);

  return useQuery({
    queryKey: ['socialite', socialeId, userId],
    queryFn: async () => {
      if (!socialeId || !userId) return null;
      
      const { data, error } = await supabase
        .from('socialites')
        .select('*')
        .eq('sociale_id', socialeId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data ? mapSocialite(data) : null;
    },
    enabled: !!socialeId && !!userId,
  });
}

/**
 * Hook for joining a Sociale
 */
export function useJoinSociale() {
  return useMutation({
    mutationFn: async (request: JoinSocialeRequest) => {
      const response = await joinSociale({
        socialeId: request.socialeId,
        roomId: request.roomId,
        userId: request.userId,
        displayName: request.displayName ?? 'Player',
        mascotId: request.mascotId,
        joinNextRound: request.joinNextRound ?? false,
      });

      return response.socialite;
    },
  });
}

/**
 * Hook for updating a Socialite
 */
export function useUpdateSocialite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Socialite> }) => {
      const { data, error } = await supabase
        .from('socialites')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return mapSocialite(data);
    },
    onSuccess: (updatedSocialite) => {
      // Precise invalidation for the updated socialite
      if (updatedSocialite?.userId) {
        void queryClient.invalidateQueries({ 
          queryKey: ['socialite', updatedSocialite.socialeId, updatedSocialite.userId] 
        });
      }
      
      // Also invalidate the socialites list for the Sociale
      if (updatedSocialite?.socialeId) {
        void queryClient.invalidateQueries({ queryKey: ['socialites', updatedSocialite.socialeId] });
      }
    },
  });
}

/**
 * Hook for leaving a Sociale
 */
export function useLeaveSociale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (socialiteId: string) => {
      const { error } = await supabase
        .from('socialites')
        .delete()
        .eq('id', socialiteId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      // Broad invalidation since we don't know which Sociale the deleted socialite belonged to
      void queryClient.invalidateQueries({ queryKey: ['socialites'] });
      void queryClient.invalidateQueries({ queryKey: ['socialite'] });
    },
  });
}

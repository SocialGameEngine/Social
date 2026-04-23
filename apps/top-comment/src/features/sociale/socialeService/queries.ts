// =============================================================================
// SOCIALE QUERIES
// =============================================================================
// Fetch operations for Sociale entities.

import { supabase } from '../../../supabase/client';
import type {
  Sociale,
  SocialeRound,
  SocialeRoundState,
  Socialite,
  SocialeResponse,
  SocialeVote,
  SocialeScoreboardEntry,
} from '../../../domain/types/sociale.types';
import {
  mapSociale,
  mapSocialeRound,
  mapSocialeRoundState,
  mapSocialite,
  mapSocialeResponse,
  mapSocialeVote,
} from './mappers';
import type { SocialeResponseRow, SocialeVoteRow } from './types';

/**
 * Fetch a Sociale by ID
 */
export async function fetchSociale(socialeId: string): Promise<Sociale | null> {
  const { data, error } = await supabase
    .from('sociales')
    .select('*')
    .eq('id', socialeId)
    .single();
  
  if (error) throw error;
  return mapSociale(data);
}

/**
 * Fetch all Sociales for a room
 */
export async function fetchSocialesForRoom(roomId: string): Promise<Sociale[]> {
  const { data, error } = await supabase
    .from('sociales')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data ?? []).map(mapSociale).filter((s): s is Sociale => s !== null);
}

/**
 * Fetch rounds for a Sociale.
 * Ambient sociales have no sociale_rounds rows — returns [] without querying.
 */
export async function fetchSocialeRounds(socialeId: string, mode?: string): Promise<SocialeRound[]> {
  if (mode === 'ambient') return [];

  const { data, error } = await supabase
    .from('sociale_rounds')
    .select('*')
    .eq('sociale_id', socialeId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapSocialeRound).filter((r): r is SocialeRound => r !== null);
}

/**
 * Fetch round state for a round
 */
export async function fetchSocialeRoundState(roundId: string): Promise<SocialeRoundState | null> {
  const { data, error } = await supabase
    .from('sociale_round_state')
    .select('*')
    .eq('round_id', roundId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return mapSocialeRoundState(data);
}

/**
 * Fetch socialites for a Sociale
 */
export async function fetchSocialites(socialeId: string): Promise<Socialite[]> {
  const { data, error } = await supabase
    .from('socialites')
    .select('*')
    .eq('sociale_id', socialeId)
    .eq('is_active', true)
    .order('score', { ascending: false });
  
  if (error) throw error;
  return (data ?? []).map(mapSocialite).filter((s): s is Socialite => s !== null);
}

/**
 * Fetch responses for a round
 */
export async function fetchSocialeResponses(roundId: string): Promise<SocialeResponse[]> {
  const { data, error } = await supabase
    .from('sociale_responses')
    .select('*')
    .eq('resolved_round_id', roundId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as SocialeResponseRow[] ?? []).map(mapSocialeResponse).filter((r): r is SocialeResponse => r !== null);
}

/**
 * Fetch votes for a round
 */
export async function fetchSocialeVotes(roundId: string): Promise<SocialeVote[]> {
  const { data, error } = await supabase
    .from('sociale_votes')
    .select('*')
    .eq('resolved_round_id', roundId);

  if (error) throw error;
  return (data as SocialeVoteRow[] ?? []).map(mapSocialeVote).filter((v): v is SocialeVote => v !== null);
}

/**
 * Fetch scoreboard for a Sociale
 */
export async function fetchSocialeScoreboard(socialeId: string): Promise<SocialeScoreboardEntry[]> {
  const { data, error } = await supabase
    .rpc('get_sociale_scoreboard', { p_sociale_id: socialeId });
  
  if (error) throw error;
  
  return (data ?? []).map((row: any) => ({
    socialiteId: row.socialite_id,
    displayName: row.display_name,
    mascotId: row.mascot_id,
    score: row.score,
    rank: row.rank,
  }));
}

/**
 * Subscribe to Sociale changes
 */
export function subscribeToSociale(
  socialeId: string,
  callback: (sociale: Sociale | null) => void
): () => void {
  fetchSociale(socialeId).then(callback);
  
  const channel = supabase
    .channel(`sociale:${socialeId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sociales',
        filter: `id=eq.${socialeId}`,
      },
      (payload) => {
        callback(mapSociale(payload.new as any));
      }
    )
    .subscribe();
  
  return () => {
    channel.unsubscribe();
  };
}

/**
 * Subscribe to Socialites changes
 */
export function subscribeToSocialites(
  socialeId: string,
  callback: (socialites: Socialite[]) => void
): () => void {
  fetchSocialites(socialeId).then(callback);
  
  const channel = supabase
    .channel(`socialites:${socialeId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'socialites',
        filter: `sociale_id=eq.${socialeId}`,
      },
      () => {
        fetchSocialites(socialeId).then(callback);
      }
    )
    .subscribe();
  
  return () => {
    channel.unsubscribe();
  };
}

/**
 * Subscribe to responses for a round
 */
export function subscribeToSocialeResponses(
  roundId: string,
  callback: (responses: SocialeResponse[]) => void
): () => void {
  fetchSocialeResponses(roundId).then(callback);
  
  const channel = supabase
    .channel(`sociale_responses:${roundId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sociale_responses',
        filter: `resolved_round_id=eq.${roundId}`,
      },
      () => {
        fetchSocialeResponses(roundId).then(callback);
      }
    )
    .subscribe();
  
  return () => {
    channel.unsubscribe();
  };
}

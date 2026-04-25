/**
 * Realtime Subscription Helpers
 * Simplifies Supabase realtime subscriptions for game events
 * 
 * NOTE: This file contains legacy code for the old Sessions architecture.
 * The new Sociale architecture uses different realtime subscriptions.
 * This file is kept for backwards compatibility but most functions are disabled.
 */

import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { Database, Session, Team, Answer, Sociale, Socialite } from './client';

export type SessionUpdateCallback = (session: Session) => void;
export type TeamUpdateCallback = (teams: Team[]) => void;  // Updated: Player → Team
export type AnswerUpdateCallback = (answers: Answer[]) => void;  // Updated: Submission → Answer

// Sociale callbacks
export type SocialeUpdateCallback = (sociale: Sociale) => void;
export type SocialiteUpdateCallback = (socialites: Socialite[]) => void;

// Legacy function - sessions table no longer exists
export function subscribeToSession(
  _client: SupabaseClient<Database>,
  _sessionId: string,
  _onUpdate: SessionUpdateCallback,
): RealtimeChannel | null {
  console.warn('subscribeToSession is deprecated - sessions table no longer exists');
  return null;
}

export function subscribeToTeams(  // Updated: subscribeToPlayers → subscribeToTeams
  _client: SupabaseClient<Database>,
  _sessionId: string,
  _onUpdate: TeamUpdateCallback,  // Updated: PlayerUpdateCallback → TeamUpdateCallback
): RealtimeChannel | null {
  // Teams table doesn't exist in new schema - return null
  // TODO: Update to use socialites instead
  return null;
  
  /* Old implementation - commented out
  const channel = client.channel(`teams:${sessionId}`);

  const fetchTeams = async () => {  // Updated: fetchPlayers → fetchTeams
    const { data } = await (client as any)
      .from('teams')  // Updated: players → teams
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });  // Updated: order by created_at instead of score

    if (data) {
      onUpdate(data);
    }
  };

  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'teams',
      filter: `session_id=eq.${sessionId}`,
    },
    () => {
      fetchTeams();
    },
  );

  channel.subscribe(() => {
    fetchTeams();
  });

  return channel;
  */
}

// Legacy function - answers table no longer exists
export function subscribeToAnswers(
  _client: SupabaseClient<Database>,
  _sessionId: string,
  _onUpdate: AnswerUpdateCallback,
  _roundIndex?: number,
): RealtimeChannel | null {
  console.warn('subscribeToAnswers is deprecated - answers table no longer exists');
  return null;
}

export function unsubscribe(channel: RealtimeChannel | null): void {
  if (channel) {
    channel.unsubscribe();
  }
}


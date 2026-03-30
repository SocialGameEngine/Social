/**
 * Realtime Subscription Helpers
 * Simplifies Supabase realtime subscriptions for game events
 */

import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { Database, Session, Team, Answer, Sociale, Socialite } from './client';

export type SessionUpdateCallback = (session: Session) => void;
export type TeamUpdateCallback = (teams: Team[]) => void;  // Updated: Player → Team
export type AnswerUpdateCallback = (answers: Answer[]) => void;  // Updated: Submission → Answer

// Sociale callbacks
export type SocialeUpdateCallback = (sociale: Sociale) => void;
export type SocialiteUpdateCallback = (socialites: Socialite[]) => void;

export function subscribeToSession(
  client: SupabaseClient<Database>,
  sessionId: string,
  onUpdate: SessionUpdateCallback,
): RealtimeChannel {
  return client
    .channel(`session:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        onUpdate(payload.new as Session);
      },
    )
    .subscribe();
}

export function subscribeToTeams(  // Updated: subscribeToPlayers → subscribeToTeams
  client: SupabaseClient<Database>,
  sessionId: string,
  onUpdate: TeamUpdateCallback,  // Updated: PlayerUpdateCallback → TeamUpdateCallback
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

export function subscribeToAnswers(  // Updated: subscribeToSubmissions → subscribeToAnswers
  client: SupabaseClient<Database>,
  sessionId: string,
  onUpdate: AnswerUpdateCallback,  // Updated: SubmissionUpdateCallback → AnswerUpdateCallback
  roundIndex?: number,  // Updated: roundNumber → roundIndex
): RealtimeChannel {
  const channel = client.channel(`answers:${sessionId}:${roundIndex ?? 'all'}`);

  const fetchAnswers = async () => {  // Updated: fetchSubmissions → fetchAnswers
    let query = client
      .from('answers')  // Updated: submissions → answers
      .select('*')
      .eq('session_id', sessionId);

    if (roundIndex !== undefined) {
      query = query.eq('round_index', roundIndex);  // Updated: round_number → round_index
    }

    const { data } = await query.order('created_at', { ascending: true });  // Updated: order by created_at

    if (data) {
      onUpdate(data);
    }
  };

  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'answers',  // Updated: submissions → answers
      filter: `session_id=eq.${sessionId}`,
    },
    () => {
      fetchAnswers();  // Updated: fetchSubmissions → fetchAnswers
    },
  );

  // Also listen to votes to update answer data
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'votes',
      filter: `session_id=eq.${sessionId}`,
    },
    () => {
      fetchAnswers();  // Updated: fetchSubmissions → fetchAnswers
    },
  );

  channel.subscribe(() => {
    fetchAnswers();  // Updated: fetchSubmissions → fetchAnswers
  });

  return channel;
}

export function unsubscribe(channel: RealtimeChannel | null): void {
  if (channel) {
    channel.unsubscribe();
  }
}


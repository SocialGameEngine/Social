// =============================================================================
// SOCIALE SERVICE
// =============================================================================
// Service layer for Sociale CRUD operations.
// Follows the pattern from sessionService.ts but for Sociales.

import { supabase } from '../../supabase/client';
import type {
  Sociale,
  SocialeRound,
  SocialeRoundState,
  Socialite,
  SocialeResponse,
  SocialeVote,
  SocialeScoreEvent,
  SocialeScoreboardEntry,
  CreateSocialeRequest,
  CreateSocialeResponse,
  UpdateSocialeRequest,
  StartSocialeRequest,
  AdvanceSocialePhaseRequest,
  SubmitSocialeResponseRequest,
  SubmitSocialeVoteRequest,
  JoinSocialeRequest,
  JoinSocialeResponse,
} from '../../domain/types/sociale.types';

// =============================================================================
// MAPPERS
// =============================================================================

/**
 * Map database row to Sociale domain object
 */
export function mapSociale(data: any): Sociale | null {
  if (!data) return null;
  
  return {
    id: data.id,
    roomId: data.room_id,
    createdBy: data.created_by,
    title: data.title,
    description: data.description,
    mode: data.mode,
    status: data.status,
    currentRoundIndex: data.current_round_index,
    currentRoundId: data.current_round_id,
    currentPhase: data.current_phase,
    phaseStartedAt: data.phase_started_at,
    phaseEndsAt: data.phase_ends_at,
    totalRounds: data.total_rounds,
    settings: data.settings ?? {},
    scoreboard: data.scoreboard ?? {},
    runtimeState: data.runtime_state,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    startedAt: data.started_at,
    endedAt: data.ended_at,
    legacySessionId: data.legacy_session_id,
  };
}

/**
 * Map database row to SocialeRound domain object
 */
function mapSocialeRound(data: any): SocialeRound | null {
  if (!data) return null;
  
  return {
    id: data.id,
    socialeId: data.sociale_id,
    orderIndex: data.order_index,
    type: data.type,
    title: data.title,
    content: data.content,
    settings: data.settings ?? {},
    phaseSequence: data.phase_sequence,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Map database row to SocialeRoundState domain object
 */
function mapSocialeRoundState(data: any): SocialeRoundState | null {
  if (!data) return null;
  
  return {
    id: data.id,
    socialeId: data.sociale_id,
    roundId: data.round_id,
    status: data.status,
    phase: data.phase,
    startedAt: data.started_at,
    endedAt: data.ended_at,
    phaseStartedAt: data.phase_started_at,
    phaseEndsAt: data.phase_ends_at,
    answerEndsAt: data.answer_ends_at,
    votingEndsAt: data.voting_ends_at,
    revealEndsAt: data.reveal_ends_at,
    resultsEndsAt: data.results_ends_at,
    derivedState: data.derived_state ?? {},
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Map database row to Socialite domain object
 */
export function mapSocialite(data: any): Socialite | null {
  if (!data) return null;
  
  return {
    id: data.id,
    socialeId: data.sociale_id,
    roomId: data.room_id,
    userId: data.user_id,
    membershipId: data.membership_id,
    displayName: data.display_name,
    mascotId: data.mascot_id,
    isHost: data.is_host,
    isActive: data.is_active,
    isBanned: data.is_banned,
    score: data.score,
    joinedAt: data.joined_at,
    lastSeenAt: data.last_seen_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Map database row to SocialeResponse domain object
 */
export function mapSocialeResponse(data: any): SocialeResponse | null {
  if (!data) return null;
  
  return {
    id: data.id,
    socialeId: data.sociale_id,
    roundId: data.round_id,
    socialiteId: data.socialite_id,
    type: data.type,
    value: data.value,
    isCorrect: data.is_correct,
    scoreAwarded: data.score_awarded,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Map database row to SocialeVote domain object
 */
export function mapSocialeVote(data: any): SocialeVote | null {
  if (!data) return null;
  
  return {
    id: data.id,
    socialeId: data.sociale_id,
    roundId: data.round_id,
    socialiteId: data.socialite_id,
    targetResponseId: data.target_response_id,
    createdAt: data.created_at,
  };
}

// =============================================================================
// FETCH OPERATIONS
// =============================================================================

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
 * Fetch rounds for a Sociale
 */
export async function fetchSocialeRounds(socialeId: string): Promise<SocialeRound[]> {
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
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
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
    .eq('round_id', roundId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return (data ?? []).map(mapSocialeResponse).filter((r): r is SocialeResponse => r !== null);
}

/**
 * Fetch votes for a round
 */
export async function fetchSocialeVotes(roundId: string): Promise<SocialeVote[]> {
  const { data, error } = await supabase
    .from('sociale_votes')
    .select('*')
    .eq('round_id', roundId);
  
  if (error) throw error;
  return (data ?? []).map(mapSocialeVote).filter((v): v is SocialeVote => v !== null);
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

// =============================================================================
// REALTIME SUBSCRIPTIONS
// =============================================================================

/**
 * Subscribe to Sociale changes
 */
export function subscribeToSociale(
  socialeId: string,
  callback: (sociale: Sociale | null) => void
): () => void {
  // Initial fetch
  fetchSociale(socialeId).then(callback);
  
  // Subscribe to changes
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
        callback(mapSociale(payload.new));
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
  // Initial fetch
  fetchSocialites(socialeId).then(callback);
  
  // Subscribe to changes
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
        // Refetch all socialites on any change
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
  // Initial fetch
  fetchSocialeResponses(roundId).then(callback);
  
  // Subscribe to changes
  const channel = supabase
    .channel(`sociale_responses:${roundId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sociale_responses',
        filter: `round_id=eq.${roundId}`,
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

// =============================================================================
// MUTATION OPERATIONS (Edge Functions)
// =============================================================================

/**
 * Get auth headers for Edge Function calls
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const { data: { session } } = await supabase.auth.getSession();
  const authToken = session?.access_token || supabaseKey;
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
    'apikey': supabaseKey,
  };
}

/**
 * Create a new Sociale
 * TODO: Implement Edge Function sociales-create
 */
export async function createSociale(payload: CreateSocialeRequest): Promise<CreateSocialeResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${supabaseUrl}/functions/v1/sociales-create`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create Sociale' }));
    throw new Error(errorData.message || errorData.error || 'Failed to create Sociale');
  }
  
  return response.json();
}

/**
 * Update a Sociale
 * TODO: Implement Edge Function sociales-update
 */
export async function updateSociale(payload: UpdateSocialeRequest): Promise<Sociale> {
  const { data, error } = await supabase.functions.invoke<{ sociale: Sociale }>(
    'sociales-update',
    { body: payload }
  );
  
  if (error) throw error;
  if (!data) throw new Error('No data returned from updateSociale');
  return data.sociale;
}

/**
 * Start a Sociale
 * TODO: Implement Edge Function sociales-start
 */
export async function startSociale(payload: StartSocialeRequest): Promise<Sociale> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${supabaseUrl}/functions/v1/sociales-start`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to start Sociale' }));
    throw new Error(errorData.message || errorData.error || 'Failed to start Sociale');
  }
  
  const data = await response.json();
  return data.sociale;
}

/**
 * Advance Sociale phase
 * TODO: Implement Edge Function sociales-advance
 */
export async function advanceSocialePhase(payload: AdvanceSocialePhaseRequest): Promise<Sociale> {
  const { data, error } = await supabase.functions.invoke<{ sociale: Sociale }>(
    'sociales-advance',
    { body: payload }
  );
  
  if (error) throw error;
  if (!data) throw new Error('No data returned from advanceSocialePhase');
  return data.sociale;
}

/**
 * Pause a Sociale
 * TODO: Implement Edge Function sociales-pause
 */
export async function pauseSociale(socialeId: string, pause: boolean): Promise<Sociale> {
  const { data, error } = await supabase.functions.invoke<{ sociale: Sociale }>(
    'sociales-pause',
    { body: { socialeId, pause } }
  );
  
  if (error) throw error;
  if (!data) throw new Error('No data returned from pauseSociale');
  return data.sociale;
}

/**
 * End a Sociale
 * TODO: Implement Edge Function sociales-end
 */
export async function endSociale(socialeId: string): Promise<Sociale> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${supabaseUrl}/functions/v1/sociales-end`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ socialeId }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to end Sociale' }));
    throw new Error(errorData.message || errorData.error || 'Failed to end Sociale');
  }
  
  const data = await response.json();
  return data.sociale;
}

/**
 * Join a Sociale
 * TODO: Implement Edge Function sociales-join
 */
export async function joinSociale(payload: JoinSocialeRequest): Promise<JoinSocialeResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${supabaseUrl}/functions/v1/sociales-join`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to join Sociale' }));
    throw new Error(errorData.message || errorData.error || 'Failed to join Sociale');
  }
  
  return response.json();
}

/**
 * Submit a response
 * TODO: Implement Edge Function sociales-submit-response
 */
export async function submitSocialeResponse(payload: SubmitSocialeResponseRequest): Promise<SocialeResponse> {
  const { data, error } = await supabase.functions.invoke<{ response: SocialeResponse }>(
    'sociales-submit-response',
    { body: payload }
  );
  
  if (error) throw error;
  if (!data) throw new Error('No data returned from submitSocialeResponse');
  return data.response;
}

/**
 * Submit a vote
 * TODO: Implement Edge Function sociales-submit-vote
 */
export async function submitSocialeVote(payload: SubmitSocialeVoteRequest): Promise<SocialeVote> {
  const { data, error } = await supabase.functions.invoke<{ vote: SocialeVote }>(
    'sociales-submit-vote',
    { body: payload }
  );
  
  if (error) throw error;
  if (!data) throw new Error('No data returned from submitSocialeVote');
  return data.vote;
}

/**
 * Skip current round (mark as skipped and move to next)
 * TODO: Implement Edge Function sociales-skip-round
 */
export async function skipSocialeRound(socialeId: string): Promise<Sociale> {
  const { data, error } = await supabase.functions.invoke<{ sociale: Sociale }>(
    'sociales-skip-round',
    { body: { socialeId } }
  );
  
  if (error) throw error;
  if (!data) throw new Error('No data returned from skipSocialeRound');
  return data.sociale;
}

/**
 * Skip current phase (jump to next phase in same round)
 * TODO: Implement Edge Function sociales-skip-phase
 */
export async function skipSocialePhase(socialeId: string): Promise<Sociale> {
  const { data, error } = await supabase.functions.invoke<{ sociale: Sociale }>(
    'sociales-skip-phase',
    { body: { socialeId } }
  );
  
  if (error) throw error;
  if (!data) throw new Error('No data returned from skipSocialePhase');
  return data.sociale;
}

// =============================================================================
// EXPORT SERVICE OBJECT
// =============================================================================

export const socialeService = {
  // Fetch
  fetchSociale,
  fetchSocialesForRoom,
  fetchSocialeRounds,
  fetchSocialeRoundState,
  fetchSocialites,
  fetchSocialeResponses,
  fetchSocialeVotes,
  fetchSocialeScoreboard,
  
  // Subscribe
  subscribeToSociale,
  subscribeToSocialites,
  subscribeToSocialeResponses,
  
  // Mutations
  createSociale,
  updateSociale,
  startSociale,
  advanceSocialePhase,
  pauseSociale,
  endSociale,
  joinSociale,
  submitSocialeResponse,
  submitSocialeVote,
  skipSocialeRound,
  skipSocialePhase,
};

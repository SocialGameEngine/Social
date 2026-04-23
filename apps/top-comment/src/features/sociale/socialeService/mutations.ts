// =============================================================================
// SOCIALE MUTATIONS
// =============================================================================
// Create, update, and delete operations for Sociale entities.

import { supabase } from '../../../supabase/client';
import type {
  Sociale,
  SocialeResponse,
  SocialeVote,
  CreateSocialeRequest,
  CreateSocialeResponse,
  UpdateSocialeRequest,
  StartSocialeRequest,
  AdvanceSocialePhaseRequest,
  AdvanceSocialeResponse,
  SubmitSocialeResponseRequest,
  SubmitSocialeVoteRequest,
  JoinSocialeRequest,
  JoinSocialeResponse,
} from '../../../domain/types/sociale.types';
import type { TriviaInteractionSettings } from '../../../domain/types/interaction.types';
import { mapSociale, mapSocialite } from './mappers';

// DB row types for trivia questions
interface TriviaQuestionOption {
  id: string;
  option_text: string;
  is_correct: boolean;
  sort_order: number | null;
}

interface TriviaQuestionAlias {
  alias_text: string;
}

/**
 * Get auth headers for Edge Function calls
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  let { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    const { data: refreshData } = await supabase.auth.refreshSession();
    session = refreshData.session;
  }

  if (!session?.access_token) {
    throw new Error('You must be signed in to perform this action.');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    'apikey': supabaseKey,
  };
}

/**
 * Create a new Sociale
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
 */
export async function updateSociale(payload: UpdateSocialeRequest): Promise<Sociale> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const headers = await getAuthHeaders();
  const { socialeId, ...rest } = payload;
  
  const response = await fetch(`${supabaseUrl}/functions/v1/sociales-update`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ socialeId, ...rest }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to update Sociale' }));
    throw new Error(errorData.message || errorData.error || 'Failed to update Sociale');
  }
  
  const data = await response.json();
  return data.sociale;
}

/**
 * Start a Sociale
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
 */
export async function advanceSocialePhase(payload: AdvanceSocialePhaseRequest): Promise<AdvanceSocialeResponse> {
  const { data, error } = await supabase.functions.invoke<AdvanceSocialeResponse>(
    'sociales-advance',
    { body: payload }
  );
  
  if (error) throw error;
  if (!data) throw new Error('No data returned from advanceSocialePhase');
  return data;
}

/**
 * Pause a Sociale
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
 * Cancel a draft Sociale
 */
export async function cancelSociale(socialeId: string): Promise<Sociale> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from('sociales')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', socialeId)
    .eq('created_by', userData.user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to cancel Sociale: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to cancel Sociale: No data returned');
  }

  const mappedSociale = mapSociale(data);
  if (!mappedSociale) {
    throw new Error('Failed to cancel Sociale: Invalid mapping result');
  }
  return mappedSociale;
}

/**
 * End a Sociale
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
 * Join a Sociale as a Socialite
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

  const data = await response.json();
  const row = data?.socialite;
  if (!row) throw new Error('No socialite returned');
  const socialite = mapSocialite(row);
  if (!socialite) throw new Error('Invalid socialite payload');
  return { socialite, sociale: data.sociale };
}

/**
 * Submit a response to a Sociale round
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
 * Submit a vote on a response
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
 * Skip a round in a Sociale
 */
export async function skipSocialeRound(socialeId: string): Promise<Sociale> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${supabaseUrl}/functions/v1/sociales-skip-round`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ socialeId }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to skip round' }));
    throw new Error(errorData.message || errorData.error || 'Failed to skip round');
  }
  
  const data = await response.json();
  return data.sociale;
}

/**
 * Skip a phase in a Sociale round
 */
export async function skipSocialePhase(socialeId: string): Promise<Sociale> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${supabaseUrl}/functions/v1/sociales-skip-phase`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ socialeId }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to skip phase' }));
    throw new Error(errorData.message || errorData.error || 'Failed to skip phase');
  }
  
  const data = await response.json();
  return data.sociale;
}

/**
 * Return a Sociale to lobby state
 */
export async function returnSocialeToLobby(socialeId: string): Promise<Sociale> {
  const { data, error } = await supabase
    .from('sociales')
    .update({
      status: 'lobby',
      current_round_index: null,
      current_round_id: null,
      current_phase: null,
      phase_started_at: null,
      phase_ends_at: null,
      started_at: null,
      ended_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', socialeId)
    .select('*')
    .single();

  if (error) throw error;

  const mapped = mapSociale(data);
  if (!mapped) {
    throw new Error('Failed to map Sociale after returning to lobby');
  }
  return mapped;
}

/**
 * Populate a round's title and content from its library settings
 */
export async function populateRoundContent(roundId: string): Promise<void> {
  const { data: round, error: roundError } = await supabase
    .from('sociale_rounds')
    .select('*')
    .eq('id', roundId)
    .single();

  if (roundError || !round) {
    throw new Error(`Failed to fetch round: ${roundError?.message}`);
  }

  const hasContent = round.title && round.content;
  const hasSnapshot = round.type === 'trivia' && round.settings && typeof round.settings === 'object' && 'snapshot' in round.settings && round.settings.snapshot;
  
  if (hasContent && (round.type !== 'trivia' || hasSnapshot)) {
    return;
  }

  let title: string | null = null;
  let content: string | null = null;

  try {
    if (round.type === 'topic' && round.settings && typeof round.settings === 'object' && 'promptLibraryId' in round.settings) {
      const { data: prompts } = await supabase
        .from('prompts')
        .select('text')
        .eq('library_id', (round.settings as any).promptLibraryId)
        .eq('is_active', true)
        .limit(1);

      if (prompts && prompts.length > 0) {
        title = 'Hot Topic';
        content = prompts[0].text;
      }
    } else if (round.type === 'trivia' && round.settings && typeof round.settings === 'object' && 'questionPackId' in round.settings) {
      const { data: questions } = await supabase
        .from('trivia_questions')
        .select(`
          prompt,
          format,
          explanation,
          trivia_question_options(id, option_text, is_correct, sort_order),
          trivia_question_aliases(alias_text, alias_normalized)
        `)
        .eq('pack_id', (round.settings as any).questionPackId)
        .eq('status', 'published')
        .limit(1);

      if (questions && questions.length > 0) {
        const question = questions[0];
        title = 'Trivia Question';
        content = question.prompt;

        const settings = round.settings as Partial<TriviaInteractionSettings>;
        let snapshot: TriviaInteractionSettings['snapshot'] | null = null;

        if (question.format === 'multiple_choice' && question.trivia_question_options) {
          const options = question.trivia_question_options
            .sort((a: TriviaQuestionOption, b: TriviaQuestionOption) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((opt: TriviaQuestionOption) => ({
              id: opt.id,
              text: opt.option_text,
            }));

          const correctOption = question.trivia_question_options.find((opt: TriviaQuestionOption) => opt.is_correct);
          
          snapshot = {
            prompt: question.prompt,
            categoryKey: (question as any).category_key || 'general',
            difficulty: (question as any).difficulty || 'medium',
            explanation: question.explanation ?? undefined,
            multipleChoice: {
              options,
              correctOptionId: correctOption?.id || '',
              shuffleOptions: true,
            },
          };

          settings.format = 'multiple_choice';
        } else if (question.format === 'written_answer') {
          const aliases = question.trivia_question_aliases?.map((alias: TriviaQuestionAlias) => alias.alias_text) || [];

          snapshot = {
            prompt: question.prompt,
            categoryKey: (question as any).category_key || 'general',
            difficulty: (question as any).difficulty || 'medium',
            explanation: question.explanation ?? undefined,
            writtenAnswer: {
              acceptedAliases: aliases,
              normalization: 'standard',
              allowTypos: false,
              allowWordOrderVariation: false,
            },
          };

          settings.format = 'written_answer';
        }

        const { error: updateError } = await supabase
          .from('sociale_rounds')
          .update({
            title: title || round.title,
            content: content || round.content,
            settings: {
              ...settings,
              snapshot,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', roundId);

        if (updateError) {
          throw new Error(`Failed to update round with trivia snapshot: ${updateError.message}`);
        }
      }
    }

    if (title || content) {
      const { error: updateError } = await supabase
        .from('sociale_rounds')
        .update({
          title: title || round.title,
          content: content || round.content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roundId);

      if (updateError) {
        throw new Error(`Failed to update round content: ${updateError.message}`);
      }
    }
  } catch (error) {
    const fallbackTitle = round.type === 'topic' ? 'Hot Topic' : 'Trivia Question';
    const fallbackContent = round.type === 'topic' 
      ? 'No prompt available' 
      : 'No trivia question available';

    await supabase
      .from('sociale_rounds')
      .update({
        title: round.title || fallbackTitle,
        content: round.content || fallbackContent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roundId);
  }
}

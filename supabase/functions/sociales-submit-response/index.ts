// =============================================================================
// SOCIALES SUBMIT RESPONSE EDGE FUNCTION
// =============================================================================
// Allows a Socialite to submit a response to a round

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../types/database.ts'
import type { SubmitSocialeResponseRequest, SubmitSocialeResponseResponse } from '../../apps/top-comment/src/domain/types/sociale.types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from auth
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body: SubmitSocialeResponseRequest = await req.json()
    const { socialeId, roundId, socialiteId, type, value, isCorrect } = body

    if (!socialeId || !roundId || !socialiteId || !type || value === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: socialeId, roundId, socialiteId, type, value' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the Sociale
    const { data: sociale, error: fetchError } = await supabaseClient
      .from('sociales')
      .select('*')
      .eq('id', socialeId)
      .single()

    if (fetchError || !sociale) {
      return new Response(
        JSON.stringify({ error: 'Sociale not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the Socialite
    const { data: socialite, error: socialiteError } = await supabaseClient
      .from('socialites')
      .select('*')
      .eq('id', socialiteId)
      .eq('user_id', user.id)
      .single()

    if (socialiteError || !socialite) {
      return new Response(
        JSON.stringify({ error: 'Socialite not found or unauthorized' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (
      !socialite.is_active ||
      socialite.pending_until_round_index != null
    ) {
      return new Response(
        JSON.stringify({ error: 'Not active in this round yet — join takes effect next round.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current round state
    const { data: roundState, error: stateError } = await supabaseClient
      .from('sociale_round_state')
      .select('*')
      .eq('sociale_id', socialeId)
      .eq('round_id', roundId)
      .eq('status', 'active')
      .single()

    if (stateError || !roundState) {
      return new Response(
        JSON.stringify({ error: 'Round not active' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if response phase is active
    const responsePhases = ['question', 'answer']
    if (!responsePhases.includes(roundState.phase)) {
      return new Response(
        JSON.stringify({ error: 'Not in response phase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate score based on response type
    let scoreAwarded = 0
    if (type === 'trivia' && isCorrect) {
      scoreAwarded = 10 // Base score for correct trivia
    } else if (type === 'prompt') {
      scoreAwarded = 5 // Base score for prompt response
    } else if (type === 'topic') {
      scoreAwarded = 3 // Base score for topic response
    }

    // Fetch most recent existing response (if any).
    // If historical duplicates exist, we update the newest row and let the UI dedupe.
    const { data: existingResponse, error: existingError } = await supabaseClient
      .from('sociale_responses')
      .select('*')
      .eq('sociale_id', socialeId)
      .eq('round_id', roundId)
      .eq('socialite_id', socialiteId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingError) throw existingError

    const nowIso = new Date().toISOString()
    const responseUpsertPayload = {
      sociale_id: socialeId,
      round_id: roundId,
      socialite_id: socialiteId,
      type,
      value,
      is_correct: isCorrect || false,
      score_awarded: scoreAwarded,
      updated_at: nowIso,
    }

    if (existingResponse) {
      // Update existing response (upsert behavior).
      const { data: updatedResponse, error: updateError } = await supabaseClient
        .from('sociale_responses')
        .update(responseUpsertPayload)
        .eq('id', existingResponse.id)
        .select()
        .single()

      if (updateError) throw updateError

      const existingScoreAwarded = existingResponse.score_awarded ?? 0
      const delta = scoreAwarded - existingScoreAwarded

      // Avoid score event writes for free-text updates (scoreAwarded=0),
      // and only apply score deltas when we actually changed score.
      if (delta !== 0) {
        await supabaseClient
          .from('socialites')
          .update({
            score: socialite.score + delta,
            updated_at: nowIso,
          })
          .eq('id', socialiteId)

        await supabaseClient
          .from('sociale_score_events')
          .insert({
            sociale_id: socialeId,
            round_id: roundId,
            socialite_id: socialiteId,
            reason: `Updated ${type} response`,
            points: delta,
            metadata: null,
            created_at: nowIso,
          })
      }

      const responseResult: SubmitSocialeResponseResponse = {
        response: {
          id: updatedResponse.id,
          socialeId: updatedResponse.sociale_id,
          roundId: updatedResponse.round_id,
          socialiteId: updatedResponse.socialite_id,
          type: updatedResponse.type,
          value: updatedResponse.value,
          isCorrect: updatedResponse.is_correct,
          scoreAwarded: updatedResponse.score_awarded,
          createdAt: updatedResponse.created_at,
        },
        scoreAwarded,
      }

      return new Response(
        JSON.stringify(responseResult),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert first response
    const { data: response, error: createError } = await supabaseClient
      .from('sociale_responses')
      .insert({
        sociale_id: socialeId,
        round_id: roundId,
        socialite_id: socialiteId,
        type,
        value,
        is_correct: isCorrect || false,
        score_awarded: scoreAwarded,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select()
      .single()

    if (createError) throw createError

    if (scoreAwarded !== 0) {
      // Update Socialite score
      await supabaseClient
        .from('socialites')
        .update({
          score: socialite.score + scoreAwarded,
          updated_at: nowIso,
        })
        .eq('id', socialiteId)

      // Create score event (only when scoring applies)
      await supabaseClient
        .from('sociale_score_events')
        .insert({
          sociale_id: socialeId,
          round_id: roundId,
          socialite_id: socialiteId,
          reason: `Submitted ${type} response`,
          points: scoreAwarded,
          metadata: null,
          created_at: nowIso,
        })
    }

    // Return created response
    const responseResult: SubmitSocialeResponseResponse = {
      response: {
        id: response.id,
        socialeId: response.sociale_id,
        roundId: response.round_id,
        socialiteId: response.socialite_id,
        type: response.type,
        value: response.value,
        isCorrect: response.is_correct,
        scoreAwarded: response.score_awarded,
        createdAt: response.created_at,
      },
      scoreAwarded,
    }

    return new Response(
      JSON.stringify(responseResult),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error submitting response:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

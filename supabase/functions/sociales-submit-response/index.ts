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

    // Check if user already responded
    const { data: existingResponse, error: existingError } = await supabaseClient
      .from('sociale_responses')
      .select('*')
      .eq('sociale_id', socialeId)
      .eq('round_id', roundId)
      .eq('socialite_id', socialiteId)
      .single()

    if (existingResponse && !existingError) {
      return new Response(
        JSON.stringify({ error: 'Already submitted response for this round' }),
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

    // Create the response
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
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) throw createError

    // Update Socialite score
    await supabaseClient
      .from('socialites')
      .update({
        score: socialite.score + scoreAwarded,
        updated_at: new Date().toISOString(),
      })
      .eq('id', socialiteId)

    // Create score event
    await supabaseClient
      .from('sociale_score_events')
      .insert({
        sociale_id: socialeId,
        round_id: roundId,
        socialite_id: socialiteId,
        event_type: 'response',
        score_change: scoreAwarded,
        reason: `Submitted ${type} response`,
        created_at: new Date().toISOString(),
      })

    // Return the created response
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

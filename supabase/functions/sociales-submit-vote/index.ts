// =============================================================================
// SOCIALES SUBMIT VOTE EDGE FUNCTION
// =============================================================================
// Allows a Socialite to vote on a response

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../types/database.ts'
import type { SubmitSocialeVoteRequest, SubmitSocialeVoteResponse } from '../../apps/top-comment/src/domain/types/sociale.types.ts'

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
    const body: SubmitSocialeVoteRequest = await req.json()
    const { socialeId, roundId, socialiteId, targetResponseId } = body

    if (!socialeId || !roundId || !socialiteId || !targetResponseId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: socialeId, roundId, socialiteId, targetResponseId' }),
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

    // Check if voting phase is active
    if (roundState.phase !== 'vote') {
      return new Response(
        JSON.stringify({ error: 'Not in voting phase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify target response exists and is for this round
    const { data: targetResponse, error: responseError } = await supabaseClient
      .from('sociale_responses')
      .select('*')
      .eq('id', targetResponseId)
      .eq('round_id', roundId)
      .single()

    if (responseError || !targetResponse) {
      return new Response(
        JSON.stringify({ error: 'Target response not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already voted
    const { data: existingVote, error: existingError } = await supabaseClient
      .from('sociale_votes')
      .select('*')
      .eq('sociale_id', socialeId)
      .eq('round_id', roundId)
      .eq('socialite_id', socialiteId)
      .single()

    if (existingVote && !existingError) {
      return new Response(
        JSON.stringify({ error: 'Already voted for this round' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Cannot vote for own response
    if (targetResponse.socialite_id === socialiteId) {
      return new Response(
        JSON.stringify({ error: 'Cannot vote for own response' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the vote
    const { data: vote, error: createError } = await supabaseClient
      .from('sociale_votes')
      .insert({
        sociale_id: socialeId,
        round_id: roundId,
        socialite_id: socialiteId,
        target_response_id: targetResponseId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) throw createError

    // Calculate vote score for response author (1 point per vote)
    const voteScore = 1
    const { data: responseAuthor, error: authorError } = await supabaseClient
      .from('socialites')
      .select('*')
      .eq('id', targetResponse.socialite_id)
      .single()

    if (!authorError && responseAuthor) {
      // Update response author's score
      await supabaseClient
        .from('socialites')
        .update({
          score: responseAuthor.score + voteScore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetResponse.socialite_id)

      // Create score event for vote
      await supabaseClient
        .from('sociale_score_events')
        .insert({
          sociale_id: socialeId,
          round_id: roundId,
          socialite_id: targetResponse.socialite_id,
          event_type: 'vote_received',
          score_change: voteScore,
          reason: 'Received vote',
          created_at: new Date().toISOString(),
        })
    }

    // Return the created vote
    const responseResult: SubmitSocialeVoteResponse = {
      vote: {
        id: vote.id,
        socialeId: vote.sociale_id,
        roundId: vote.round_id,
        socialiteId: vote.socialite_id,
        targetResponseId: vote.target_response_id,
        createdAt: vote.created_at,
      },
    }

    return new Response(
      JSON.stringify(responseResult),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error submitting vote:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

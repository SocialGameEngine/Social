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
    const { socialeId, roundId, socialiteId, type, value, isCorrect, isPractice } = body

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

    const isAmbient = sociale.mode === 'ambient'

    if (isAmbient) {
      // Ambient sociales have no sociale_round_state rows.
      // Verify phase/round via the sociales row directly.
      if (sociale.status !== 'active') {
        return new Response(
          JSON.stringify({ error: 'Round not active' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const responsePhases = ['setup', 'question', 'answer']
      if (!responsePhases.includes(sociale.current_phase ?? '')) {
        return new Response(
          JSON.stringify({ error: 'Not in response phase' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (sociale.current_round_id !== roundId) {
        return new Response(
          JSON.stringify({ error: 'Round not active' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
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
      const responsePhases = ['setup', 'question', 'answer']
      if (!responsePhases.includes(roundState.phase)) {
        return new Response(
          JSON.stringify({ error: 'Not in response phase' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Get the round to access settings for trivia scoring.
    // Ambient rounds live in ambient_rounds; regular rounds in sociale_rounds.
    // P1-11: also pull point_multiplier so the final round can double scores.
    let roundType = 'prompt'
    let roundSettings: any = {}
    let pointMultiplier = 1

    if (isAmbient) {
      const { data: ambientRound } = await supabaseClient
        .from('ambient_rounds')
        .select('type, settings')
        .eq('id', roundId)
        .single()
      if (ambientRound) {
        roundType = ambientRound.type || 'prompt'
        const s = (ambientRound.settings || {}) as any
        
        // If already has complete snapshot (modern format), use as-is
        if (s.snapshot?.multipleChoice?.options && s.snapshot?.multipleChoice?.correctOptionId) {
          roundSettings = s
        }
        // Legacy format - normalize from s.options array with is_correct flags
        else if (s.format === 'multiple_choice' && s.options && Array.isArray(s.options)) {
          const options = (s.options as any[]).map((opt) => ({
            id: opt.option_id,
            text: opt.option_text,
          }))
          const correct = (s.options as any[]).find((opt) => opt.is_correct)
          roundSettings = {
            ...s,
            snapshot: {
              prompt: s.snapshot?.prompt ?? s.prompt ?? ambientRound.content ?? '',
              explanation: s.snapshot?.explanation ?? null,
              multipleChoice: {
                options,
                correctOptionId: correct?.option_id ?? '',
              },
            },
          }
        } else {
          roundSettings = s
        }
      }
    } else {
      const { data: currentRound } = await supabaseClient
        .from('sociale_rounds')
        .select('type, settings, point_multiplier')
        .eq('id', roundId)
        .single()
      if (currentRound) {
        roundType = currentRound.type || 'prompt'
        roundSettings = (currentRound.settings || {}) as any
        pointMultiplier =
          typeof currentRound.point_multiplier === 'number' &&
          currentRound.point_multiplier > 0
            ? currentRound.point_multiplier
            : 1
      }
    }

    // Calculate score based on response type
    let scoreAwarded = 0
    let computedIsCorrect = isCorrect || false

    if (roundType === 'trivia' && roundSettings?.snapshot) {
      const snap = roundSettings.snapshot
      const format = roundSettings.format
      const pointsCorrect = roundSettings.pointsCorrect ?? 100

      if (format === 'multiple_choice' && snap.multipleChoice) {
        // MC: value should be the selected option ID string
        const selectedOptionId = typeof value === 'string' ? value : String(value)
        computedIsCorrect = selectedOptionId === snap.multipleChoice.correctOptionId
        scoreAwarded = computedIsCorrect ? pointsCorrect : 0
      } else if (format === 'written_answer' && snap.writtenAnswer) {
        // Written answer: normalize and compare against acceptedAnswers
        const submittedAnswer = (typeof value === 'string' ? value : String(value)).trim().toLowerCase()
        const acceptedAnswers: string[] = snap.writtenAnswer.acceptedAnswers || []
        computedIsCorrect = acceptedAnswers.some(
          (accepted: string) => accepted.trim().toLowerCase() === submittedAnswer
        )
        scoreAwarded = computedIsCorrect ? pointsCorrect : 0
      } else {
        // Fallback for trivia without proper snapshot
        scoreAwarded = computedIsCorrect ? 10 : 0
      }
    } else if (type === 'trivia' && isCorrect) {
      scoreAwarded = 10 // Legacy fallback
    } else if (type === 'prompt') {
      scoreAwarded = 5
    } else if (type === 'topic') {
      scoreAwarded = 3
    }

    // P1-11 — apply round multiplier last so both trivia and open-text rounds
    // get the same double-points treatment on the final round.
    if (scoreAwarded > 0 && pointMultiplier !== 1) {
      scoreAwarded = Math.round(scoreAwarded * pointMultiplier)
    }

    // Fetch most recent existing response (if any).
    // Use resolved_round_id so both ambient and regular rounds match.
    const { data: existingResponse, error: existingError } = await supabaseClient
      .from('sociale_responses')
      .select('*')
      .eq('sociale_id', socialeId)
      .eq('resolved_round_id', roundId)
      .eq('socialite_id', socialiteId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingError) throw existingError

    const nowIso = new Date().toISOString()
    // Ambient rounds store their ID in ambient_round_id; regular rounds use round_id.
    const roundIdPayload = isAmbient
      ? { round_id: null, ambient_round_id: roundId }
      : { round_id: roundId, ambient_round_id: null }
    const scoreEventRoundIdPayload = isAmbient
      ? { ambient_round_id: roundId }
      : { round_id: roundId }

    const responseUpsertPayload = {
      sociale_id: socialeId,
      ...roundIdPayload,
      socialite_id: socialiteId,
      type,
      value,
      is_correct: computedIsCorrect,
      score_awarded: scoreAwarded,
      // P2-4: Mark as practice for ghost mode (late joiners)
      is_practice: isPractice || false,
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
            ...scoreEventRoundIdPayload,
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
          roundId: (updatedResponse as any).resolved_round_id ?? updatedResponse.round_id,
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
        ...roundIdPayload,
        socialite_id: socialiteId,
        type,
        value,
        is_correct: computedIsCorrect,
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
          ...scoreEventRoundIdPayload,
          socialite_id: socialiteId,
          reason: `Submitted ${type} response`,
          points: scoreAwarded,
          metadata: null,
          created_at: nowIso,
        })
    }

    // Return created response — resolved_round_id is the canonical round ID for both modes
    const responseResult: SubmitSocialeResponseResponse = {
      response: {
        id: response.id,
        socialeId: response.sociale_id,
        roundId: response.resolved_round_id ?? response.round_id,
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

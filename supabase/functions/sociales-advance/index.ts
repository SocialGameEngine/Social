// =============================================================================
// SOCIALES ADVANCE EDGE FUNCTION
// =============================================================================
// Advances a Sociale to the next phase or round

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../types/database.ts'
import type { AdvanceSocialeRequest, AdvanceSocialeResponse } from '../../apps/top-comment/src/domain/types/sociale.types.ts'

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
    const body: AdvanceSocialeRequest = await req.json()
    const { socialeId, targetPhase } = body

    if (!socialeId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: socialeId' }),
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

    // Verify user is host of the room
    const { data: membership, error: membershipError } = await supabaseClient
      .from('room_memberships')
      .select('*')
      .eq('room_id', sociale.room_id)
      .eq('user_id', user.id)
      .eq('is_host', true)
      .single()

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({ error: 'Must be host of the room to advance Sociale' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current round state.
    // Prefer `sociales.current_round_id` so we don't accidentally pick the wrong active row.
    let roundStateQuery: any = supabaseClient
      .from('sociale_round_state')
      .select('*')
      .eq('sociale_id', socialeId)
      .eq('status', 'active')

    if (sociale.current_round_id) {
      roundStateQuery = roundStateQuery.eq('round_id', sociale.current_round_id)
    }

    const {
      data: initialRoundState,
      error: initialStateError,
    } = await roundStateQuery
      // Be tolerant if data corruption leaves multiple active rows:
      // pick the most recently started active round_state.
      .order('phase_started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // If the DB state got out of sync with `sociales.current_round_id`, fall back.
    let currentRoundState = initialRoundState
    let stateError = initialStateError

    if ((!currentRoundState || stateError) && sociale.current_round_id) {
      const { data: fallbackRoundState, error: fallbackError } = await supabaseClient
        .from('sociale_round_state')
        .select('*')
        .eq('sociale_id', socialeId)
        .eq('status', 'active')
        .order('phase_started_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fallbackError || !fallbackRoundState) {
        return new Response(
          JSON.stringify({ error: 'No active round state found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      currentRoundState = fallbackRoundState
      stateError = null
    }

    if (stateError || !currentRoundState) {
      return new Response(
        JSON.stringify({ error: 'No active round state found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current round
    const { data: currentRound, error: roundError } = await supabaseClient
      .from('sociale_rounds')
      .select('*')
      .eq('id', currentRoundState.round_id)
      .single()

    if (roundError || !currentRound) {
      return new Response(
        JSON.stringify({ error: 'Current round not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine next action
    let nextPhase = targetPhase
    let nextRoundIndex = sociale.current_round_index

    // If targetPhase is 'next', calculate the next phase
    if (targetPhase === 'next') {
      // Simple phase progression logic (could be enhanced with round registry)
      const phases = ['setup', 'question', 'answer', 'vote', 'results', 'reveal', 'discussion']
      const currentPhaseIndex = phases.indexOf(currentRoundState.phase)
      
      if (currentPhaseIndex < phases.length - 1) {
        nextPhase = phases[currentPhaseIndex + 1]
      } else {
        // Move to next round
        nextRoundIndex = (sociale.current_round_index || 0) + 1
        
        // Check if this is the last round
        if (nextRoundIndex >= sociale.total_rounds) {
          // End the Sociale
          const { error: endError } = await supabaseClient
            .from('sociales')
            .update({
              status: 'ended',
              ended_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', socialeId)

          if (endError) throw endError

          // End current round state
          await supabaseClient
            .from('sociale_round_state')
            .update({
              status: 'ended',
              ended_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentRoundState.id)

          const response: AdvanceSocialeResponse = {
            sociale: {
              ...sociale,
              status: 'ended',
              endedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            advanced: true,
            nextPhase: 'ended',
          }

          return new Response(
            JSON.stringify(response),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          // Move to next round
          const { data: nextRound, error: nextRoundError } = await supabaseClient
            .from('sociale_rounds')
            .select('*')
            .eq('sociale_id', socialeId)
            .eq('order_index', nextRoundIndex)
            .single()

          if (nextRoundError || !nextRound) {
            return new Response(
              JSON.stringify({ error: 'Next round not found' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // New round starts on a "setup" phase in the DB, but the room UI
          // treats non-`vote`/`results` phases as the "answer-like" phase for timing.
          const nextPhaseDurationSeconds = (nextRound.settings as any)?.answerSeconds ?? 90
          const phaseStartedAt = new Date().toISOString()
          const phaseEndsAt = new Date(
            Date.now() + nextPhaseDurationSeconds * 1000
          ).toISOString()

          // End current round state
          await supabaseClient
            .from('sociale_round_state')
            .update({
              status: 'ended',
              ended_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentRoundState.id)

          // Create new round state
          const { error: newStateError } = await supabaseClient
            .from('sociale_round_state')
            .insert({
              sociale_id: socialeId,
              round_id: nextRound.id,
              status: 'active',
              phase: 'setup',
              started_at: phaseStartedAt,
              phase_started_at: phaseStartedAt,
              phase_ends_at: phaseEndsAt,
              created_at: new Date().toISOString(),
              updated_at: phaseStartedAt,
            })

          if (newStateError) throw newStateError

          // Update Sociale
          const { data: updatedSociale, error: updateError } = await supabaseClient
            .from('sociales')
            .update({
              current_round_index: nextRoundIndex,
              current_round_id: nextRound.id,
              current_phase: 'setup',
              phase_started_at: phaseStartedAt,
              phase_ends_at: phaseEndsAt,
              updated_at: phaseStartedAt,
            })
            .eq('id', socialeId)
            .select()
            .single()

          if (updateError) throw updateError

          const response: AdvanceSocialeResponse = {
            sociale: {
              id: updatedSociale.id,
              roomId: updatedSociale.room_id,
              createdBy: updatedSociale.created_by,
              title: updatedSociale.title,
              description: updatedSociale.description,
              mode: updatedSociale.mode,
              status: updatedSociale.status,
              currentRoundIndex: updatedSociale.current_round_index,
              phaseEndsAt: updatedSociale.phase_ends_at,
              totalRounds: updatedSociale.total_rounds,
              settings: updatedSociale.settings || {},
              scoreboard: updatedSociale.scoreboard || {},
              runtimeState: updatedSociale.runtime_state,
              createdAt: updatedSociale.created_at,
              updatedAt: updatedSociale.updated_at,
              startedAt: updatedSociale.started_at,
              endedAt: updatedSociale.ended_at,
              legacySessionId: updatedSociale.legacy_session_id,
            },
            advanced: true,
            nextPhase: 'setup',
          }

          return new Response(
            JSON.stringify(response),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Update current round state phase
    const phaseDurationSeconds = (() => {
      // Room UI only cares about `answer`/`vote`/`results` timers.
      // Still, we set durations for all phases so `phase_ends_at` is never null.
      switch (nextPhase) {
        case 'vote':
          return (currentRound.settings as any)?.votingSeconds ?? 30
        case 'results':
        case 'reveal':
        case 'discussion':
          return (currentRound.settings as any)?.resultsSeconds ?? 12
        case 'setup':
        case 'question':
        case 'answer':
        default:
          return (currentRound.settings as any)?.answerSeconds ?? 90
      }
    })()

    const phaseStartedAt = new Date().toISOString()
    const phaseEndsAt = new Date(
      Date.now() + phaseDurationSeconds * 1000
    ).toISOString()

    // Update Sociale timing so existing clients that read `sociales.phase_ends_at`
    // also get the right countdown target.
    const { error: socialeUpdateError } = await supabaseClient
      .from('sociales')
      .update({
        current_phase: nextPhase,
        phase_started_at: phaseStartedAt,
        phase_ends_at: phaseEndsAt,
        updated_at: phaseStartedAt,
      })
      .eq('id', socialeId)

    if (socialeUpdateError) throw socialeUpdateError

    const { error: phaseError } = await supabaseClient
      .from('sociale_round_state')
      .update({
        phase: nextPhase,
        phase_started_at: phaseStartedAt,
        phase_ends_at: phaseEndsAt,
        updated_at: phaseStartedAt,
      })
      .eq('id', currentRoundState.id)

    if (phaseError) throw phaseError

    const response: AdvanceSocialeResponse = {
      sociale,
      advanced: true,
      nextPhase,
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error advancing Sociale:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

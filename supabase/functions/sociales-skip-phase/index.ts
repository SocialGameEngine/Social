// =============================================================================
// SOCIALES SKIP PHASE EDGE FUNCTION
// =============================================================================
// Skips the current phase and advances to the next phase within the same round

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../types/database.ts'

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
    const body = await req.json()
    const { socialeId } = body

    if (!socialeId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: socialeId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the Sociale and verify ownership
    const { data: sociale, error: fetchError } = await supabaseClient
      .from('sociales')
      .select('*')
      .eq('id', socialeId)
      .eq('created_by', user.id)
      .single()

    if (fetchError || !sociale) {
      return new Response(
        JSON.stringify({ error: 'Sociale not found or unauthorized' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify Sociale is active
    if (sociale.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Can only skip phases in active Sociales' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current round
    const { data: round, error: roundError } = await supabaseClient
      .from('sociale_rounds')
      .select('*')
      .eq('id', sociale.current_round_id)
      .single()

    if (roundError || !round) {
      return new Response(
        JSON.stringify({ error: 'Current round not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const currentPhase = sociale.current_phase
    const phaseSequence = round.phase_sequence || ['answer', 'vote', 'results']
    const currentPhaseIndex = phaseSequence.indexOf(currentPhase)
    
    if (currentPhaseIndex === -1) {
      return new Response(
        JSON.stringify({ error: 'Invalid current phase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const nextPhaseIndex = currentPhaseIndex + 1
    let nextPhase: string | null = null
    let phaseDuration = 30 // default

    if (nextPhaseIndex < phaseSequence.length) {
      // Move to next phase
      nextPhase = phaseSequence[nextPhaseIndex]
      
      // Set duration based on phase type
      switch (nextPhase) {
        case 'answer':
          phaseDuration = round.settings?.answerSeconds || 90
          break
        case 'vote':
          phaseDuration = round.settings?.votingSeconds || 30
          break
        case 'results':
          phaseDuration = round.settings?.resultsSeconds || 15
          break
      }
    } else {
      // No more phases in this round, skip to next round
      // This is equivalent to skip-round functionality
      const { data: updatedSociale, error: skipError } = await supabaseClient
        .from('sociales')
        .update({
          current_round_index: (sociale.current_round_index || 0) + 1,
          current_phase: null, // Will be set by the round skip logic
          phase_started_at: null,
          phase_ends_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', socialeId)
        .select()
        .single()

      if (skipError) throw skipError

      return new Response(
        JSON.stringify({ 
          sociale: updatedSociale,
          message: 'Phase sequence complete, advancing to next round'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update Sociale with new phase
    const { data: updatedSociale, error: updateError } = await supabaseClient
      .from('sociales')
      .update({
        current_phase: nextPhase,
        phase_started_at: new Date().toISOString(),
        phase_ends_at: new Date(Date.now() + phaseDuration * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', socialeId)
      .select()
      .single()

    if (updateError) throw updateError

    // Update round state
    const { error: stateError } = await supabaseClient
      .from('sociale_round_state')
      .upsert({
        sociale_id: socialeId,
        round_id: round.id,
        status: 'active',
        phase: nextPhase,
        phase_started_at: new Date().toISOString(),
        phase_ends_at: new Date(Date.now() + phaseDuration * 1000).toISOString(),
      })

    if (stateError) throw stateError

    return new Response(
      JSON.stringify({ 
        sociale: updatedSociale,
        nextPhase,
        phaseDuration,
        message: `Advanced from ${currentPhase} to ${nextPhase}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error skipping phase:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

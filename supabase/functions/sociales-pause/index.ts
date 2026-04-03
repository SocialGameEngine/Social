// =============================================================================
// SOCIALES PAUSE EDGE FUNCTION
// =============================================================================
// Pauses or resumes a Sociale

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../types/database.ts'
import type { PauseSocialeRequest, PauseSocialeResponse } from '../../apps/top-comment/src/domain/types/sociale.types.ts'

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
    const body: PauseSocialeRequest = await req.json()
    const { socialeId, pause } = body

    if (!socialeId || typeof pause !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: socialeId, pause' }),
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
        JSON.stringify({ error: 'Must be host of the room to pause/resume Sociale' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify Sociale is active or paused (can pause from active, resume from paused)
    if (!['active', 'paused'].includes(sociale.status)) {
      return new Response(
        JSON.stringify({ error: 'Sociale must be active or paused to pause/resume' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the Sociale status and phase timing
    const newStatus = pause ? 'paused' : 'active'
    let updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }
    
    // Calculate timer duration for resume
    let timerDuration = 90; // Default fallback duration
    
    // Handle phase timing
    if (pause) {
      // Pausing: clear phase_ends_at to stop the timer
      updateData.phase_ends_at = null
    } else {
      // Resuming: set phase_ends_at to resume timer
      // Get current round to determine timer duration
      const { data: currentRound } = await supabaseClient
        .from('sociale_rounds')
        .select('settings')
        .eq('id', sociale.current_round_id)
        .single()
      
      timerDuration = (currentRound?.settings as any)?.answerSeconds ?? 90
      
      if (timerDuration > 0) {
        updateData.phase_ends_at = new Date(
          Date.now() + timerDuration * 1000
        ).toISOString()
      }
    }
    
    const { data: updatedSociale, error: updateError } = await supabaseClient
      .from('sociales')
      .update(updateData)
      .eq('id', socialeId)
      .select()
      .single()

    if (updateError) throw updateError

    // If pausing, also pause current round state and clear timing
    if (pause) {
      await supabaseClient
        .from('sociale_round_state')
        .update({
          status: 'paused',
          phase_ends_at: null, // Clear timing when paused
          updated_at: new Date().toISOString(),
        })
        .eq('sociale_id', socialeId)
        .eq('status', 'active')
    } else {
      // If resuming, resume current round state and set timing
      const phaseEndsAt = new Date(
        Date.now() + timerDuration * 1000
      ).toISOString()
      
      await supabaseClient
        .from('sociale_round_state')
        .update({
          status: 'active',
          phase_ends_at: phaseEndsAt,
          updated_at: new Date().toISOString(),
        })
        .eq('sociale_id', socialeId)
        .eq('status', 'paused')
    }

    // Return the updated Sociale
    const response: PauseSocialeResponse = {
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
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error pausing/resuming Sociale:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

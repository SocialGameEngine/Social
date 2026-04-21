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
      // Calculate remaining seconds from current phase_ends_at
      let remainingSeconds = 0;
      if (sociale.phase_ends_at) {
        const endsAt = new Date(sociale.phase_ends_at).getTime();
        const now = Date.now();
        remainingSeconds = Math.max(0, Math.ceil((endsAt - now) / 1000));
      }
      
      updateData.phase_ends_at = null;
      updateData.paused_remaining_seconds = remainingSeconds;
    } else {
      // Resuming: use stored remaining seconds, NOT full duration
      const remainingSeconds = sociale.paused_remaining_seconds ?? 0;
      
      if (remainingSeconds > 0) {
        updateData.phase_ends_at = new Date(
          Date.now() + remainingSeconds * 1000
        ).toISOString();
      }
      updateData.paused_remaining_seconds = null; // Clear after resume
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
      // Calculate remaining for round state too
      const { data: currentRoundState } = await supabaseClient
        .from('sociale_round_state')
        .select('phase_ends_at')
        .eq('sociale_id', socialeId)
        .eq('status', 'active')
        .maybeSingle();
      
      let roundRemaining = 0;
      if (currentRoundState?.phase_ends_at) {
        const endsAt = new Date(currentRoundState.phase_ends_at).getTime();
        roundRemaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      }
      
      await supabaseClient
        .from('sociale_round_state')
        .update({
          status: 'paused',
          phase_ends_at: null,
          paused_remaining_seconds: roundRemaining,
          updated_at: new Date().toISOString(),
        })
        .eq('sociale_id', socialeId)
        .eq('status', 'active');
    } else {
      // Resume: use stored remaining seconds from round state
      const { data: pausedRoundState } = await supabaseClient
        .from('sociale_round_state')
        .select('paused_remaining_seconds')
        .eq('sociale_id', socialeId)
        .eq('status', 'paused')
        .maybeSingle();
      
      const roundRemaining = pausedRoundState?.paused_remaining_seconds ?? 0;
      const phaseEndsAt = roundRemaining > 0
        ? new Date(Date.now() + roundRemaining * 1000).toISOString()
        : null;
      
      await supabaseClient
        .from('sociale_round_state')
        .update({
          status: 'active',
          phase_ends_at: phaseEndsAt,
          paused_remaining_seconds: null,
          updated_at: new Date().toISOString(),
        })
        .eq('sociale_id', socialeId)
        .eq('status', 'paused');
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

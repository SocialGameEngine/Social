// =============================================================================
// SOCIALES BREAK EDGE FUNCTION (P1-8)
// =============================================================================
// Parks the sociale in a "break" phase for N minutes so the host can run an
// intermission. Current round state is paused (time remaining is stashed) so
// it can be resumed cleanly afterward. A follow-up call with { resume: true }
// restores the previous phase and remaining timer.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../types/database.ts'

interface StartBreakRequest {
  socialeId: string
  /** Duration of the break in minutes. Allowed: 5, 10, 15. */
  minutes?: 5 | 10 | 15
  /** Pass true to end the break early and resume the prior phase. */
  resume?: boolean
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
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

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = (await req.json()) as StartBreakRequest
    const { socialeId, minutes, resume } = body

    if (!socialeId) {
      return new Response(
        JSON.stringify({ error: 'Missing socialeId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (!resume && ![5, 10, 15].includes(Number(minutes))) {
      return new Response(
        JSON.stringify({ error: 'minutes must be 5, 10, or 15' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: sociale, error: fetchError } = await supabaseClient
      .from('sociales')
      .select('*')
      .eq('id', socialeId)
      .single()
    if (fetchError || !sociale) {
      return new Response(JSON.stringify({ error: 'Sociale not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: membership } = await supabaseClient
      .from('room_memberships')
      .select('id')
      .eq('room_id', sociale.room_id)
      .eq('user_id', user.id)
      .eq('is_host', true)
      .single()
    if (!membership) {
      return new Response(JSON.stringify({ error: 'Must be host' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const nowIso = new Date().toISOString()

    if (resume) {
      // Flip the sociale out of break and re-activate any paused round state.
      const runtime = (sociale.runtime_state as any) || {}
      const priorPhase = runtime?.break?.priorPhase ?? 'answer'
      const priorRemaining = runtime?.break?.priorRemainingSeconds ?? 60

      const newEndsAt = new Date(Date.now() + priorRemaining * 1000).toISOString()

      const { data: updated, error: updErr } = await supabaseClient
        .from('sociales')
        .update({
          current_phase: priorPhase,
          phase_started_at: nowIso,
          phase_ends_at: newEndsAt,
          runtime_state: { ...runtime, break: null },
          updated_at: nowIso,
        })
        .eq('id', socialeId)
        .select()
        .single()
      if (updErr) throw updErr

      // Reactivate any paused round state.
      await supabaseClient
        .from('sociale_round_state')
        .update({
          status: 'active',
          phase: priorPhase,
          phase_started_at: nowIso,
          phase_ends_at: newEndsAt,
          paused_remaining_seconds: null,
          updated_at: nowIso,
        })
        .eq('sociale_id', socialeId)
        .eq('status', 'paused')

      return new Response(JSON.stringify({ sociale: updated, resumed: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Starting a break: stash the current phase and remaining time so we can
    // resume without losing player context.
    const prevEndsAt = sociale.phase_ends_at
      ? new Date(sociale.phase_ends_at).getTime()
      : null
    const priorRemainingSeconds = prevEndsAt
      ? Math.max(0, Math.ceil((prevEndsAt - Date.now()) / 1000))
      : 0
    const priorPhase = sociale.current_phase ?? 'answer'

    const breakMs = Number(minutes) * 60 * 1000
    const breakEndsAt = new Date(Date.now() + breakMs).toISOString()

    const runtimeState = (sociale.runtime_state as any) || {}
    runtimeState.break = {
      priorPhase,
      priorRemainingSeconds,
      startedAt: nowIso,
      minutes: Number(minutes),
    }

    const { data: updated, error: updErr } = await supabaseClient
      .from('sociales')
      .update({
        current_phase: 'break',
        phase_started_at: nowIso,
        phase_ends_at: breakEndsAt,
        runtime_state: runtimeState,
        updated_at: nowIso,
      })
      .eq('id', socialeId)
      .select()
      .single()
    if (updErr) throw updErr

    // Pause the current round state so its timer doesn't keep ticking.
    await supabaseClient
      .from('sociale_round_state')
      .update({
        status: 'paused',
        phase_ends_at: null,
        paused_remaining_seconds: priorRemainingSeconds,
        updated_at: nowIso,
      })
      .eq('sociale_id', socialeId)
      .eq('status', 'active')

    return new Response(
      JSON.stringify({ sociale: updated, break: runtimeState.break }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('sociales-break error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

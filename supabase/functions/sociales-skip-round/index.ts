// =============================================================================
// SOCIALES SKIP ROUND EDGE FUNCTION
// =============================================================================
// Skips the current round and advances to the next one

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
        JSON.stringify({ error: 'Can only skip rounds in active Sociales' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all rounds for this Sociale
    const { data: rounds, error: roundsError } = await supabaseClient
      .from('sociale_rounds')
      .select('*')
      .eq('sociale_id', socialeId)
      .order('order_index', { ascending: true })

    if (roundsError || !rounds || rounds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No rounds found for this Sociale' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const currentRoundIndex = sociale.current_round_index || 0
    const nextRoundIndex = currentRoundIndex + 1

    // Check if there's a next round
    if (nextRoundIndex >= rounds.length) {
      // No more rounds, end the Sociale
      const { data: updatedSociale, error: endError } = await supabaseClient
        .from('sociales')
        .update({
          status: 'completed',
          current_phase: null,
          phase_started_at: null,
          phase_ends_at: null,
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', socialeId)
        .select()
        .single()

      if (endError) throw endError

      return new Response(
        JSON.stringify({ 
          sociale: updatedSociale,
          message: 'Sociale completed - no more rounds'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the next round
    const nextRound = rounds[nextRoundIndex]

    // Ensure we only ever have one active round_state per sociale.
    // If previous rounds were skipped without ending their state, we can end up
    // with multiple rows where status='active', which breaks sociales-advance.
    const nowIso = new Date().toISOString()
    await supabaseClient
      .from('sociale_round_state')
      .update({
        status: 'ended',
        ended_at: nowIso,
        updated_at: nowIso,
      })
      .eq('sociale_id', socialeId)
      .eq('status', 'active')
      // Keep the next round active (we'll upsert it right after).
      .neq('round_id', nextRound.id)

    // Update Sociale to next round
    const { data: updatedSociale, error: updateError } = await supabaseClient
      .from('sociales')
      .update({
        current_round_index: nextRoundIndex,
        current_round_id: nextRound.id,
        current_phase: 'answer', // Start with answer phase
        phase_started_at: nowIso,
        phase_ends_at: new Date(Date.now() + (nextRound.settings?.answerSeconds || 90) * 1000).toISOString(),
        updated_at: nowIso,
      })
      .eq('id', socialeId)
      .select()
      .single()

    if (updateError) throw updateError

    // Create round state for the new round
    const { error: stateError } = await supabaseClient
      .from('sociale_round_state')
      .upsert({
        sociale_id: socialeId,
        round_id: nextRound.id,
        status: 'active',
        phase: 'answer',
        phase_started_at: nowIso,
        phase_ends_at: new Date(
          Date.now() + (nextRound.settings?.answerSeconds || 90) * 1000
        ).toISOString(),
      })

    if (stateError) throw stateError

    return new Response(
      JSON.stringify({ 
        sociale: updatedSociale,
        nextRound: {
          id: nextRound.id,
          type: nextRound.type,
          content: nextRound.content,
          orderIndex: nextRound.order_index,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error skipping round:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

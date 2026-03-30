// =============================================================================
// SOCIALES END EDGE FUNCTION
// =============================================================================
// Ends a Sociale and calculates final scores

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../types/database.ts'
import type { EndSocialeRequest, EndSocialeResponse } from '../../apps/top-comment/src/domain/types/sociale.types.ts'

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
    const body: EndSocialeRequest = await req.json()
    const { socialeId } = body

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
        JSON.stringify({ error: 'Must be host of the room to end Sociale' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify Sociale is active or paused
    if (!['active', 'paused'].includes(sociale.status)) {
      return new Response(
        JSON.stringify({ error: 'Sociale must be active or paused to end' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all Socialites for final scoreboard
    const { data: socialites, error: socialitesError } = await supabaseClient
      .from('socialites')
      .select('*')
      .eq('sociale_id', socialeId)
      .eq('is_active', true)
      .order('score', { ascending: false })

    if (socialitesError) throw socialitesError

    // Build final scoreboard
    const finalScoreboard = socialites.map((socialite, index) => ({
      socialiteId: socialite.id,
      displayName: socialite.display_name,
      mascotId: socialite.mascot_id,
      score: socialite.score,
      rank: index + 1,
    }))

    // Update the Sociale to ended status
    const { data: updatedSociale, error: updateError } = await supabaseClient
      .from('sociales')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        scoreboard: finalScoreboard,
        updated_at: new Date().toISOString(),
      })
      .eq('id', socialeId)
      .select()
      .single()

    if (updateError) throw updateError

    // End all active round states
    await supabaseClient
      .from('sociale_round_state')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('sociale_id', socialeId)
      .in('status', ['active', 'paused'])

    // Create analytics summary
    const { data: responses, error: responsesError } = await supabaseClient
      .from('sociale_responses')
      .select('*')
      .eq('sociale_id', socialeId)

    if (responsesError) throw responsesError

    const { data: votes, error: votesError } = await supabaseClient
      .from('sociale_votes')
      .select('*')
      .eq('sociale_id', socialeId)

    if (votesError) throw votesError

    const analytics = {
      totalResponses: responses?.length || 0,
      totalVotes: votes?.length || 0,
      participantCount: socialites.length,
      averageScore: socialites.length > 0 
        ? socialites.reduce((sum, s) => sum + s.score, 0) / socialites.length 
        : 0,
      duration: sociale.started_at 
        ? new Date().getTime() - new Date(sociale.started_at).getTime()
        : 0,
    }

    // Store analytics
    await supabaseClient
      .from('sociale_analytics')
      .insert({
        sociale_id: socialeId,
        analytics,
        created_at: new Date().toISOString(),
      })

    // Return the updated Sociale
    const response: EndSocialeResponse = {
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
      finalScoreboard,
      analytics,
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error ending Sociale:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// =============================================================================
// SOCIALES JOIN EDGE FUNCTION
// =============================================================================
// Allows a user to join a Sociale as a Socialite

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../types/database.ts'
import type { JoinSocialeRequest } from '../../apps/top-comment/src/domain/types/sociale.types.ts'

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
    const body: JoinSocialeRequest = await req.json()
    const { socialeId, displayName, mascotId, joinNextRound = false } = body

    if (!socialeId || !displayName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: socialeId, displayName' }),
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

    // Verify user is a member of the room
    const { data: membership, error: membershipError } = await supabaseClient
      .from('room_memberships')
      .select('*')
      .eq('room_id', sociale.room_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({ error: 'Must be a member of the room to join Sociale' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is already a Socialite (idempotent join behavior).
    // If duplicate historical rows exist, pick the latest one.
    const { data: existingSocialite, error: existingSocialiteError } = await supabaseClient
      .from('socialites')
      .select('*')
      .eq('sociale_id', socialeId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingSocialiteError) throw existingSocialiteError

    if (existingSocialite) {
      return new Response(
        JSON.stringify({ socialite: existingSocialite }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify Sociale is joinable
    if (!['draft', 'lobby', 'active', 'paused'].includes(sociale.status)) {
      return new Response(
        JSON.stringify({ error: 'Sociale is not joinable' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const isLive = sociale.status === 'active' || sociale.status === 'paused'
    if (isLive && !joinNextRound) {
      return new Response(
        JSON.stringify({
          error: 'This Sociale is in progress. Join from the room with “Join next round”.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (!isLive && joinNextRound) {
      return new Response(
        JSON.stringify({ error: 'Join next round is only available during a live game.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const pendingUntilRoundIndex =
      joinNextRound && isLive ? (sociale.current_round_index ?? 0) + 1 : null

    // Create the Socialite
    const { data: socialite, error: createError } = await supabaseClient
      .from('socialites')
      .insert({
        sociale_id: socialeId,
        room_id: sociale.room_id,
        user_id: user.id,
        membership_id: membership.id,
        display_name: displayName,
        mascot_id: mascotId || null,
        is_host: membership.is_host,
        is_active: pendingUntilRoundIndex === null,
        is_banned: false,
        pending_until_round_index: pendingUntilRoundIndex,
        score: 0,
        joined_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) throw createError

    return new Response(JSON.stringify({ socialite }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error joining Sociale:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

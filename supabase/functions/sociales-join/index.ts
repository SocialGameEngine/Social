// =============================================================================
// SOCIALES JOIN EDGE FUNCTION
// =============================================================================
// Allows a user to join a Sociale as a Socialite

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../types/database.ts'
import type { JoinSocialeRequest, JoinSocialeResponse } from '../../apps/top-comment/src/domain/types/sociale.types.ts'

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
    const { socialeId, displayName, mascotId } = body

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

    // Check if user is already a Socialite
    const { data: existingSocialite, error: existingError } = await supabaseClient
      .from('socialites')
      .select('*')
      .eq('sociale_id', socialeId)
      .eq('user_id', user.id)
      .single()

    if (existingSocialite && !existingError) {
      return new Response(
        JSON.stringify({ error: 'Already joined this Sociale' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify Sociale is joinable
    if (!['draft', 'active', 'paused'].includes(sociale.status)) {
      return new Response(
        JSON.stringify({ error: 'Sociale is not joinable' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
        is_active: true,
        is_banned: false,
        score: 0,
        joined_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) throw createError

    // Return the created Socialite
    const response: JoinSocialeResponse = {
      socialite: {
        id: socialite.id,
        socialeId: socialite.sociale_id,
        roomId: socialite.room_id,
        userId: socialite.user_id,
        membershipId: socialite.membership_id,
        displayName: socialite.display_name,
        mascotId: socialite.mascot_id,
        isHost: socialite.is_host,
        isActive: socialite.is_active,
        isBanned: socialite.is_banned,
        score: socialite.score,
        joinedAt: socialite.joined_at,
        lastSeenAt: socialite.last_seen_at,
        createdAt: socialite.created_at,
        updatedAt: socialite.updated_at,
      },
    }

    return new Response(
      JSON.stringify(response),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error joining Sociale:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

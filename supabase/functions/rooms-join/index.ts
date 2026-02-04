import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface JoinRoomRequest {
  code: string;
  teamName: string;
  mascotId?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { data: { user }, error: authError } = await createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    ).auth.getUser()

    const requestData: JoinRoomRequest = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get room details
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', requestData.code)
      .single()

    if (roomError || !roomData) {
      return new Response(
        JSON.stringify({ error: 'Room not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Check if room is archived
    if (roomData.status === 'archived') {
      return new Response(
        JSON.stringify({ error: 'Cannot join an archived room' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if room is at capacity
    const { data: existingMemberships } = await supabase
      .from('room_memberships')
      .select('id')
      .eq('room_id', roomData.id)
      .eq('is_banned', false)

    if (existingMemberships && existingMemberships.length >= roomData.max_players) {
      return new Response(
        JSON.stringify({ error: 'Room is at maximum capacity' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if user is already in room
    if (user) {
      const { data: existingMembership } = await supabase
        .from('room_memberships')
        .select('*')
        .eq('room_id', roomData.id)
        .eq('user_id', user.id)
        .single()

      if (existingMembership) {
        if (existingMembership.is_banned) {
          return new Response(
            JSON.stringify({ error: 'You are banned from this room' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
          )
        }
        return new Response(
          JSON.stringify({ error: 'You are already in this room' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    // Check if team name is already taken (for anonymous users)
    if (!user) {
      const { data: existingAnonymous } = await supabase
        .from('room_memberships')
        .select('id')
        .eq('room_id', roomData.id)
        .eq('team_name', requestData.teamName)
        .is('user_id', null)
        .single()

      if (existingAnonymous) {
        return new Response(
          JSON.stringify({ error: 'Team name is already taken in this room' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    const membershipData: any = {
      room_id: roomData.id,
      team_name: requestData.teamName,
      mascot_id: requestData.mascotId,
      is_host: false,
      is_banned: false,
    }

    if (user) {
      membershipData.user_id = user.id
    }

    // Set status based on room settings
    const requiresApproval = roomData.settings?.requireApproval ?? false
    membershipData.status = requiresApproval ? 'pending' : 'active'

    const { data: membership, error: membershipError } = await supabase
      .from('room_memberships')
      .insert(membershipData)
      .select()
      .single()

    if (membershipError) {
      return new Response(
        JSON.stringify({ error: membershipError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({
        room: roomData,
        membership,
        requiresApproval,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

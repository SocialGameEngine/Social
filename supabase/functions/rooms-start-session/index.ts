import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StartSessionInRoomRequest {
  roomId: string;
  sessionSettings: {
    answerSecs: number;
    voteSecs: number;
    resultsSecs: number;
    maxTeams: number;
    gameMode?: "classic" | "mashup";
    totalRounds?: number;
    selectedLibraries?: string[];
  };
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

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const requestData: StartSessionInRoomRequest = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user is host
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', requestData.roomId)
      .single()

    if (roomError || !roomData) {
      return new Response(
        JSON.stringify({ error: 'Room not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    if (roomData.host_uid !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Only the host can start a session' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Check if room already has active session
    if (roomData.current_session_id) {
      return new Response(
        JSON.stringify({ error: 'Room already has an active session' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get active room members
    const { data: memberships, error: membershipError } = await supabase
      .from('room_memberships')
      .select('*')
      .eq('room_id', requestData.roomId)
      .eq('is_banned', false)
      .in('status', ['active', 'approved'])

    if (membershipError || !memberships || memberships.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No active members in room' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create session
    const sessionData = {
      code: roomData.code,
      host_uid: user.id,
      status: 'lobby',
      room_id: requestData.roomId,
      settings: requestData.sessionSettings,
      auto_assigned_players: memberships.map(m => m.id),
    }

    const { data: session, error: sessionError } = await supabase
      .from('top_comment_sessions')
      .insert(sessionData)
      .select()
      .single()

    if (sessionError) {
      return new Response(
        JSON.stringify({ error: sessionError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Update room with current session
    await supabase
      .from('rooms')
      .update({ current_session_id: session.id })
      .eq('id', requestData.roomId)

    // Create players from room memberships
    const players = memberships.map(membership => ({
      id: crypto.randomUUID(),
      session_id: session.id,
      user_id: membership.user_id, // Always has UUID with anonymous auth
      display_name: membership.player_name, // Using player_name field
      score: 0,
      joined_at: new Date().toISOString(),
    }))

    // Insert players
    const { data: createdPlayers, error: playersError } = await supabase
      .from('top_comment_players')
      .insert(players)
      .select()

    if (playersError) {
      // Rollback session creation
      await supabase.from('top_comment_sessions').delete().eq('id', session.id)
      await supabase.from('rooms').update({ current_session_id: null }).eq('id', requestData.roomId)
      return new Response(
        JSON.stringify({ error: playersError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({
        session,
        assignedPlayers: createdPlayers,
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

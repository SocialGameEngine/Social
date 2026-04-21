import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EndSessionInRoomRequest {
  roomId: string;
  sessionId: string;
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

    const requestData: EndSessionInRoomRequest = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user is host
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('host_uid, current_session_id')
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
        JSON.stringify({ error: 'Only the host can end a session' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Verify session belongs to room
    if (roomData.current_session_id !== requestData.sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session does not belong to this room' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get session details
    const { data: sessionData, error: sessionError } = await supabase
      .from('top_comment_sessions')
      .select('status')
      .eq('id', requestData.sessionId)
      .single()

    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Check if session is already ended
    if (sessionData.status === 'ended') {
      return new Response(
        JSON.stringify({ error: 'Session is already ended' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // End the session
    const { error: updateError } = await supabase
      .from('top_comment_sessions')
      .update({ 
        status: 'ended',
        ended_at: new Date().toISOString(),
        ended_by_host: true
      })
      .eq('id', requestData.sessionId)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Update room to clear current session and increment session count
    const { error: roomUpdateError } = await supabase
      .from('rooms')
      .update({ 
        current_session_id: null,
        total_sessions_played: roomData.total_sessions_played + 1
      })
      .eq('id', requestData.roomId)

    if (roomUpdateError) {
      // This is not critical, but we should log it
      console.error('Failed to update room session count:', roomUpdateError)
    }

    // Update room members' last active time
    await supabase
      .from('room_memberships')
      .update({ last_active_at: new Date().toISOString() })
      .eq('room_id', requestData.roomId)
      .eq('is_banned', false)

    return new Response(
      JSON.stringify({
        success: true,
        returnedToLobby: true,
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

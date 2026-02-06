import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateRoomRequest {
  name?: string;
  description?: string;
  maxPlayers?: number;
  settings?: {
    maxPlayers?: number;
    allowPlayerChat?: boolean;
    autoStartSession?: boolean;
    defaultSessionSettings?: any;
    requireApproval?: boolean;
    allowAnonymous?: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    const requestData: CreateRoomRequest = await req.json()

    // Generate unique room code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let roomCode = ''
    let attempts = 0
    const maxAttempts = 100

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    while (attempts < maxAttempts) {
      roomCode = ''
      for (let i = 0; i < 6; i++) {
        roomCode += characters.charAt(Math.floor(Math.random() * characters.length))
      }

      // Check if code is already taken
      const { data: existingRoom } = await supabase
        .from('rooms')
        .select('code')
        .eq('code', roomCode)
        .single()

      if (!existingRoom) {
        break
      }
      attempts++
    }

    if (attempts >= maxAttempts) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate unique room code' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Create room
    const roomData = {
      code: roomCode,
      host_uid: user.id,
      name: requestData.name,
      description: requestData.description,
      max_players: requestData.maxPlayers || 50,
      settings: {
        maxPlayers: requestData.maxPlayers || 50,
        allowPlayerChat: requestData.settings?.allowPlayerChat ?? true,
        autoStartSession: requestData.settings?.autoStartSession ?? false,
        defaultSessionSettings: requestData.settings?.defaultSessionSettings || {},
        requireApproval: requestData.settings?.requireApproval ?? false,
        allowAnonymous: requestData.settings?.allowAnonymous ?? true,
        ...requestData.settings,
      },
    }

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single()

    if (roomError) {
      return new Response(
        JSON.stringify({ error: roomError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Create host membership
    const membershipData = {
      room_id: room.id,
      user_id: user.id,
      team_name: "Host",
      is_host: true,
      status: 'active',
    }

    const { data: membership, error: membershipError } = await supabase
      .from('room_memberships')
      .insert(membershipData)
      .select()
      .single()

    if (membershipError) {
      // Rollback room creation if membership fails
      await supabase.from('rooms').delete().eq('id', room.id)
      return new Response(
        JSON.stringify({ error: membershipError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({
        room,
        membership,
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

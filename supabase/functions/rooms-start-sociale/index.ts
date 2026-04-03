// =============================================================================
// ROOMS START SOCIALE EDGE FUNCTION
// =============================================================================
// Orchestrates starting a Sociale in a room with pointer management
// Mirrors rooms-start-session behavior for Sociales
//
// This function is part of the Sessions -> Sociales migration and ensures
// proper room pointer management (rooms.current_sociale_id) for real-time updates.
// Combined with the real-time DELETE events fix, this enables reliable
// Sociale lifecycle management with proper UI synchronization.

// deno-lint-ignore no-explicit-any
// deno-lint-ignore no-external-import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// deno-lint-ignore no-external-import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// deno-lint-ignore no-explicit-any
// deno-lint-ignore no-external-import
// deno-lint-ignore no-namespace
// deno-lint-ignore no-undef

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StartSocialeInRoomRequest {
  roomId: string;
  socialeSettings?: {
    socialeId?: string; // If provided, start existing draft Sociale
    id?: string; // Frontend sends 'id' instead of 'socialeId'
    title?: string;
    description?: string;
    mode?: string;
    totalRounds?: number;
    // deno-lint-ignore no-explicit-any
  settings?: any;
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { data: { user }, error: authError } = await createClient(
      // deno-lint-ignore no-namespace no-undef
      Deno.env.get('SUPABASE_URL') ?? '',
      // deno-lint-ignore no-namespace no-undef
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

    const requestData: StartSocialeInRoomRequest = await req.json()

    console.log('Request data:', JSON.stringify(requestData, null, 2))

    const supabase = createClient(
      // deno-lint-ignore no-namespace no-undef
      Deno.env.get('SUPABASE_URL') ?? '',
      // deno-lint-ignore no-namespace no-undef
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user is host
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', requestData.roomId)
      .single()

    console.log('Room data:', JSON.stringify(roomData, null, 2))

    if (roomError || !roomData) {
      return new Response(
        JSON.stringify({ error: 'Room not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    if (roomData.host_uid !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Only the host can start a Sociale' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // If room already has a current Sociale, start that one (draft → lobby/active)
    // Otherwise, use the socialeId from request (legacy support)
    let targetSocialeId = roomData.current_sociale_id;

    if (!targetSocialeId && requestData.socialeSettings?.socialeId) {
      targetSocialeId = requestData.socialeSettings.socialeId;
    }

    // Handle case where frontend sends 'id' instead of 'socialeId'
    if (!targetSocialeId && requestData.socialeSettings?.id) {
      targetSocialeId = requestData.socialeSettings.id;
    }

    if (!targetSocialeId) {
      return new Response(
        JSON.stringify({ error: 'No Sociale to start - create one first or provide socialeId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get active room members
    console.log('Fetching room members for room:', requestData.roomId)
    const { data: memberships, error: membershipError } = await supabase
      .from('room_memberships')
      .select('*')
      .eq('room_id', requestData.roomId)
      .eq('is_banned', false)
      .in('status', ['active', 'approved'])

    console.log('Room members fetch result:', { memberships, error: membershipError, count: memberships?.length })

    if (membershipError || !memberships || memberships.length === 0) {
      console.error('No active members in room:', membershipError)
      return new Response(
        JSON.stringify({ error: 'No active members in room', details: membershipError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get the Sociale
    console.log(`Fetching Sociale with ID: ${targetSocialeId}`)
    const { data: sociale, error: socialeError } = await supabase
      .from('sociales')
      .select('*')
      .eq('id', targetSocialeId)
      .single()

    console.log('Sociale fetch result:', { sociale, error: socialeError })

    if (socialeError || !sociale) {
      return new Response(
        JSON.stringify({ error: 'Sociale not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Verify Sociale belongs to this room
    if (sociale.room_id !== requestData.roomId) {
      return new Response(
        JSON.stringify({ error: 'Sociale does not belong to this room' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Verify Sociale is in draft or lobby status
    if (!['draft', 'lobby'].includes(sociale.status)) {
      return new Response(
        JSON.stringify({ error: 'Sociale must be in draft or lobby status to start' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get the first round
    console.log('Fetching first round for Sociale:', targetSocialeId)
    const { data: firstRound, error: roundError } = await supabase
      .from('sociale_rounds')
      .select('*')
      .eq('sociale_id', targetSocialeId)
      .eq('order_index', 0)
      .single()

    console.log('Round fetch result:', { firstRound, error: roundError })

    if (roundError || !firstRound) {
      console.error('No rounds found for Sociale:', roundError)
      return new Response(
        JSON.stringify({ error: 'No rounds found for this Sociale', details: roundError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get existing Socialites who have explicitly joined the Sociale
    // NOTE: We do NOT auto-create socialites for all room members anymore.
    // Players must explicitly join the Sociale via the sociales-join edge function.
    // This matches the expected behavior where only players who chose to join
    // participate in the game, not all room members.
    console.log('Fetching existing Socialites who joined...')
    const { data: existingSocialites } = await supabase
      .from('socialites')
      .select('*')
      .eq('sociale_id', targetSocialeId)
      .eq('is_active', true)

    console.log('Existing Socialites:', { existingSocialites, count: existingSocialites?.length })

    // Only auto-create a Socialite for the HOST if they don't have one yet
    // The host should always be part of the Sociale they're starting
    const hostMembership = memberships.find(m => m.is_host)
    if (hostMembership) {
      const hostAlreadyJoined = existingSocialites?.some(s => s.user_id === hostMembership.user_id)
      if (!hostAlreadyJoined) {
        console.log('Auto-creating Socialite for host:', hostMembership.user_id)
        const { error: hostSocialiteError } = await supabase
          .from('socialites')
          .insert({
            sociale_id: targetSocialeId,
            room_id: requestData.roomId,
            membership_id: hostMembership.id,
            user_id: hostMembership.user_id,
            display_name: hostMembership.player_name,
            mascot_id: hostMembership.mascot_id,
            is_host: true,
            score: 0,
            is_active: true,
            joined_at: new Date().toISOString(),
          })

        if (hostSocialiteError) {
          console.error('Failed to create host Socialite:', hostSocialiteError)
          // Non-fatal - host can still manage the game
        }
      }
    }

    // Start the Sociale
    const nowIso = new Date().toISOString()
    // deno-lint-ignore no-explicit-any
    const phaseDurationSeconds = (firstRound.settings as any)?.answerSeconds ?? 90
    const phaseEndsAt = new Date(Date.now() + phaseDurationSeconds * 1000).toISOString()

    console.log(`Starting Sociale ${targetSocialeId} with first round ${firstRound.id}`)

    const { data: updatedSociale, error: startError } = await supabase
      .from('sociales')
      .update({
        status: 'active',
        current_round_index: 0,
        current_round_id: firstRound.id,
        current_phase: 'answer',
        phase_started_at: nowIso,
        phase_ends_at: phaseEndsAt,
        started_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', targetSocialeId)
      .select()
      .single()

    if (startError) {
      console.error('Failed to start Sociale:', startError)
      return new Response(
        JSON.stringify({ error: `Failed to start Sociale: ${startError.message}`, details: startError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Create round state for the first round
    const { error: roundStateError } = await supabase
      .from('sociale_round_state')
      .insert({
        sociale_id: targetSocialeId,
        round_id: firstRound.id,
        status: 'active',
        phase: 'answer',
        started_at: nowIso,
        phase_started_at: nowIso,
        phase_ends_at: phaseEndsAt,
        created_at: nowIso,
        updated_at: nowIso,
      })

    if (roundStateError) {
      console.error('Failed to create round state:', roundStateError)
      return new Response(
        JSON.stringify({ error: `Failed to create round state: ${roundStateError.message}`, details: roundStateError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // ATOMIC OPERATION: Update room with current Sociale pointer LAST
    // This ensures all Sociale data is committed before the room pointer changes
    console.log('About to update room pointer - all Sociale data should be committed:', {
      socialeId: targetSocialeId,
      roomId: requestData.roomId,
      hasCurrentSocialeId: !!roomData.current_sociale_id,
    });

    if (!roomData.current_sociale_id) {
      const { error: roomUpdateError } = await supabase
        .from('rooms')
        .update({ current_sociale_id: targetSocialeId })
        .eq('id', requestData.roomId)

      console.log('Room pointer update result:', { error: roomUpdateError });

      if (roomUpdateError) {
        // Rollback everything
        await supabase
          .from('sociales')
          .update({ 
            status: 'draft',
            current_round_index: null,
            current_round_id: null,
            current_phase: null,
            phase_started_at: null,
            phase_ends_at: null,
            started_at: null,
          })
          .eq('id', targetSocialeId)

        await supabase
          .from('sociale_round_state')
          .delete()
          .eq('sociale_id', targetSocialeId)

        return new Response(
          JSON.stringify({ error: `Failed to update room pointer: ${roomUpdateError.message}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
    } else {
      console.log('Room already has current_sociale_id, skipping update');
    }

    // Get all Socialites for response
    const { data: allSocialites } = await supabase
      .from('socialites')
      .select('*')
      .eq('sociale_id', targetSocialeId)
      .eq('is_active', true)

    return new Response(
      JSON.stringify({
        sociale: updatedSociale,
        socialites: allSocialites || [],
        firstRound,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    // deno-lint-ignore no-explicit-any
    console.error('Error starting Sociale in room:', error)
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

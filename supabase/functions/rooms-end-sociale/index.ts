// =============================================================================
// ROOMS END SOCIALE EDGE FUNCTION
// =============================================================================
// Orchestrates ending or cancelling a Sociale in a room with pointer management
// Mirrors rooms-end-session behavior for Sociales

// deno-lint-ignore no-explicit-any
// deno-lint-ignore no-external-import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// deno-lint-ignore no-external-import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EndSocialeInRoomRequest {
  roomId: string;
  socialeId: string;
  mode?: 'end' | 'cancel'; // 'end' = completed, 'cancel' = cancelled
}

serve(async (req) => {
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

    const requestData: EndSocialeInRoomRequest = await req.json()
    const mode = requestData.mode ?? 'end'

    const supabase = createClient(
      // deno-lint-ignore no-namespace no-undef
      Deno.env.get('SUPABASE_URL') ?? '',
      // deno-lint-ignore no-namespace no-undef
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user is host
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('host_uid, current_sociale_id')
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
        JSON.stringify({ error: 'Only the host can end a Sociale' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Verify Sociale belongs to room
    if (roomData.current_sociale_id !== requestData.socialeId) {
      return new Response(
        JSON.stringify({ error: 'Sociale does not belong to this room or is not active' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get Sociale details
    const { data: socialeData, error: socialeError } = await supabase
      .from('sociales')
      .select('status, room_id, started_at')
      .eq('id', requestData.socialeId)
      .single()

    if (socialeError || !socialeData) {
      return new Response(
        JSON.stringify({ error: 'Sociale not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    const nowIso = new Date().toISOString()
    const targetStatus = mode === 'cancel' ? 'cancelled' : 'completed'
    const isAlreadyEnded = ['completed', 'cancelled'].includes(socialeData.status)

    // If Sociale is not already ended, update its status
    if (!isAlreadyEnded) {
      // Build update payload based on mode
      // deno-lint-ignore no-explicit-any
      const updatePayload: any = {
        status: targetStatus,
        ended_at: nowIso,
        updated_at: nowIso,
      }

      // If cancelling, clear phase fields
      if (mode === 'cancel') {
        updatePayload.current_round_index = null
        updatePayload.current_round_id = null
        updatePayload.current_phase = null
        updatePayload.phase_started_at = null
        updatePayload.phase_ends_at = null
      }

      // If ending (completing), calculate final scoreboard
      if (mode === 'end') {
        const { data: socialites, error: socialitesError } = await supabase
          .from('socialites')
          .select('*')
          .eq('sociale_id', requestData.socialeId)
          .eq('is_active', true)
          .order('score', { ascending: false })

        if (!socialitesError && socialites) {
          const finalScoreboard = socialites.map((socialite, index) => ({
            socialiteId: socialite.id,
            displayName: socialite.display_name,
            mascotId: socialite.mascot_id,
            score: socialite.score,
            rank: index + 1,
          }))
          updatePayload.scoreboard = finalScoreboard
        }
      }

      // End the Sociale
      const { error: updateError } = await supabase
        .from('sociales')
        .update(updatePayload)
        .eq('id', requestData.socialeId)

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      // End any active round states
      await supabase
        .from('sociale_round_state')
        .update({
          status: 'completed',
          ended_at: nowIso,
          updated_at: nowIso,
        })
        .eq('sociale_id', requestData.socialeId)
        .eq('status', 'active')
    }

    // Clear room pointer
    const { error: roomUpdateError } = await supabase
      .from('rooms')
      .update({
        current_sociale_id: null,
      })
      .eq('id', requestData.roomId)

    if (roomUpdateError) {
      console.error('Failed to clear room Sociale pointer:', roomUpdateError)
    }

    // Clean up guest memberships for this room immediately — guests can never
    // reclaim their session so there is no reason to keep them after a Sociale ends.
    await supabase.rpc('cleanup_guest_memberships_for_room', { p_room_id: requestData.roomId })

    // Update room members' last active time
    await supabase
      .from('room_memberships')
      .update({ last_active_at: nowIso })
      .eq('room_id', requestData.roomId)
      .eq('is_banned', false)

    // Create analytics if ending (not cancelling) and not already ended
    if (mode === 'end' && !isAlreadyEnded) {
      const { data: responses } = await supabase
        .from('sociale_responses')
        .select('*')
        .eq('sociale_id', requestData.socialeId)

      const { data: votes } = await supabase
        .from('sociale_votes')
        .select('*')
        .eq('sociale_id', requestData.socialeId)

      const { data: socialites } = await supabase
        .from('socialites')
        .select('score')
        .eq('sociale_id', requestData.socialeId)
        .eq('is_active', true)

      const analytics = {
        totalResponses: responses?.length || 0,
        totalVotes: votes?.length || 0,
        participantCount: socialites?.length || 0,
        averageScore: socialites && socialites.length > 0 
          ? socialites.reduce((sum, s) => sum + s.score, 0) / socialites.length 
          : 0,
        duration: socialeData.started_at 
          ? new Date().getTime() - new Date(socialeData.started_at).getTime()
          : 0,
      }

      await supabase
        .from('sociale_analytics')
        .insert({
          sociale_id: requestData.socialeId,
          category: 'summary',
          metric: 'completed',
          value: analytics,
          metadata: null,
          created_at: nowIso,
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode: mode,
        status: targetStatus,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    // deno-lint-ignore no-explicit-any
    console.error('Error ending Sociale in room:', error)
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

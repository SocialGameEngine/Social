// =============================================================================
// SOCIALES MODERATE BANTER EDGE FUNCTION
// =============================================================================
// Allows a host to moderate banter messages

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../types/database.ts'
import type { ModerateSocialeBanterRequest } from '../../apps/top-comment/src/domain/types/sociale.types.ts'

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
    const body: ModerateSocialeBanterRequest = await req.json()
    const { banterId, status, moderatedBy } = body

    if (!banterId || !status || !moderatedBy) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: banterId, status, moderatedBy' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'on_tv']
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid status. Must be one of: pending, approved, rejected, on_tv' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the banter message to verify it exists
    const { data: banter, error: banterError } = await supabaseClient
      .from('sociale_banter')
      .select('*')
      .eq('id', banterId)
      .single()

    if (banterError || !banter) {
      return new Response(
        JSON.stringify({ error: 'Banter message not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the Sociale to check if user is the host
    const { data: sociale, error: socialeError } = await supabaseClient
      .from('sociales')
      .select('room_id, created_by')
      .eq('id', banter.sociale_id)
      .single()

    if (socialeError || !sociale) {
      return new Response(
        JSON.stringify({ error: 'Sociale not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is the host of the room
    const { data: room, error: roomError } = await supabaseClient
      .from('rooms')
      .select('host_id')
      .eq('id', sociale.room_id)
      .single()

    if (roomError || !room) {
      return new Response(
        JSON.stringify({ error: 'Room not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Only the room host can moderate banter
    if (room.host_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Only the room host can moderate banter' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the banter message status
    const { data: updatedBanter, error: updateError } = await supabaseClient
      .from('sociale_banter')
      .update({
        status,
        moderated_at: new Date().toISOString(),
        moderated_by: moderatedBy,
      })
      .eq('id', banterId)
      .select()
      .single()

    if (updateError) throw updateError

    // Broadcast moderation event to the Sociale channel
    await supabaseClient.channel(`sociale_${banter.sociale_id}`).send({
      type: 'broadcast',
      event: 'banter.moderated',
      payload: {
        banter: updatedBanter,
        previousStatus: banter.status,
        newStatus: status,
        moderatedBy: moderatedBy,
        timestamp: new Date().toISOString(),
      }
    })

    // If approved, also broadcast to the general banter channel
    if (status === 'approved') {
      await supabaseClient.channel(`sociale_${banter.sociale_id}`).send({
        type: 'broadcast',
        event: 'banter.approved',
        payload: {
          banter: updatedBanter,
          timestamp: new Date().toISOString(),
        }
      })
    }

    return new Response(
      JSON.stringify({ banter: updatedBanter }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error moderating banter:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

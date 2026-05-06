// =============================================================================
// SOCIALES SUBMIT BANTER EDGE FUNCTION
// =============================================================================
// Allows a Socialite to submit a banter message

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../types/database.ts'
import type { SubmitSocialeBanterRequest, SocialeBanter } from '../../apps/top-comment/src/domain/types/sociale.types.ts'

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
    const body: SubmitSocialeBanterRequest = await req.json()
    const { socialeId, socialiteId, membershipId, displayName, content } = body

    if (!socialeId || !socialiteId || !displayName || !content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: socialeId, socialiteId, displayName, content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate content length
    if (content.length < 1 || content.length > 280) {
      return new Response(
        JSON.stringify({ error: 'Content must be between 1 and 280 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the Sociale to verify it exists and is active
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

    // Verify the socialite belongs to this user
    const { data: socialite, error: socialiteError } = await supabaseClient
      .from('socialites')
      .select('*')
      .eq('id', socialiteId)
      .eq('user_id', user.id)
      .single()

    if (socialiteError || !socialite) {
      return new Response(
        JSON.stringify({ error: 'Socialite not found or unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the socialite is a member of the sociale's room
    const { data: membership, error: membershipError } = await supabaseClient
      .from('room_memberships')
      .select('*')
      .eq('id', socialite.membership_id || '')
      .eq('room_id', sociale.room_id)
      .single()

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({ error: 'Not a member of this room' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the banter message
    const { data: banter, error: createError } = await supabaseClient
      .from('sociale_banter')
      .insert({
        sociale_id: socialeId,
        socialite_id: socialiteId,
        membership_id: membershipId,
        display_name: displayName,
        content: content.trim(),
        status: 'pending', // All messages start as pending for moderation
        upvote_count: 0,
      })
      .select()
      .single()

    if (createError) throw createError

    // Broadcast new banter message to the Sociale channel
    await supabaseClient.channel(`sociale_${socialeId}`).send({
      type: 'broadcast',
      event: 'banter.submitted',
      payload: {
        banter,
        timestamp: new Date().toISOString(),
      }
    })

    return new Response(
      JSON.stringify({ banter }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error submitting banter:', error)
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

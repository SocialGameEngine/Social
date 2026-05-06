// =============================================================================
// SOCIALES UPVOTE BANTER EDGE FUNCTION
// =============================================================================
// Allows a Socialite to upvote a banter message

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../types/database.ts'
import type { SubmitSocialeBanterUpvoteRequest } from '../../apps/top-comment/src/domain/types/sociale.types.ts'

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
    const body: SubmitSocialeBanterUpvoteRequest = await req.json()
    const { banterId, socialiteId } = body

    if (!banterId || !socialiteId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: banterId, socialiteId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the banter message to verify it exists and is approved
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

    // Only allow upvoting approved messages
    if (banter.status !== 'approved') {
      return new Response(
        JSON.stringify({ error: 'Cannot upvote unapproved message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Check if user already upvoted this banter
    const { data: existingUpvote, error: upvoteError } = await supabaseClient
      .from('sociale_banter_upvotes')
      .select('*')
      .eq('banter_id', banterId)
      .eq('socialite_id', socialiteId)
      .single()

    if (upvoteError && upvoteError.code !== 'PGRST116') { // PGRST116 is "not found"
      throw upvoteError
    }

    if (existingUpvote) {
      return new Response(
        JSON.stringify({ error: 'Already upvoted this banter message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Cannot upvote own message
    if (banter.socialite_id === socialiteId) {
      return new Response(
        JSON.stringify({ error: 'Cannot upvote own message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the upvote
    const { error: createError } = await supabaseClient
      .from('sociale_banter_upvotes')
      .insert({
        banter_id: banterId,
        socialite_id: socialiteId,
      })

    if (createError) throw createError

    // Update the upvote count on the banter message
    const { error: updateError } = await supabaseClient
      .from('sociale_banter')
      .update({
        upvote_count: banter.upvote_count + 1,
      })
      .eq('id', banterId)

    if (updateError) throw updateError

    // Get the updated banter message
    const { data: updatedBanter, error: fetchError } = await supabaseClient
      .from('sociale_banter')
      .select('*')
      .eq('id', banterId)
      .single()

    if (fetchError) throw fetchError

    // Broadcast upvote event to the Sociale channel
    await supabaseClient.channel(`sociale_${banter.sociale_id}`).send({
      type: 'broadcast',
      event: 'banter.upvoted',
      payload: {
        banter: updatedBanter,
        upvotedBy: socialiteId,
        timestamp: new Date().toISOString(),
      }
    })

    return new Response(
      JSON.stringify({ banter: updatedBanter }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error upvoting banter:', error)
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

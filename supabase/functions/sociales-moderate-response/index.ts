// =============================================================================
// SOCIALES MODERATE RESPONSE EDGE FUNCTION (P1-24)
// =============================================================================
// Host-only moderation action for a single sociale_responses row. Lets the
// host approve, scrub (soft-hide), or re-approve an answer and records who/when
// did it so we have an audit trail. TV reads `moderation_status='approved'`
// when rendering open-text submissions so scrubbed content never hits screen.
//
// Invoked as:
//   POST /functions/v1/sociales-moderate-response
//   { responseId, action: 'approve' | 'scrub' | 'unscrub', reason? }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../types/database.ts'

interface ModerateRequest {
  responseId: string
  action: 'approve' | 'scrub' | 'unscrub'
  reason?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { responseId, action, reason } = (await req.json()) as ModerateRequest
    if (!responseId || !['approve', 'scrub', 'unscrub'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'responseId and valid action required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Look up the response → room to enforce host auth.
    const { data: resp, error: respErr } = await supabaseClient
      .from('sociale_responses')
      .select('id, sociale_id, sociales!inner(room_id)')
      .eq('id', responseId)
      .single()
    if (respErr || !resp) {
      return new Response(JSON.stringify({ error: 'Response not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const roomId = (resp as any).sociales?.room_id ?? null
    if (!roomId) {
      return new Response(JSON.stringify({ error: 'Room missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: hostMembership } = await supabaseClient
      .from('room_memberships')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .eq('is_host', true)
      .single()
    if (!hostMembership) {
      return new Response(JSON.stringify({ error: 'Must be host' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const nextStatus =
      action === 'scrub' ? 'scrubbed' : action === 'unscrub' ? 'pending' : 'approved'
    const nowIso = new Date().toISOString()

    const { data: updated, error: updErr } = await supabaseClient
      .from('sociale_responses')
      .update({
        moderation_status: nextStatus,
        moderation_reason: reason ?? null,
        moderated_at: nowIso,
        moderated_by: user.id,
        updated_at: nowIso,
      })
      .eq('id', responseId)
      .select()
      .single()
    if (updErr) throw updErr

    return new Response(JSON.stringify({ response: updated }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('sociales-moderate-response error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

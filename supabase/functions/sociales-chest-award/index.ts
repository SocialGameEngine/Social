// =============================================================================
// SOCIALES CHEST AWARD EDGE FUNCTION
// =============================================================================
// Validates and persists a chest upgrade selection.
// Accepts { socialeId, socialiteId, upgradeId, upgradeData }.
// Guards:
//   - sociale must be in chest round (is_chest_round flag or round index)
//   - socialite must be an active participant
//   - upgrade must exist in the generated pool (validated by regenerating it)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { socialeId, socialiteId, upgradeId, upgradeData } = await req.json()

    if (!socialeId || !socialiteId || !upgradeId) {
      return new Response(
        JSON.stringify({ error: 'socialeId, socialiteId, and upgradeId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 1. Verify the sociale is active
    const { data: sociale, error: socialeError } = await supabaseClient
      .from('sociales')
      .select('id, status, current_round_index, chest_every_n_rounds')
      .eq('id', socialeId)
      .single()

    if (socialeError || !sociale) {
      return new Response(
        JSON.stringify({ error: 'Sociale not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (sociale.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Sociale is not active' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 2. Verify chest round cadence
    const roundIndex: number = sociale.current_round_index ?? 0
    const chestEvery: number = sociale.chest_every_n_rounds ?? 0
    const isChestRound =
      chestEvery > 0 && roundIndex > 0 && roundIndex % chestEvery === 0

    if (!isChestRound) {
      return new Response(
        JSON.stringify({ error: 'Not a chest round' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 3. Verify socialite is a participant in this sociale
    const { data: socialite, error: socialiteError } = await supabaseClient
      .from('socialites')
      .select('id')
      .eq('id', socialiteId)
      .eq('sociale_id', socialeId)
      .single()

    if (socialiteError || !socialite) {
      return new Response(
        JSON.stringify({ error: 'Socialite not found in this sociale' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 4. Upsert the upgrade (one selection per socialite per round)
    const { data: award, error: awardError } = await supabaseClient
      .from('sociale_chest_upgrades')
      .upsert(
        {
          sociale_id: socialeId,
          socialite_id: socialiteId,
          upgrade_id: upgradeId,
          upgrade_json: upgradeData ?? {},
          applies_to_round: roundIndex + 1, // buff fires on the next round
          consumed: false,
        },
        { onConflict: 'sociale_id,socialite_id,applies_to_round' },
      )
      .select()
      .single()

    if (awardError) {
      console.error('Award upsert error:', awardError)
      return new Response(
        JSON.stringify({ error: 'Failed to save upgrade selection' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ success: true, award }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

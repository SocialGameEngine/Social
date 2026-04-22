// =============================================================================
// SOCIALES HYPE BONUS — P1-2 Topic-Round Score Coupling
// =============================================================================
// Awards bonus points to the top vote-getter(s) of a topic round based on the
// collective hype level reached during that round's reveal/results phase.
//
// Called automatically by the TV client when the round advances away from a
// topic round where peakHypeLevel >= 1.
//
// Bonus tiers:
//   Level 1 (50+ taps)  → +10 pts to top response author(s)
//   Level 2 (120+ taps) → +25 pts
//   Level 3 (220+ taps) → +50 pts
//
// Idempotent: if a hype_bonus score event already exists for this round,
// the function returns 200 without re-applying.
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../types/database.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BONUS_BY_LEVEL: Record<number, number> = { 1: 10, 2: 25, 3: 50 }

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Use service role key so the TV (which may be unauthenticated) can still
    // award the bonus. The function validates game state to prevent abuse.
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const body = await req.json() as {
      socialeId: string
      roundId: string
      peakHypeLevel: number
    }
    const { socialeId, roundId, peakHypeLevel } = body

    if (!socialeId || !roundId || !peakHypeLevel) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: socialeId, roundId, peakHypeLevel' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const bonusPoints = BONUS_BY_LEVEL[Math.min(peakHypeLevel, 3)]
    if (!bonusPoints) {
      return new Response(
        JSON.stringify({ error: 'peakHypeLevel must be 1, 2, or 3' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // --- Guard: verify the round belongs to this sociale and is topic type ---
    const { data: round, error: roundError } = await supabaseClient
      .from('sociale_rounds')
      .select('id, type, sociale_id')
      .eq('id', roundId)
      .eq('sociale_id', socialeId)
      .single()

    if (roundError || !round) {
      return new Response(
        JSON.stringify({ error: 'Round not found for this sociale' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (round.type !== 'topic') {
      return new Response(
        JSON.stringify({ error: 'Hype bonus only applies to topic rounds' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // --- Idempotency: bail if bonus already applied for this round ---
    const { data: existing } = await supabaseClient
      .from('sociale_score_events')
      .select('id')
      .eq('round_id', roundId)
      .eq('event_type', 'hype_bonus')
      .limit(1)

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ alreadyApplied: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // --- Find the top vote-getter(s) for this round ---
    // Count votes per target_response_id, then resolve to socialite_id.
    const { data: voteCounts, error: voteError } = await supabaseClient
      .from('sociale_votes')
      .select('target_response_id')
      .eq('round_id', roundId)
      .eq('sociale_id', socialeId)

    if (voteError) throw voteError

    if (!voteCounts || voteCounts.length === 0) {
      // No votes cast — nothing to award.
      return new Response(
        JSON.stringify({ awarded: 0, reason: 'no_votes' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Tally votes per response.
    const tally = new Map<string, number>()
    for (const v of voteCounts) {
      const id = v.target_response_id
      tally.set(id, (tally.get(id) ?? 0) + 1)
    }
    const maxVotes = Math.max(...tally.values())
    const topResponseIds = [...tally.entries()]
      .filter(([, count]) => count === maxVotes)
      .map(([id]) => id)

    // Resolve response ids → socialite ids.
    const { data: topResponses, error: respError } = await supabaseClient
      .from('sociale_responses')
      .select('id, socialite_id')
      .in('id', topResponseIds)

    if (respError) throw respError
    if (!topResponses || topResponses.length === 0) {
      return new Response(
        JSON.stringify({ awarded: 0, reason: 'responses_not_found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const now = new Date().toISOString()
    let awardedCount = 0

    // Award bonus to each top-vote-getter (handles ties).
    for (const resp of topResponses) {
      const socialiteId = resp.socialite_id

      // Fetch current score.
      const { data: socialite, error: socialiteErr } = await supabaseClient
        .from('socialites')
        .select('id, score')
        .eq('id', socialiteId)
        .single()

      if (socialiteErr || !socialite) continue

      // Update score.
      await supabaseClient
        .from('socialites')
        .update({ score: socialite.score + bonusPoints, updated_at: now })
        .eq('id', socialiteId)

      // Log score event.
      await supabaseClient
        .from('sociale_score_events')
        .insert({
          sociale_id: socialeId,
          round_id: roundId,
          socialite_id: socialiteId,
          event_type: 'hype_bonus',
          score_change: bonusPoints,
          reason: `Hype bonus Lv${peakHypeLevel} (+${bonusPoints} pts) — top vote-getter`,
          created_at: now,
        })

      awardedCount++
    }

    return new Response(
      JSON.stringify({ awarded: awardedCount, bonusPoints, peakHypeLevel }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('[sociales-hype-bonus] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

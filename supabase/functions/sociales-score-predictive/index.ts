// =============================================================================
// SOCIALES SCORE PREDICTIVE EDGE FUNCTION (P1-19)
// =============================================================================
// After the host locks in the predictive (family-feud style) answer for a round
// whose round_mode = 'predictive', this function:
//
//   1. Stamps `predictive_answer` on the round (so TVs/clients can read it).
//   2. Walks every response for the round and scores it as correct/incorrect
//      based on the locked-in answer.
//   3. Re-applies the round's `point_multiplier` (P1-11 — e.g. final round 2x).
//   4. Rebuilds socialite.score totals so the leaderboard snaps cleanly.
//
// Invoked as:
//   POST /functions/v1/sociales-score-predictive
//   { socialeId, roundId, predictiveAnswer, variants? }
//
// Only the host of the sociale's room may call it.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../types/database.ts'

interface ScorePredictiveRequest {
  socialeId: string
  roundId: string
  predictiveAnswer: string
  /** Additional accepted spellings, case-insensitive. */
  variants?: string[]
  /** Points awarded per correct guess. Defaults to 100. */
  pointsCorrect?: number
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function normalize(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, ' ')
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

    const body = (await req.json()) as ScorePredictiveRequest
    const { socialeId, roundId, predictiveAnswer, variants, pointsCorrect } = body

    if (!socialeId || !roundId || !predictiveAnswer?.trim()) {
      return new Response(
        JSON.stringify({ error: 'socialeId, roundId, predictiveAnswer are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Host auth check.
    const { data: sociale, error: socErr } = await supabaseClient
      .from('sociales')
      .select('id, room_id')
      .eq('id', socialeId)
      .single()
    if (socErr || !sociale) {
      return new Response(JSON.stringify({ error: 'Sociale not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const { data: hostMembership } = await supabaseClient
      .from('room_memberships')
      .select('id')
      .eq('room_id', sociale.room_id)
      .eq('user_id', user.id)
      .eq('is_host', true)
      .single()
    if (!hostMembership) {
      return new Response(JSON.stringify({ error: 'Must be host' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Round must be in predictive mode (or have no mode yet — we're lenient).
    const { data: round, error: rndErr } = await supabaseClient
      .from('sociale_rounds')
      .select('id, sociale_id, round_mode, point_multiplier, settings')
      .eq('id', roundId)
      .single()
    if (rndErr || !round) {
      return new Response(JSON.stringify({ error: 'Round not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const multiplier =
      typeof round.point_multiplier === 'number' && round.point_multiplier > 0
        ? round.point_multiplier
        : 1
    const perCorrect = Math.round((pointsCorrect ?? 100) * multiplier)

    // Persist the locked-in answer + variants onto the round.
    await supabaseClient
      .from('sociale_rounds')
      .update({
        predictive_answer: predictiveAnswer,
        settings: {
          ...((round.settings as any) ?? {}),
          predictive: {
            answer: predictiveAnswer,
            variants: variants ?? [],
            pointsCorrect: perCorrect,
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', roundId)

    // Build the acceptance set (normalized).
    const accepted = new Set<string>([
      normalize(predictiveAnswer),
      ...(variants ?? []).map(normalize).filter(Boolean),
    ])

    // Fetch every response for this round and rescore.
    const { data: responses, error: respErr } = await supabaseClient
      .from('sociale_responses')
      .select('id, socialite_id, content, value, score_awarded, is_correct')
      .eq('sociale_id', socialeId)
      .eq('round_id', roundId)
    if (respErr) throw respErr

    type ScoreDelta = { socialiteId: string; delta: number; newScore: number }
    const deltas: ScoreDelta[] = []
    const nowIso = new Date().toISOString()

    for (const resp of responses ?? []) {
      const raw =
        (typeof resp.content === 'string' && resp.content) ||
        (typeof resp.value === 'string' && resp.value) ||
        ''
      const isCorrect = Boolean(raw) && accepted.has(normalize(raw))
      const newScore = isCorrect ? perCorrect : 0
      const oldScore = resp.score_awarded ?? 0
      const delta = newScore - oldScore

      if (delta !== 0 || resp.is_correct !== isCorrect) {
        await supabaseClient
          .from('sociale_responses')
          .update({
            is_correct: isCorrect,
            score_awarded: newScore,
            updated_at: nowIso,
          })
          .eq('id', resp.id)
      }
      deltas.push({ socialiteId: resp.socialite_id, delta, newScore })
    }

    // Apply score deltas to each Socialite.
    const bySocialite = new Map<string, number>()
    for (const d of deltas) {
      bySocialite.set(d.socialiteId, (bySocialite.get(d.socialiteId) ?? 0) + d.delta)
    }
    for (const [socialiteId, netDelta] of bySocialite) {
      if (netDelta === 0) continue
      const { data: s } = await supabaseClient
        .from('socialites')
        .select('score')
        .eq('id', socialiteId)
        .single()
      if (!s) continue
      await supabaseClient
        .from('socialites')
        .update({ score: (s.score ?? 0) + netDelta, updated_at: nowIso })
        .eq('id', socialiteId)
      await supabaseClient.from('sociale_score_events').insert({
        sociale_id: socialeId,
        round_id: roundId,
        socialite_id: socialiteId,
        reason: 'Predictive rescoring',
        points: netDelta,
        metadata: { predictiveAnswer, variants },
      })
    }

    return new Response(
      JSON.stringify({
        ok: true,
        rescored: deltas.length,
        acceptedAnswers: Array.from(accepted),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('sociales-score-predictive error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

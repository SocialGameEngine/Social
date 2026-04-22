// =============================================================================
// SOCIALES REGRADE VARIANT EDGE FUNCTION (P1-25)
// =============================================================================
// Mid-game host action for written-answer trivia rounds. When a player submits
// an answer that's spelled slightly differently than the canonical answer, the
// host can "accept variant" — we:
//
//   1. Append the variant to the round's acceptedAnswers (settings.snapshot).
//   2. Optionally also persist it as a trivia_question_aliases row so any
//      future game inherits the fix.
//   3. Rescore every response for the round against the updated accept list.
//
// Invoked as:
//   POST /functions/v1/sociales-regrade-variant
//   { socialeId, roundId, variant, persistToLibrary?: boolean }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../types/database.ts'

interface RegradeRequest {
  socialeId: string
  roundId: string
  variant: string
  persistToLibrary?: boolean
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

    const { socialeId, roundId, variant, persistToLibrary } =
      (await req.json()) as RegradeRequest
    if (!socialeId || !roundId || !variant?.trim()) {
      return new Response(
        JSON.stringify({ error: 'socialeId, roundId, variant required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Host auth.
    const { data: sociale } = await supabaseClient
      .from('sociales')
      .select('id, room_id')
      .eq('id', socialeId)
      .single()
    if (!sociale) {
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

    // Load the round + snapshot.
    const { data: round } = await supabaseClient
      .from('sociale_rounds')
      .select('id, type, settings, point_multiplier')
      .eq('id', roundId)
      .single()
    if (!round) {
      return new Response(JSON.stringify({ error: 'Round not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const settings = (round.settings ?? {}) as any
    const snapshot = settings.snapshot ?? {}
    const written = snapshot.writtenAnswer ?? null

    const accepted: string[] = Array.isArray(written?.acceptedAnswers)
      ? [...written.acceptedAnswers]
      : Array.isArray(written?.acceptedAliases)
        ? [...written.acceptedAliases]
        : []

    if (!accepted.some((a: string) => normalize(a) === normalize(variant))) {
      accepted.push(variant)
    }

    const newSnapshot = {
      ...snapshot,
      writtenAnswer: {
        ...(written ?? {}),
        acceptedAnswers: accepted,
      },
    }

    await supabaseClient
      .from('sociale_rounds')
      .update({
        settings: { ...settings, snapshot: newSnapshot },
        updated_at: new Date().toISOString(),
      })
      .eq('id', roundId)

    // Optional: write through to the shared library so future games inherit it.
    let aliasPersisted = false
    if (persistToLibrary) {
      const questionId: string | undefined = settings?.questionId ?? settings?.triviaQuestionId
      if (questionId) {
        const { error: aliasErr } = await supabaseClient
          .from('trivia_question_aliases')
          .insert({ question_id: questionId, alias_text: variant })
        aliasPersisted = !aliasErr
      }
    }

    const multiplier =
      typeof round.point_multiplier === 'number' && round.point_multiplier > 0
        ? round.point_multiplier
        : 1
    const pointsCorrect = Math.round((settings.pointsCorrect ?? 100) * multiplier)
    const acceptedSet = new Set(accepted.map(normalize))

    // Rescore all responses on this round.
    const { data: responses } = await supabaseClient
      .from('sociale_responses')
      .select('id, socialite_id, value, content, is_correct, score_awarded')
      .eq('sociale_id', socialeId)
      .eq('round_id', roundId)

    const nowIso = new Date().toISOString()
    let rescored = 0
    const bySocialite = new Map<string, number>()

    for (const resp of responses ?? []) {
      const raw =
        (typeof resp.value === 'string' && resp.value) ||
        (typeof resp.content === 'string' && resp.content) ||
        ''
      const isCorrect = Boolean(raw) && acceptedSet.has(normalize(raw))
      const newScore = isCorrect ? pointsCorrect : 0
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
        rescored += 1
      }
      if (delta !== 0) {
        bySocialite.set(
          resp.socialite_id,
          (bySocialite.get(resp.socialite_id) ?? 0) + delta
        )
      }
    }

    // Apply net deltas to socialites.
    for (const [socialiteId, delta] of bySocialite) {
      if (delta === 0) continue
      const { data: s } = await supabaseClient
        .from('socialites')
        .select('score')
        .eq('id', socialiteId)
        .single()
      if (!s) continue
      await supabaseClient
        .from('socialites')
        .update({ score: (s.score ?? 0) + delta, updated_at: nowIso })
        .eq('id', socialiteId)
      await supabaseClient.from('sociale_score_events').insert({
        sociale_id: socialeId,
        round_id: roundId,
        socialite_id: socialiteId,
        reason: 'Regrade: accepted variant',
        points: delta,
        metadata: { variant, aliasPersisted },
      })
    }

    return new Response(
      JSON.stringify({
        ok: true,
        rescored,
        acceptedAnswers: accepted,
        aliasPersisted,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('sociales-regrade-variant error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

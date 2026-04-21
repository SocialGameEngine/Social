// =============================================================================
// SOCIALES ADVANCE EDGE FUNCTION
// =============================================================================
// Advances a Sociale to the next phase or round

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../types/database.ts'
import type { AdvanceSocialeRequest, AdvanceSocialeResponse } from '../../apps/top-comment/src/domain/types/sociale.types.ts'

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
    const body: AdvanceSocialeRequest = await req.json()
    const { socialeId, targetPhase } = body

    console.log('🔥 sociales-advance called with:', { socialeId, targetPhase })

    if (!socialeId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: socialeId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Default targetPhase to 'next' if not provided
    const effectiveTargetPhase = targetPhase || 'next'
    console.log('🔥 Using targetPhase:', effectiveTargetPhase)

    // Get the Sociale
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

    // Verify user is host of the room
    const { data: membership, error: membershipError } = await supabaseClient
      .from('room_memberships')
      .select('*')
      .eq('room_id', sociale.room_id)
      .eq('user_id', user.id)
      .eq('is_host', true)
      .single()

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({ error: 'Must be host of the room to advance Sociale' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current round state.
    // Prefer `sociales.current_round_id` so we don't accidentally pick the wrong active row.
    let roundStateQuery: any = supabaseClient
      .from('sociale_round_state')
      .select('*')
      .eq('sociale_id', socialeId)
      .eq('status', 'active')

    if (sociale.current_round_id) {
      roundStateQuery = roundStateQuery.eq('round_id', sociale.current_round_id)
    }

    const {
      data: initialRoundState,
      error: initialStateError,
    } = await roundStateQuery
      // Be tolerant if data corruption leaves multiple active rows:
      // pick the most recently started active round_state.
      .order('phase_started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // If the DB state got out of sync with `sociales.current_round_id`, fall back.
    let currentRoundState = initialRoundState
    let stateError = initialStateError

    if ((!currentRoundState || stateError) && sociale.current_round_id) {
      const { data: fallbackRoundState, error: fallbackError } = await supabaseClient
        .from('sociale_round_state')
        .select('*')
        .eq('sociale_id', socialeId)
        .eq('status', 'active')
        .order('phase_started_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fallbackError || !fallbackRoundState) {
        return new Response(
          JSON.stringify({ error: 'No active round state found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      currentRoundState = fallbackRoundState
      stateError = null
    }

    if (stateError || !currentRoundState) {
      console.log('🔥 Phase advance - No round state found, stateError:', stateError);
      console.log('🔥 Phase advance - currentRoundState:', currentRoundState);
      console.log('🔥 Phase advance - sociale.current_round_index:', sociale.current_round_index);
      return new Response(
        JSON.stringify({ error: 'No active round state found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔥 Phase advance - Found round state:', currentRoundState);

    // Get current round
    const { data: currentRound, error: roundError } = await supabaseClient
      .from('sociale_rounds')
      .select('*')
      .eq('id', currentRoundState.round_id)
      .single()

    if (roundError || !currentRound) {
      return new Response(
        JSON.stringify({ error: 'Current round not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let nextPhase = effectiveTargetPhase
    let nextRoundIndex = sociale.current_round_index

    // If targetPhase is 'next', calculate the next phase
    if (effectiveTargetPhase === 'next') {
      // Use currentRound that was already fetched above (lines 153-164)
      if (!currentRound) {
        return new Response(
          JSON.stringify({ error: 'Current round not found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get phase sequence from current round or fall back to default
      let phases: string[]
      
      if (currentRound.phase_sequence && currentRound.phase_sequence.length > 0) {
        // Use round-specific phase sequence
        phases = currentRound.phase_sequence
        console.log('🔥 Phase advance - Using round-specific phase sequence:', phases);
      } else {
        // Use default phase sequence based on round type
        switch (currentRound.type || 'prompt') {
          case 'trivia':
            phases = ['answer', 'reveal', 'results']
            break
          case 'topic':
            phases = ['answer', 'vote', 'results']
            break
          case 'poll':
            phases = ['poll', 'results', 'reveal']
            break
          case 'prompt':
          default:
            phases = ['answer', 'reveal', 'results']
            break
        }
        console.log('🔥 Phase advance - Using default phase sequence for round type:', currentRound.type, phases);
      }
      
      // Get current phase from Sociale or round state
      let currentPhase = currentRoundState?.phase || sociale.current_phase || 'answer'
      const currentPhaseIndex = phases.indexOf(currentPhase)
      
      console.log('🔥 Phase advance - Current phase:', currentPhase);
      console.log('🔥 Phase advance - Current phase index:', currentPhaseIndex);
      console.log('🔥 Phase advance - Available phases:', phases);
      
      if (currentPhaseIndex < phases.length - 1) {
        // Advance to next phase within current round
        nextPhase = phases[currentPhaseIndex + 1]
        console.log('🔥 Phase advance - Advancing to next phase:', nextPhase);
      } else {
        // Move to next round
        nextRoundIndex = (sociale.current_round_index || 0) + 1
        
        // Check if this is the last round
        if (nextRoundIndex >= sociale.total_rounds) {
          // End the Sociale
          const { error: endError } = await supabaseClient
            .from('sociales')
            .update({
              status: 'completed',
              ended_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', socialeId)

          if (endError) throw endError

          const response: AdvanceSocialeResponse = {
            sociale: {
              ...sociale,
              status: 'completed',
              endedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            advanced: true,
            nextPhase: 'completed',
          }

          return new Response(
            JSON.stringify(response),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          // Move to next round - get the next round and start with 'answer' phase
          const { data: nextRound, error: nextRoundError } = await supabaseClient
            .from('sociale_rounds')
            .select('*')
            .eq('sociale_id', socialeId)
            .eq('order_index', nextRoundIndex)
            .single()

          if (nextRoundError || !nextRound) {
            return new Response(
              JSON.stringify({ error: 'Next round not found' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Assign prompt from pre-loaded deck for topic and prompt rounds ONLY if content is missing
          // Never overwrite content that was set during preview/create
          if ((nextRound.type === 'topic' || nextRound.type === 'prompt') && (!nextRound.content || !nextRound.title)) {
            const roundSettings = nextRound.settings as any
            const promptLibraryId = roundSettings?.promptLibraryId || sociale.selected_libraries?.[0]
            
            if (promptLibraryId) {
              const runtimeState = sociale.runtime_state || {}
              const promptDecks = runtimeState.promptDecks || {}
              const deck = promptDecks[promptLibraryId]

              if (deck && deck.prompts && deck.prompts.length > 0) {
                // Reset cursor if we've exhausted the deck
                let cursor = deck.cursor || 0
                if (cursor >= deck.prompts.length) {
                  cursor = 0
                }

                const promptText = deck.prompts[cursor]
                cursor += 1

                // Update the round with the prompt content
                const { error: updateError } = await supabaseClient
                  .from('sociale_rounds')
                  .update({
                    title: promptText,
                    content: promptText,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', nextRound.id)

                if (updateError) {
                  console.error('Failed to update round with prompt:', updateError)
                } else {
                  console.log('✅ Updated round with prompt from pre-loaded deck (cursor:', cursor - 1, '):', promptText.substring(0, 50) + '...')
                  // Update local nextRound object
                  nextRound.title = promptText
                  nextRound.content = promptText
                }

                // Update the deck cursor in runtime state
                const updatedRuntimeState = {
                  ...runtimeState,
                  promptDecks: {
                    ...promptDecks,
                    [promptLibraryId]: { ...deck, cursor }
                  }
                }

                await supabaseClient
                  .from('sociales')
                  .update({ runtime_state: updatedRuntimeState })
                  .eq('id', socialeId)

              } else {
                console.error('No prompt deck available for library:', promptLibraryId)
              }
            }
          }

          // Fetch trivia question data and build snapshot for trivia rounds ONLY if snapshot is missing
          // Never overwrite content that was set during preview/create
          if (nextRound.type === 'trivia') {
            const roundSettings = nextRound.settings as any
            const questionPackId = roundSettings?.questionPackId

            // Only fetch if we don't have content and don't have a snapshot
            if (questionPackId && !roundSettings?.snapshot && (!nextRound.content || !nextRound.title)) {
              // Add timeout to prevent resource exhaustion
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Trivia question fetch timeout')), 5000)
              )
              
              // Fetch complete question data including options and accepted_answers
              // Add limits to prevent resource exhaustion
              const fetchPromise = supabaseClient
                .from('trivia_questions')
                .select(`
                  id,
                  prompt,
                  format,
                  explanation,
                  accepted_answers,
                  trivia_question_options(
                    option_id,
                    option_text,
                    is_correct,
                    sort_order
                  ).limit(10)
                `)
                .eq('pack_id', questionPackId)
                .eq('status', 'published')
                .limit(1)

              let questions, questionError
              try {
                const result = await Promise.race([fetchPromise, timeoutPromise]) as any
                questions = result.data
                questionError = result.error
              } catch (timeoutError) {
                console.error('Trivia question fetch timed out:', timeoutError)
                questionError = { message: 'Fetch timeout' }
              }

              if (questionError) {
                console.error('Failed to fetch trivia question:', questionError)
              } else if (questions && questions.length > 0) {
                const q = questions[0]
                const detectedFormat = q.format || 'written_answer'
                let snapshot: any = null
                let validationError: string | null = null

                if (detectedFormat === 'multiple_choice') {
                  const options = (q.trivia_question_options || [])
                    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                    .map((opt: any) => ({
                      id: opt.option_id, // Use option_id, not id
                      text: opt.option_text,
                    }))
                  const correctOptions = options.filter((o: any) => o.is_correct)
                  
                  if (options.length < 2) {
                    validationError = 'Multiple choice requires at least 2 options'
                  } else if (correctOptions.length !== 1) {
                    validationError = 'Multiple choice requires exactly 1 correct option'
                  } else {
                    snapshot = {
                      prompt: q.prompt,
                      explanation: q.explanation || null,
                      multipleChoice: {
                        options,
                        correctOptionId: correctOptions[0].id, // Now using the correct option_id
                      },
                    }
                  }
                } else if (detectedFormat === 'written_answer') {
                  const acceptedAnswers: string[] = q.accepted_answers || []

                  if (!q.prompt || q.prompt.trim().length === 0) {
                    validationError = 'Written answer question has empty prompt'
                  } else if (acceptedAnswers.length === 0) {
                    validationError = 'Written answer question has no accepted answers'
                  } else {
                    snapshot = {
                      prompt: q.prompt,
                      explanation: q.explanation || null,
                      writtenAnswer: {
                        acceptedAnswers,
                        correctAnswer: acceptedAnswers[0],
                      },
                    }
                  }
                } else {
                  validationError = `Unknown trivia format: ${detectedFormat}`
                }

                if (validationError) {
                  console.error('🚫 Trivia validation failed:', validationError)
                  // Store the error in settings so UI can display it
                  const updatedSettings = {
                    ...roundSettings,
                    format: detectedFormat,
                    questionId: q.id,
                    validationError,
                  }
                  await supabaseClient
                    .from('sociale_rounds')
                    .update({ settings: updatedSettings, updated_at: new Date().toISOString() })
                    .eq('id', nextRound.id)
                  nextRound.settings = updatedSettings
                } else if (snapshot) {
                  const updatedSettings = {
                    ...roundSettings,
                    format: detectedFormat,
                    questionId: q.id,
                    snapshot,
                  }
                  await supabaseClient
                    .from('sociale_rounds')
                    .update({
                      settings: updatedSettings,
                      title: q.prompt.substring(0, 100),
                      content: q.prompt,
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', nextRound.id)
                  nextRound.settings = updatedSettings
                  nextRound.title = q.prompt.substring(0, 100)
                  nextRound.content = q.prompt
                  console.log('✅ Built trivia snapshot for round:', nextRound.id, 'format:', detectedFormat)
                }
              } else {
                console.error('No published trivia questions found for pack:', questionPackId)
              }
            }
          }

          // Start next round with 'answer' phase (not 'setup')
          nextPhase = 'answer'

          // Mark current round state as completed
          if (currentRoundState) {
            await supabaseClient
              .from('sociale_round_state')
              .update({
                status: 'completed',
                ended_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', currentRoundState.id)
          }

          // Create new round state for next round
          const nowIso = new Date().toISOString()
          const nextRoundSettings = nextRound.settings as any
          const phaseDurationSeconds = nextRoundSettings?.answerSeconds ?? 90
          const phaseEndsAt = new Date(Date.now() + phaseDurationSeconds * 1000).toISOString()

          await supabaseClient
            .from('sociale_round_state')
            .insert({
              sociale_id: socialeId,
              round_id: nextRound.id,
              status: 'active',
              phase: 'answer',
              started_at: nowIso,
              phase_started_at: nowIso,
              phase_ends_at: phaseEndsAt,
              created_at: nowIso,
              updated_at: nowIso,
            })

          // Update Sociale to point to next round
          const { data: updatedSociale, error: socialeUpdateError } = await supabaseClient
            .from('sociales')
            .update({
              current_round_index: nextRoundIndex,
              current_round_id: nextRound.id,
              current_phase: 'answer',
              phase_started_at: nowIso,
              phase_ends_at: phaseEndsAt,
              updated_at: nowIso,
            })
            .eq('id', socialeId)
            .select()
            .single()

          if (socialeUpdateError) throw socialeUpdateError

          const response: AdvanceSocialeResponse = {
            sociale: {
              id: updatedSociale.id,
              roomId: updatedSociale.room_id,
              createdBy: updatedSociale.created_by,
              title: updatedSociale.title,
              description: updatedSociale.description,
              mode: updatedSociale.mode,
              status: updatedSociale.status,
              currentRoundIndex: updatedSociale.current_round_index,
              currentRoundId: updatedSociale.current_round_id,
              currentPhase: updatedSociale.current_phase,
              phaseStartedAt: updatedSociale.phase_started_at,
              phaseEndsAt: updatedSociale.phase_ends_at,
              totalRounds: updatedSociale.total_rounds,
              settings: updatedSociale.settings || {},
              scoreboard: updatedSociale.scoreboard || {},
              runtimeState: updatedSociale.runtime_state,
              createdAt: updatedSociale.created_at,
              updatedAt: updatedSociale.updated_at,
              startedAt: updatedSociale.started_at,
              endedAt: updatedSociale.ended_at,
              legacySessionId: updatedSociale.legacy_session_id,
            },
            advanced: true,
            nextPhase: 'answer',
          }

          return new Response(
            JSON.stringify(response),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Normal phase advancement within current round
    // Calculate phase duration based on round settings and phase type
    const phaseDurationSeconds = (() => {
      const roundSettings = currentRound?.settings as any
      
      if (roundSettings && typeof roundSettings === 'object') {
        switch (nextPhase) {
          case 'vote':
          case 'voting': return roundSettings.votingSeconds || roundSettings.voteSeconds || 30
          case 'results': return roundSettings.resultsSeconds || 12
          case 'answer': return roundSettings.answerSeconds || 90
          case 'reveal': return roundSettings.revealSeconds || 15
          case 'discussion': return roundSettings.discussionSeconds || 180
          default: return 90
        }
      }
      
      // Fall back to round type defaults
      switch (currentRound?.type || 'prompt') {
        case 'trivia':
          switch (nextPhase) {
            case 'answer': return 60
            case 'results': return 8
            case 'reveal': return 10
            default: return 90
          }
        case 'topic':
          switch (nextPhase) {
            case 'answer': return 90
            case 'vote':
            case 'voting': return 30
            case 'results': return 12
            case 'reveal': return 15
            case 'discussion': return 180
            default: return 90
          }
        case 'poll':
          switch (nextPhase) {
            case 'poll': return 30
            case 'results': return 10
            case 'reveal': return 8
            default: return 90
          }
        case 'prompt':
        default:
          switch (nextPhase) {
            case 'vote':
            case 'voting': return 30
            case 'results': return 12
            case 'reveal': return 15
            case 'answer': return 90
            case 'discussion': return 180
            default: return 90
          }
      }
    })()

    const phaseStartedAt = new Date().toISOString()
    const phaseEndsAt = new Date(
      Date.now() + phaseDurationSeconds * 1000
    ).toISOString()

    console.log('🔥 Phase advance - Updating to phase:', nextPhase, 'duration:', phaseDurationSeconds);

    // Update Sociale timing and phase directly
    const { data: updatedSociale, error: socialeUpdateError } = await supabaseClient
      .from('sociales')
      .update({
        current_phase: nextPhase,
        phase_started_at: phaseStartedAt,
        phase_ends_at: phaseEndsAt,
        updated_at: phaseStartedAt,
      })
      .eq('id', socialeId)
      .select()
      .single()

    if (socialeUpdateError) throw socialeUpdateError

    // Update round state if it exists
    if (currentRoundState) {
      await supabaseClient
        .from('sociale_round_state')
        .update({
          phase: nextPhase,
          phase_started_at: phaseStartedAt,
          phase_ends_at: phaseEndsAt,
          updated_at: phaseStartedAt,
        })
        .eq('id', currentRoundState.id)
    }

    const response: AdvanceSocialeResponse = {
      sociale: {
        id: updatedSociale.id,
        roomId: updatedSociale.room_id,
        createdBy: updatedSociale.created_by,
        title: updatedSociale.title,
        description: updatedSociale.description,
        mode: updatedSociale.mode,
        status: updatedSociale.status,
        currentRoundIndex: updatedSociale.current_round_index,
        currentRoundId: updatedSociale.current_round_id,
        currentPhase: updatedSociale.current_phase,
        phaseStartedAt: updatedSociale.phase_started_at,
        phaseEndsAt: updatedSociale.phase_ends_at,
        totalRounds: updatedSociale.total_rounds,
        settings: updatedSociale.settings || {},
        scoreboard: updatedSociale.scoreboard || {},
        runtimeState: updatedSociale.runtime_state,
        createdAt: updatedSociale.created_at,
        updatedAt: updatedSociale.updated_at,
        startedAt: updatedSociale.started_at,
        endedAt: updatedSociale.ended_at,
        legacySessionId: updatedSociale.legacy_session_id,
      },
      advanced: true,
      nextPhase,
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error advancing Sociale:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

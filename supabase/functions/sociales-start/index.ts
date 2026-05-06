// =============================================================================
// SOCIALES START EDGE FUNCTION
// =============================================================================
// Starts a Sociale, moving it from draft to active status

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../types/database.ts'
import type { StartSocialeRequest, StartSocialeResponse } from '../../apps/top-comment/src/domain/types/sociale.types.ts'
import { requireValidMashupLibraries } from '../_shared/mashup.ts'

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
    const body: StartSocialeRequest = await req.json()
    const { socialeId } = body

    if (!socialeId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: socialeId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
        JSON.stringify({ error: 'Must be host of the room to start Sociale' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify Sociale is in draft status
    if (sociale.status !== 'draft') {
      return new Response(
        JSON.stringify({ error: 'Sociale must be in draft status to start' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle ambient mode
    if (sociale.mode === 'ambient') {
      // Ambient mode doesn't need prompt libraries validation
      
      // Fetch the first ambient round from the selected pack to get timing settings
      const packId = (sociale as any).ambient_pack_id || '00000000-0000-0000-0000-000000000001'
      const { data: firstAmbientRound, error: ambientRoundError } = await supabaseClient
        .from('ambient_rounds')
        .select('*')
        .eq('pack_id', packId)
        .eq('order_index', 0)
        .single()

      if (ambientRoundError || !firstAmbientRound) {
        return new Response(
          JSON.stringify({ error: 'No ambient rounds found - populate ambient_rounds table first' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Start the ambient sociale
      const nowIso = new Date().toISOString()
      const ambientSettings = firstAmbientRound.settings as any
      const phaseDurationSeconds = ambientSettings?.answerSeconds ?? 90
      const phaseEndsAt = new Date(Date.now() + phaseDurationSeconds * 1000).toISOString()

      const { data: updatedSociale, error: startError } = await supabaseClient
        .from('sociales')
        .update({
          status: 'active',
          current_round_index: 0,
          current_round_id: null, // No sociale_rounds row for ambient
          current_phase: 'answer',
          phase_started_at: nowIso,
          phase_ends_at: phaseEndsAt,
          started_at: new Date().toISOString(),
          updated_at: nowIso,
          runtime_state: {
            ...(sociale.runtime_state || {}),
            ambientRound: {
              id: firstAmbientRound.id,
              type: firstAmbientRound.type,
              title: firstAmbientRound.title,
              content: firstAmbientRound.content,
              settings: firstAmbientRound.settings,
            }
          }
        })
        .eq('id', socialeId)
        .select()
        .single()

      if (startError) throw startError

      // Return the updated Sociale
      const response: StartSocialeResponse = {
        sociale: {
          id: updatedSociale.id,
          roomId: updatedSociale.room_id,
          createdBy: updatedSociale.created_by,
          title: updatedSociale.title,
          description: updatedSociale.description,
          mode: updatedSociale.mode,
          status: updatedSociale.status,
          currentRoundIndex: updatedSociale.current_round_index,
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
      }

      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate prompt libraries are selected (from Sessions validation)
    const isMashupMode = sociale.mode === 'alternating' || sociale.mode === 'topics_only' || sociale.mode === 'trivia_only';
    if (isMashupMode) {
      const selectedLibraries = sociale.selected_libraries || [];
      if (!selectedLibraries || selectedLibraries.length === 0) {
        return new Response(
          JSON.stringify({ error: 'At least one prompt library is required for this game mode' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Validate libraries exist in database
      try {
        await requireValidMashupLibraries(supabaseClient, selectedLibraries);
      } catch (libError: any) {
        return new Response(
          JSON.stringify({ error: libError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Get the first round
    const { data: firstRound, error: roundError } = await supabaseClient
      .from('sociale_rounds')
      .select('*')
      .eq('sociale_id', socialeId)
      .eq('order_index', 0)
      .single()

    if (roundError || !firstRound) {
      return new Response(
        JSON.stringify({ error: 'No rounds found for this Sociale' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Assign prompt from pre-loaded deck for topic and prompt rounds if content is empty
    if ((firstRound.type === 'topic' || firstRound.type === 'prompt') && (!firstRound.content || !firstRound.title)) {
      const roundSettings = firstRound.settings as any
      const promptLibraryId = roundSettings?.promptLibraryId || sociale.selected_libraries?.[0]
      
      if (promptLibraryId) {
        const runtimeState = sociale.runtime_state || {}
        const promptDecks = runtimeState.promptDecks || {}
        const deck = promptDecks[promptLibraryId]

        if (deck && deck.prompts && deck.prompts.length > 0) {
          // Use the first prompt from the pre-loaded deck
          const promptText = deck.prompts[0]
          
          // Update the round with the prompt content
          const { error: updateError } = await supabaseClient
            .from('sociale_rounds')
            .update({
              title: promptText,
              content: promptText,
              updated_at: new Date().toISOString(),
            })
            .eq('id', firstRound.id)

          if (updateError) {
            console.error('Failed to update round with prompt:', updateError)
          } else {
            console.log('✅ Updated first round with prompt from pre-loaded deck:', promptText.substring(0, 50) + '...')
            // Update local firstRound object
            firstRound.title = promptText
            firstRound.content = promptText
          }

          // Update the deck cursor in runtime state
          const updatedRuntimeState = {
            ...runtimeState,
            promptDecks: {
              ...promptDecks,
              [promptLibraryId]: { ...deck, cursor: 1 }
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

    // Handle trivia rounds - create snapshot for first trivia round
    if (firstRound.type === 'trivia') {
      console.log('🔥 Checking trivia round for snapshot creation:', firstRound.id);
      const roundSettings = firstRound.settings as any;
      const questionPackId = roundSettings?.questionPackId;
      const hasSnapshot = roundSettings?.snapshot;
      
      console.log('🔥 Trivia round data:', {
        roundId: firstRound.id,
        questionPackId,
        hasSnapshot,
        hasSettings: !!roundSettings,
        settingsKeys: roundSettings ? Object.keys(roundSettings) : []
      });
      
      // Only create snapshot if missing, regardless of content/title
      if (!hasSnapshot && questionPackId) {
        console.log('🔥 Loading trivia question for first round from pack:', questionPackId)
        
        // Fetch a question from the pack
        const { data: questions, error: questionError } = await supabaseClient
          .from('trivia_questions')
          .select(`
            id,
            prompt,
            format,
            explanation,
            trivia_question_options(id, option_text, is_correct, sort_order),
            trivia_question_aliases(alias_text, alias_normalized)
          `)
          .eq('pack_id', questionPackId)
          .eq('status', 'published')
          .limit(1)

        if (questionError) {
          console.error('Failed to fetch trivia question:', questionError)
        } else if (questions && questions.length > 0) {
          const q = questions[0]
          console.log('🔥 Found trivia question:', q.prompt, 'format:', q.format)
          
          let snapshot: any = null
          let validationError: string | null = null
          const detectedFormat = q.format || 'written_answer'

          if (detectedFormat === 'multiple_choice') {
            const options = q.trivia_question_options
              ?.sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((opt: any) => ({
                id: opt.option_id, // Use option_id, not id
                text: opt.option_text,
              })) || []

            const correctOption = q.trivia_question_options?.find((opt: any) => opt.is_correct)
            
            if (options.length < 2) {
              validationError = 'Multiple choice question requires at least 2 options'
            } else if (!correctOption) {
              validationError = 'Multiple choice question has no correct option'
            } else {
              snapshot = {
                prompt: q.prompt,
                explanation: q.explanation || null,
                multipleChoice: {
                  options,
                  correctOptionId: correctOption.option_id, // Use option_id, not id
                },
              }
            }
          } else if (detectedFormat === 'written_answer') {
            const aliases = q.trivia_question_aliases?.map((alias: any) => alias.alias_text) || []
            const acceptedAnswers: string[] = [q.prompt, ...aliases]

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
          }

          if (validationError) {
            console.error('🚫 Trivia validation failed:', validationError)
            const updatedSettings = {
              ...roundSettings,
              format: detectedFormat,
              questionId: q.id,
              validationError,
            }
            await supabaseClient
              .from('sociale_rounds')
              .update({ 
                settings: updatedSettings,
                title: 'Trivia Question',
                content: 'Invalid question - see settings',
                updated_at: new Date().toISOString(),
              })
              .eq('id', firstRound.id)
            firstRound.settings = updatedSettings
            firstRound.title = 'Trivia Question'
            firstRound.content = 'Invalid question - see settings'
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
              .eq('id', firstRound.id)
            firstRound.settings = updatedSettings
            firstRound.title = q.prompt.substring(0, 100)
            firstRound.content = q.prompt
            console.log('✅ Built trivia snapshot for first round:', firstRound.id, 'format:', detectedFormat)
          }
        } else {
          console.error('No published trivia questions found for pack:', questionPackId)
        }
      }
    }

    // Start the Sociale
    const nowIso = new Date().toISOString()
    const phaseDurationSeconds =
      // UI treats `setup`/`question` as the "answer-like" phase for timing.
      (firstRound.settings as any)?.answerSeconds ?? 90
    const phaseEndsAt = new Date(Date.now() + phaseDurationSeconds * 1000).toISOString()

    const { data: updatedSociale, error: startError } = await supabaseClient
      .from('sociales')
      .update({
        status: 'active',
        current_round_index: 0,
        current_round_id: firstRound.id,
        current_phase: 'setup',
        phase_started_at: nowIso,
        phase_ends_at: phaseEndsAt,
        started_at: new Date().toISOString(),
        updated_at: nowIso,
      })
      .eq('id', socialeId)
      .select()
      .single()

    if (startError) throw startError

    // Create round state for the first round
    const { error: stateError } = await supabaseClient
      .from('sociale_round_state')
      .insert({
        sociale_id: socialeId,
        round_id: firstRound.id,
        status: 'active',
        phase: 'setup',
        started_at: nowIso,
        phase_started_at: nowIso,
        phase_ends_at: phaseEndsAt,
        created_at: new Date().toISOString(),
        updated_at: nowIso,
      })

    if (stateError) throw stateError

    // Return the updated Sociale
    const response: StartSocialeResponse = {
      sociale: {
        id: updatedSociale.id,
        roomId: updatedSociale.room_id,
        createdBy: updatedSociale.created_by,
        title: updatedSociale.title,
        description: updatedSociale.description,
        mode: updatedSociale.mode,
        status: updatedSociale.status,
        currentRoundIndex: updatedSociale.current_round_index,
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
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error starting Sociale:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

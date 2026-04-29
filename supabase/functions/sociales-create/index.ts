// =============================================================================
// SOCIALES CREATE EDGE FUNCTION
// =============================================================================
// Creates a new Sociale with optional rounds

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../types/database.ts'
import type { CreateSocialeRequest, CreateSocialeResponse } from '../../../apps/top-comment/src/domain/types/sociale.types.ts'

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
    const body: CreateSocialeRequest = await req.json()
    const { roomId, title, description, mode, totalRounds, rounds, ambientPackId } = body
    
    console.log('sociales-create received:', { mode, ambientPackId, hasAmbientPackId: !!ambientPackId })

    // Validate required fields
    if (!roomId || !mode) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: roomId, mode' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Derive totalRounds: use provided value, fall back to rounds array length, or 0 (ambient overrides later)
    const resolvedTotalRounds = totalRounds ?? rounds?.length ?? 0

    // Verify user is a member of the room (not banned)
    const { data: membership, error: membershipError } = await supabaseClient
      .from('room_memberships')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .eq('is_banned', false)
      .single()

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({ error: 'Must be a member of the room to create Sociale' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the Sociale
    const { data: sociale, error: createError } = await supabaseClient
      .from('sociales')
      .insert({
        room_id: roomId,
        created_by: user.id,
        title: title || null,
        description: description || null,
        mode,
        total_rounds: resolvedTotalRounds,
        status: 'draft',
        current_round_index: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) throw createError

    // Handle ambient mode
    if (mode === 'ambient') {
      // Use provided packId or fall back to default pack
      const targetPackId = ambientPackId || '00000000-0000-0000-0000-000000000001'
      
      // Store the pack_id on the sociale
      await supabaseClient
        .from('sociales')
        .update({ ambient_pack_id: targetPackId })
        .eq('id', sociale.id)

      // Ambient sociales don't create sociale_rounds.
      // Set total_rounds to the current size of ambient_rounds in the selected pack.
      const { count, error: countError } = await supabaseClient
        .from('ambient_rounds')
        .select('id', { count: 'exact', head: true })
        .eq('pack_id', targetPackId)

      if (countError) throw countError

      const ambientTotal = count ?? 0

      if (ambientTotal === 0) {
        // Roll back and reject - ambient mode requires a populated library
        await supabaseClient.from('sociales').delete().eq('id', sociale.id)
        return new Response(
          JSON.stringify({ error: 'ambient_rounds library is empty - populate it before creating an ambient sociale' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      await supabaseClient
        .from('sociales')
        .update({ total_rounds: ambientTotal })
        .eq('id', sociale.id)

      // Fetch the first ambient round to store in runtime_state
      const { data: firstRound } = await supabaseClient
        .from('ambient_rounds')
        .select('*')
        .eq('pack_id', targetPackId)
        .eq('order_index', 0)
        .single()

      if (firstRound) {
        await supabaseClient
          .from('sociales')
          .update({
            runtime_state: {
              ambientRound: {
                id: firstRound.id,
                type: firstRound.type,
                title: firstRound.title,
                content: firstRound.content,
                settings: firstRound.settings,
                hint: firstRound.hint,
                explanation: firstRound.explanation,
              }
            }
          })
          .eq('id', sociale.id)
      }

      // Set room pointer and return
      const { error: updateRoomError } = await supabaseClient
        .from('rooms')
        .update({ current_sociale_id: sociale.id })
        .eq('id', roomId)

      if (updateRoomError) {
        await supabaseClient.from('sociales').delete().eq('id', sociale.id)
        throw new Error(`Failed to set room pointer: ${updateRoomError.message}`)
      }

      return new Response(
        JSON.stringify({
          sociale: {
            id: sociale.id,
            roomId: sociale.room_id,
            createdBy: sociale.created_by,
            title: sociale.title,
            description: sociale.description,
            mode: sociale.mode,
            status: sociale.status,
            currentRoundIndex: null,
            totalRounds: ambientTotal,
            settings: sociale.settings || {},
            scoreboard: sociale.scoreboard || {},
            createdAt: sociale.created_at,
            updatedAt: sociale.updated_at,
          },
          rounds: [],
        } satisfies CreateSocialeResponse),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create rounds if provided
    if (rounds && rounds.length > 0) {
      // Create snapshots for all trivia rounds BEFORE inserting
      const roundsWithSnapshots = await Promise.all(
        rounds.map(async (round, index) => {
          let finalRound = { ...round }
          
          if (round.type === 'trivia') {
            const roundSettings = round.settings as any
            const questionPackId = roundSettings?.questionPackId
            
            if (questionPackId && body.previewQuestions) {
              // Use preview questions for exact order matching
              const previewQuestion = body.previewQuestions.find(pq => pq.roundIndex === index)
              
              if (previewQuestion) {
                console.log('🔥 Using preview question for round index:', index, 'prompt:', previewQuestion.prompt.substring(0, 50))
                
                // Fetch the complete question data for this preview question
                const { data: questions, error: questionError } = await supabaseClient
                  .from('trivia_questions')
                  .select(`
                    id,
                    prompt,
                    explanation,
                    format,
                    status,
                    trivia_question_options (
                      option_id,
                      option_text,
                      is_correct,
                      sort_order
                    )
                  `)
                  .eq('pack_id', questionPackId)
                  .eq('prompt', previewQuestion.prompt)
                  .eq('status', 'published')
                  .limit(1)

                if (questionError) {
                  console.error('Failed to fetch preview question:', questionError)
                  return finalRound
                }

                if (!questions || questions.length === 0) {
                  console.error('Preview question not found in pack:', previewQuestion.prompt)
                  return finalRound
                }

                const selectedQuestion = questions[0]
                console.log('🔥 Found preview question:', { id: selectedQuestion.id, format: selectedQuestion.format })

                // Create snapshot based on format
                let snapshot = null

                if (selectedQuestion.format === 'multiple_choice') {
                  const options = selectedQuestion.trivia_question_options
                    ?.sort((a: any, b: any) => a.sort_order - b.sort_order)
                    .map((opt: any) => ({
                      id: opt.option_id,
                      text: opt.option_text,
                    })) || []

                  const correctOption = selectedQuestion.trivia_question_options?.find((opt: any) => opt.is_correct)
                  
                  if (options.length >= 2 && correctOption) {
                    snapshot = {
                      prompt: selectedQuestion.prompt,
                      explanation: selectedQuestion.explanation || null,
                      multipleChoice: {
                        options,
                        correctOptionId: correctOption.option_id,
                      },
                    }
                  }
                } else if (selectedQuestion.format === 'written_answer') {
                  snapshot = {
                    prompt: selectedQuestion.prompt,
                    explanation: selectedQuestion.explanation || null,
                    writtenAnswer: {
                      acceptedAnswers: [],
                    },
                  }
                }

                if (snapshot) {
                  console.log('✅ Created snapshot from preview question for round index:', index, 'format:', selectedQuestion.format)
                  
                  // Update the round with snapshot and correct content
                  finalRound = {
                    ...finalRound,
                    settings: {
                      ...roundSettings,
                      format: selectedQuestion.format as string,
                      snapshot,
                    },
                    content: selectedQuestion.prompt, // Update content with the question
                  }
                }
              }
            }
          }
          
          return finalRound
        })
      )

      // Now insert all rounds with their snapshots in one atomic operation
      const roundsToCreate = roundsWithSnapshots.map((round, index) => ({
        sociale_id: sociale.id,
        order_index: index,
        type: round.type,
        title: round.title,
        content: round.content || null,
        settings: round.settings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      const { error: roundsError } = await supabaseClient
        .from('sociale_rounds')
        .insert(roundsToCreate)

      if (roundsError) throw roundsError

      console.log('✅ Successfully inserted all rounds with snapshots:', roundsToCreate.length)

      // Prepare prompt decks for topic and prompt rounds asynchronously
      const promptLibraryIds = new Set<string>()
      rounds.forEach(round => {
        if ((round.type === 'topic' || round.type === 'prompt') && round.settings?.promptLibraryId) {
          promptLibraryIds.add(round.settings.promptLibraryId)
        }
      })

      // Also add Sociale-level selected libraries
      if (body.selectedLibraries && Array.isArray(body.selectedLibraries)) {
        body.selectedLibraries.forEach((libId: string) => promptLibraryIds.add(libId))
      }

      // Create prompt decks for all libraries that will be used
      const promptDecks: Record<string, any> = {}
      for (const libraryId of promptLibraryIds) {
        try {
          // Get all prompts for this library
          const { data: prompts, error: promptError } = await supabaseClient
            .from('prompts')
            .select('text')
            .eq('library_id', libraryId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

          if (!promptError && prompts && prompts.length > 0) {
            // Shuffle the prompts to create a deck
            const shuffledPrompts = prompts
              .map((p: any) => p.text)
              .sort(() => Math.random() - 0.5) // Simple shuffle
            
            promptDecks[libraryId] = {
              libraryId,
              prompts: shuffledPrompts,
              cursor: 0,
              createdAt: new Date().toISOString()
            }
          }
        } catch (error) {
          console.error(`Failed to create prompt deck for library ${libraryId}:`, error)
        }
      }

      // Store prompt decks in runtime state
      if (Object.keys(promptDecks).length > 0) {
        await supabaseClient
          .from('sociales')
          .update({
            runtime_state: {
              promptDecks
            }
          })
          .eq('id', sociale.id)
      }
    }

    // Set the room's current_sociale_id pointer to make this Sociale immediately active
    const { error: updateRoomError } = await supabaseClient
      .from('rooms')
      .update({ current_sociale_id: sociale.id })
      .eq('id', roomId)

    if (updateRoomError) {
      // Rollback Sociale creation if room update fails
      await supabaseClient.from('sociales').delete().eq('id', sociale.id)
      throw new Error(`Failed to set room pointer: ${updateRoomError.message}`)
    }

    // Return the created Sociale
    const response: CreateSocialeResponse = {
      sociale: {
        id: sociale.id,
        roomId: sociale.room_id,
        createdBy: sociale.created_by,
        title: sociale.title,
        description: sociale.description,
        mode: sociale.mode,
        status: sociale.status,
        currentRoundIndex: sociale.current_round_index,
        phaseEndsAt: sociale.phase_ends_at,
        totalRounds: sociale.total_rounds,
        settings: sociale.settings || {},
        scoreboard: sociale.scoreboard || {},
        runtimeState: sociale.runtime_state,
        createdAt: sociale.created_at,
        updatedAt: sociale.updated_at,
        startedAt: sociale.started_at,
        endedAt: sociale.ended_at,
        legacySessionId: sociale.legacy_session_id,
      },
      rounds: rounds || [],
    }

    return new Response(
      JSON.stringify(response),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating Sociale:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

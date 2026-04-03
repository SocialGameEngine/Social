// =============================================================================
// SOCIALES CREATE EDGE FUNCTION
// =============================================================================
// Creates a new Sociale with optional rounds

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../types/database.ts'
import type { CreateSocialeRequest, CreateSocialeResponse } from '../../apps/top-comment/src/domain/types/sociale.types.ts'

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
    const { roomId, title, description, mode, totalRounds, rounds } = body

    // Validate required fields
    if (!roomId || !mode || !totalRounds) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: roomId, mode, totalRounds' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
        total_rounds: totalRounds,
        status: 'draft',
        current_round_index: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) throw createError

    // Create rounds if provided
    if (rounds && rounds.length > 0) {
      const roundsToCreate = rounds.map((round, index) => ({
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

// =============================================================================
// SOCIALES STATS FINALIZE EDGE FUNCTION
// =============================================================================
// Generates and stores round statistics for sequential stat cards

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../types/database.ts'

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
    const body = await req.json()
    const { socialeId, roundId } = body

    if (!socialeId || !roundId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: socialeId, roundId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the Sociale to verify it exists
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

    // Get all responses for this round
    const { data: responses, error: responsesError } = await supabaseClient
      .from('sociale_responses')
      .select('*')
      .eq('sociale_id', socialeId)
      .eq('resolved_round_id', roundId)
      .eq('is_practice', false) // Only count real responses, not practice

    if (responsesError) throw responsesError

    // Get all votes for this round
    const { data: votes, error: votesError } = await supabaseClient
      .from('sociale_votes')
      .select('*')
      .eq('sociale_id', socialeId)
      .eq('resolved_round_id', roundId)

    if (votesError) throw votesError

    // Get socialites for this Sociale
    const { data: socialites, error: socialitesError } = await supabaseClient
      .from('socialites')
      .select('*')
      .eq('sociale_id', socialeId)

    if (socialitesError) throw socialitesError

    // Calculate statistics
    const stats = {
      topAnswerer: null as {
        socialiteId: string;
        displayName: string;
        responseTime: number;
        response: string;
      } | null,
      fastestAnswer: null as {
        socialiteId: string;
        displayName: string;
        responseTime: number;
        response: string;
      } | null,
      mostUpvoted: null as {
        socialiteId: string;
        displayName: string;
        response: string;
        upvoteCount: number;
      } | null,
      perfectRound: null as {
        socialiteId: string;
        displayName: string;
        correctAnswers: number;
        totalAnswers: number;
      } | null,
    };

    // Find top answerer (first to submit correct answer)
    const correctResponses = responses.filter(r => r.is_correct);
    if (correctResponses.length > 0) {
      const firstCorrect = correctResponses.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[0];
      
      const socialite = socialites.find(s => s.id === firstCorrect.socialite_id);
      if (socialite) {
        stats.topAnswerer = {
          socialiteId: socialite.id,
          displayName: socialite.display_name,
          responseTime: Math.floor((new Date(firstCorrect.created_at).getTime() - new Date(sociale.phase_started_at!).getTime()) / 1000),
          response: String(firstCorrect.value),
        };
      }
    }

    // Find fastest answer
    if (correctResponses.length > 0) {
      const fastest = correctResponses.reduce((fastest, current) => {
        const currentTime = new Date(current.created_at).getTime();
        const fastestTime = new Date(fastest.created_at).getTime();
        return currentTime < fastestTime ? current : fastest;
      });
      
      const socialite = socialites.find(s => s.id === fastest.socialite_id);
      if (socialite) {
        stats.fastestAnswer = {
          socialiteId: socialite.id,
          displayName: socialite.display_name,
          responseTime: Math.floor((new Date(fastest.created_at).getTime() - new Date(sociale.phase_started_at!).getTime()) / 1000),
          response: String(fastest.value),
        };
      }
    }

    // Find most upvoted response
    const voteCounts = new Map<string, number>();
    votes.forEach(vote => {
      const count = voteCounts.get(vote.target_response_id) || 0;
      voteCounts.set(vote.target_response_id, count + 1);
    });

    if (voteCounts.size > 0) {
      const mostUpvotedResponseId = Array.from(voteCounts.entries()).reduce((a, b) => 
        b[1] > a[1] ? b : a
      )[0];
      
      const mostUpvotedResponse = responses.find(r => r.id === mostUpvotedResponseId);
      if (mostUpvotedResponse) {
        const socialite = socialites.find(s => s.id === mostUpvotedResponse.socialite_id);
        if (socialite) {
          stats.mostUpvoted = {
            socialiteId: socialite.id,
            displayName: socialite.display_name,
            response: String(mostUpvotedResponse.value),
            upvoteCount: voteCounts.get(mostUpvotedResponseId)!,
          };
        }
      }
    }

    // Find perfect round (all answers correct)
    const responseCounts = new Map<string, { correct: number; total: number }>();
    responses.forEach(response => {
      const current = responseCounts.get(response.socialite_id) || { correct: 0, total: 0 };
      responseCounts.set(response.socialite_id, {
        correct: current.correct + (response.is_correct ? 1 : 0),
        total: current.total + 1,
      });
    });

    responseCounts.forEach((counts, socialiteId) => {
      if (counts.correct === counts.total && counts.total > 0) {
        const socialite = socialites.find(s => s.id === socialiteId);
        if (socialite && (!stats.perfectRound || counts.total > stats.perfectRound.totalAnswers)) {
          stats.perfectRound = {
            socialiteId: socialite.id,
            displayName: socialite.display_name,
            correctAnswers: counts.correct,
            totalAnswers: counts.total,
          };
        }
      }
    });

    // Store stats in runtime_state for broadcasting
    const { error: updateError } = await supabaseClient
      .from('sociales')
      .update({
        runtime_state: {
          ...(sociale.runtime_state || {}),
          roundStats: stats,
          statsGeneratedAt: new Date().toISOString(),
        }
      })
      .eq('id', socialeId);

    if (updateError) throw updateError

    // Broadcast stats to the Sociale channel
    await supabaseClient.channel(`sociale_${socialeId}`).send({
      type: 'broadcast',
      event: 'stats.finalized',
      payload: {
        roundId,
        stats,
        timestamp: new Date().toISOString(),
      }
    });

    // Store session stats for each socialite
    for (const [socialiteId, counts] of responseCounts) {
      const { error: sessionStatsError } = await supabaseClient
        .from('sociale_session_stats')
        .upsert({
          sociale_id: socialeId,
          socialite_id: socialiteId,
          round_score: counts.correct * 100, // 100 points per correct answer
          answers_submitted: counts.total,
          accuracy: counts.total > 0 ? counts.correct / counts.total : 0,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'sociale_id,socialite_id'
        });

      if (sessionStatsError) throw sessionStatsError;
    }

    return new Response(
      JSON.stringify({ stats }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error finalizing stats:', error)
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

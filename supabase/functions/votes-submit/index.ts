// Submit a vote for an answer
import { createHandler, requireString, corsResponse, getSession, validateSessionPhase, AppError } from '../_shared/utils.ts';

async function handleSubmitVote(req: Request, uid: string, supabase: any): Promise<Response> {
    const { sessionId, answerId } = await req.json();
    
    requireString(sessionId, 'sessionId');
    requireString(answerId, 'answerId');
    
  // Get and validate session
  const session = await getSession(supabase, sessionId);
  validateSessionPhase(session, 'vote');
    
    // Get user's team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('session_id', sessionId)
      .eq('uid', uid)
      .single();
    
    if (teamError || !team) {
      throw new AppError(404, 'Team not found', 'not-found');
    }
    
    // Get the answer being voted for
    const { data: answer, error: answerError } = await supabase
      .from('answers')
      .select('team_id, round_index, group_id')
      .eq('id', answerId)
      .eq('session_id', sessionId)
      .single();
    
    if (answerError || !answer) {
      throw new AppError(404, 'Answer not found', 'not-found');
    }
    
    // Can't vote for your own answer
    if (answer.team_id === team.id) {
      throw new AppError(400, 'Cannot vote for your own answer', 'failed-precondition');
    }
    
    const roundIndex = session.round_index || 0;
    const voteGroupIndex = session.vote_group_index ?? 0;
    const currentRound = session.rounds?.[roundIndex];
    const currentGroup = currentRound?.groups?.[voteGroupIndex];
    
    if (!currentGroup) {
      throw new AppError(400, 'Invalid voting group', 'failed-precondition');
    }
    
    // Verify answer is in current group
    if (answer.group_id !== currentGroup.id) {
      throw new AppError(400, 'Answer not in current voting group', 'failed-precondition');
    }
    
    // Use upsert to either create new vote or update existing one
    const voteData = {
      session_id: sessionId,
      voter_id: team.id,
      answer_id: answerId,
      round_index: roundIndex,
      group_id: currentGroup.id,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from('votes')
      .upsert(voteData, {
        onConflict: 'voter_id,round_index,group_id'
      });
    
    if (upsertError) throw upsertError;
    
    return corsResponse({ success: true });
  }

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleSubmitVote));

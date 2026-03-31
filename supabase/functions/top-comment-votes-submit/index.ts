// Submit a vote for an answer
import { createHandler, requireString, corsResponse, AppError } from '../_shared/utils.ts';
import { getTopCommentSession, validateTopCommentSessionPhase } from '../_shared/top-comment-utils.ts';

async function handleSubmitVote(req: Request, uid: string, supabase: any): Promise<Response> {
    const { sessionId, answerId } = await req.json();
    
    requireString(sessionId, 'sessionId');
    requireString(answerId, 'answerId');
    
  // Get and validate session
  const session = await getTopCommentSession(supabase, sessionId);
  validateTopCommentSessionPhase(session, 'vote');
    
    // Get user's player record via team_members (preferred)
    let teamId: string | null = null;

    const { data: teamMember, error: memberError } = await supabase
      .from('top_comment_players')
      .select('id, session_id')
      .eq('user_id', uid)
      .eq('session_id', sessionId)
      .single();

    if (!memberError && teamMember?.id) {
      teamId = teamMember.id;
    }

    if (!teamId) {
      const { data: team, error: teamError } = await supabase
        .from('top_comment_players')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', uid)
        .single();

      if (teamError || !team) {
        throw new AppError(404, 'Player not found', 'not-found');
      }

      teamId = team.id;
    }
    
    // Get the answer being voted for
    const { data: answer, error: answerError } = await supabase
      .from('top_comment_answers')
      .select('player_id, round_index, group_id')
      .eq('id', answerId)
      .eq('session_id', sessionId)
      .single();
    
    if (answerError || !answer) {
      throw new AppError(404, 'Answer not found', 'not-found');
    }
    
    // Can't vote for your own answer
    if (answer.player_id === teamId) {
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
      player_id: teamId,
      answer_id: answerId,
      round_index: roundIndex,
      group_id: currentGroup.id,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from('top_comment_votes')
      .upsert(voteData, {
        onConflict: 'player_id,round_index,group_id'
      });
    
    if (upsertError) throw upsertError;
    
    return corsResponse({ success: true });
  }

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleSubmitVote));

// End a game session
import { createHandler, requireString, corsResponse, AppError } from '../_shared/utils.ts';
import { getTopCommentSession } from '../_shared/top-comment-utils.ts';
import type { Session } from '../_shared/types.ts';

async function handleEndSession(req: Request, uid: string, supabase: any): Promise<Response> {
    const { sessionId } = await req.json();
    
    requireString(sessionId, 'sessionId');
    
  // Get and validate session + host permissions
  const session = await getTopCommentSession(supabase, sessionId);
    
    if (session.host_uid !== uid) {
    throw new AppError(403, 'Only the host can end the session', 'permission-denied');
    }
    
    // Update session to ended
    const { data: updatedSession, error: updateError } = await supabase
      .from('top_comment_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        ends_at: null,
        ended_by_host: true, // Flag that host manually ended the session
      })
      .eq('id', sessionId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    if (session.room_id) {
      const { error: updateRoomError } = await supabase
        .from('rooms')
        .update({
          current_session_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.room_id);
      
      if (updateRoomError) {
        throw updateRoomError;
      }
    }
    
    // Calculate final analytics
    const { data: teams } = await supabase
      .from('top_comment_players')
      .select('id')
      .eq('session_id', sessionId);
    
    const { data: answers } = await supabase
      .from('top_comment_answers')
      .select('id')
      .eq('session_id', sessionId);
    
    const { data: votes } = await supabase
      .from('top_comment_votes')
      .select('id')
      .eq('session_id', sessionId);
    
    const teamCount = teams?.length || 0;
    const answerCount = answers?.length || 0;
    const voteCount = votes?.length || 0;
    
    const expectedAnswers = teamCount * (session.round_index + 1);
    const expectedVotes = teamCount * (session.round_index + 1);
    
    const answerRate = expectedAnswers > 0 ? (answerCount / expectedAnswers) * 100 : 0;
    const voteRate = expectedVotes > 0 ? (voteCount / expectedVotes) * 100 : 0;
    
    const duration = session.started_at
      ? Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)
      : 0;
    
    await supabase
      .from('top_comment_session_analytics')
      .update({
        joined_count: teamCount,
        answer_rate: answerRate,
        vote_rate: voteRate,
        duration,
      })
      .eq('session_id', sessionId);
    
    return corsResponse({ session: updatedSession as Session });
  }

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleEndSession));
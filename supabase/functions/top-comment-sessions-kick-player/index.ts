// Kick a player from a session
import { createHandler, requireString, corsResponse, AppError } from '../_shared/utils.ts';
import { getTopCommentSession } from '../_shared/top-comment-utils.ts';

async function handleKickPlayer(req: Request, uid: string, supabase: any): Promise<Response> {
    const { sessionId, teamId, userId } = await req.json();
    
    requireString(sessionId, 'sessionId');
    requireString(teamId, 'teamId');
    requireString(userId, 'userId');
    
  // Get and validate session + host permissions
  const session = await getTopCommentSession(supabase, sessionId);
    
    if (session.host_uid !== uid) {
      throw new AppError(403, 'Only the host can kick players', 'permission-denied');
    }
    
    // Get team
    const { data: team, error: teamError } = await supabase
      .from('top_comment_players')
      .select('is_host')
      .eq('id', teamId)
      .eq('session_id', sessionId)
      .single();
    
    if (teamError || !team) {
      throw new AppError(404, 'Team not found', 'not-found');
    }
    
    // Can't kick the host
    if (team.is_host) {
      throw new AppError(400, 'Cannot kick the host', 'failed-precondition');
    }
    
    // Remove the player record
    const { error: deleteError } = await supabase
      .from('top_comment_players')
      .delete()
      .eq('id', teamId)
      .eq('session_id', sessionId);
    
    if (deleteError) throw deleteError;
    
    return corsResponse({ success: true });
  }

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleKickPlayer));
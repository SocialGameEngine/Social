// Host kick member - allows host to kick any member from any team
import { createHandler, requireString, corsResponse, AppError } from '../_shared/utils.ts';
import { getTopCommentSession } from '../_shared/top-comment-utils.ts';

async function handleHostKickMember(req: Request, uid: string, supabase: any): Promise<Response> {
    const { sessionId, teamId, userIdToKick } = await req.json();
    
    console.log('Host kick member request:', { sessionId, teamId, userIdToKick, uid });
    
    requireString(sessionId, 'sessionId');
    requireString(teamId, 'teamId');
    requireString(userIdToKick, 'userIdToKick');
    
    // Get and validate session + host permissions
    const session = await getTopCommentSession(supabase, sessionId);
    
    console.log('Session found:', { sessionHost: session?.host_uid, requestUid: uid });
    
    if (session.host_uid !== uid) {
        console.log('Permission denied: not host');
        throw new AppError(403, 'Only the host can kick members', 'permission-denied');
    }
    
    // Host cannot kick themselves
    if (userIdToKick === uid) {
        throw new AppError(400, 'Cannot kick yourself', 'failed-precondition');
    }

    // Remove the player record
    const { error: deleteError } = await supabase
        .from('top_comment_players')
        .delete()
        .eq('id', teamId)
        .eq('session_id', sessionId)
        .eq('user_id', userIdToKick);
    
    if (deleteError) {
        console.error('Error removing player:', deleteError);
        throw new AppError(500, 'Failed to kick player', 'internal-error');
    }
    
    console.log(`Host ${uid} kicked player ${userIdToKick} from session ${sessionId}`);
    
    return corsResponse({ success: true });
}

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleHostKickMember));

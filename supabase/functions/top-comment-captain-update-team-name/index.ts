// Allow captains to update their team name (only in lobby phase)
import { createHandler, requireString, corsResponse, AppError } from '../_shared/utils.ts';
import { getTopCommentSession } from '../_shared/top-comment-utils.ts';

async function handleCaptainUpdateTeamName(req: Request, uid: string, supabase: any): Promise<Response> {
    const { sessionId, teamId, teamName } = await req.json();
    
    requireString(sessionId, 'sessionId');
    requireString(teamId, 'teamId');
    requireString(teamName, 'teamName');
    
    // Get and validate session
    const session = await getTopCommentSession(supabase, sessionId);
    
    // Only allow team name changes in lobby phase
    if (session.status !== 'lobby') {
        throw new AppError(400, 'Team name can only be changed before the game starts', 'failed-precondition');
    }
    
    // Validate team name length
    const trimmedName = teamName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 15) {
        throw new AppError(400, 'Team name must be between 2 and 15 characters', 'invalid-argument');
    }
    
    // Verify player exists
    const { data: team, error: teamError } = await supabase
        .from('top_comment_players')
        .select('user_id, display_name')
        .eq('id', teamId)
        .eq('session_id', sessionId)
        .single();
    
    if (teamError || !team) {
        throw new AppError(404, 'Team not found', 'not-found');
    }
    
    if (team.user_id !== uid) {
        throw new AppError(403, 'Only the player can change their name', 'permission-denied');
    }
    
    // Update the display name
    const { error: updateError } = await supabase
        .from('top_comment_players')
        .update({ display_name: trimmedName })
        .eq('id', teamId);
    
    if (updateError) {
        throw new AppError(500, 'Failed to update team name', 'internal');
    }
    
    console.log(`Player ${uid} updated name to "${trimmedName}"`);
    
    return corsResponse({ success: true });
}

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleCaptainUpdateTeamName));

// Host kick member - allows host to kick any member from any team
import { createHandler, requireString, corsResponse, getSession, AppError } from '../_shared/utils.ts';

async function handleHostKickMember(req: Request, uid: string, supabase: any): Promise<Response> {
    const { sessionId, teamId, userIdToKick } = await req.json();
    
    console.log('Host kick member request:', { sessionId, teamId, userIdToKick, uid });
    
    requireString(sessionId, 'sessionId');
    requireString(teamId, 'teamId');
    requireString(userIdToKick, 'userIdToKick');
    
    // Get and validate session + host permissions
    const session = await getSession(supabase, sessionId);
    
    console.log('Session found:', { sessionHost: session?.host_uid, requestUid: uid });
    
    if (session.host_uid !== uid) {
        console.log('Permission denied: not host');
        throw new AppError(403, 'Only the host can kick members', 'permission-denied');
    }
    
    // Get team
    const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, team_name')
        .eq('id', teamId)
        .eq('session_id', sessionId)
        .single();
    
    if (teamError || !team) {
        throw new AppError(404, 'Team not found', 'not-found');
    }
    
    // Host cannot kick themselves
    if (userIdToKick === uid) {
        throw new AppError(400, 'Cannot kick yourself', 'failed-precondition');
    }
    
    // Verify the user to kick is a member of this team
    const { data: memberToKick, error: memberError } = await supabase
        .from('team_members')
        .select('id, user_id, player_name, is_captain')
        .eq('team_id', teamId)
        .eq('user_id', userIdToKick)
        .single();
    
    if (memberError || !memberToKick) {
        throw new AppError(404, 'Player not found in team', 'not-found');
    }
    
    // Check if the member being kicked is the captain
    const isKickingCaptain = memberToKick.is_captain;
    
    // Remove the member
    const { error: deleteError } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberToKick.id);
    
    if (deleteError) {
        console.error('Error removing team member:', deleteError);
        throw new AppError(500, 'Failed to kick member', 'internal-error');
    }
    
    // If we kicked the captain, promote a new captain if there are other members
    if (isKickingCaptain) {
        // Get remaining team members
        const { data: remainingMembers, error: remainingError } = await supabase
            .from('team_members')
            .select('id, user_id, player_name')
            .eq('team_id', teamId)
            .limit(1); // Just need one member to promote
        
        if (remainingError) {
            console.error('Error getting remaining members:', remainingError);
        } else if (remainingMembers && remainingMembers.length > 0) {
            // Promote the first remaining member to captain
            const newCaptain = remainingMembers[0];
            const { error: promoteError } = await supabase
                .from('team_members')
                .update({ is_captain: true })
                .eq('id', newCaptain.id);
            
            if (promoteError) {
                console.error('Error promoting new captain:', promoteError);
            } else {
                // Update team captain_id and uid
                const { error: teamUpdateError } = await supabase
                    .from('teams')
                    .update({
                        captain_id: newCaptain.user_id,
                        uid: newCaptain.user_id
                    })
                    .eq('id', teamId);
                
                if (teamUpdateError) {
                    console.error('Error updating team captain:', teamUpdateError);
                } else {
                    console.log(`Promoted ${newCaptain.user_id} to captain of team ${teamId}`);
                }
            }
        } else {
            // No remaining members, clear team captain
            const { error: teamUpdateError } = await supabase
                .from('teams')
                .update({
                    captain_id: null,
                    uid: null
                })
                .eq('id', teamId);
            
            if (teamUpdateError) {
                console.error('Error clearing team captain:', teamUpdateError);
            } else {
                console.log(`Cleared captain for empty team ${teamId}`);
            }
        }
    }
    
    console.log(`Host ${uid} kicked member ${userIdToKick} from team ${teamId}`);
    
    return corsResponse({ success: true });
}

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleHostKickMember));

// Allow captains to promote another member to captain role
import { createHandler, requireString, corsResponse, getSession, AppError } from '../_shared/utils.ts';

async function handleCaptainPromote(req: Request, uid: string, supabase: any): Promise<Response> {
    const { sessionId, teamId, userIdToPromote } = await req.json();
    
    requireString(sessionId, 'sessionId');
    requireString(teamId, 'teamId');
    requireString(userIdToPromote, 'userIdToPromote');
    
    // Verify session exists
    await getSession(supabase, sessionId);
    
    // Verify caller is the captain of this team
    const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('captain_id, uid')
        .eq('id', teamId)
        .eq('session_id', sessionId)
        .single();
    
    if (teamError || !team) {
        throw new AppError(404, 'Team not found', 'not-found');
    }
    
    // Check if caller is the captain
    if (team.captain_id !== uid && team.uid !== uid) {
        throw new AppError(403, 'Only the team captain can promote members', 'permission-denied');
    }
    
    // Captain cannot promote themselves
    if (userIdToPromote === uid) {
        throw new AppError(400, 'Cannot promote yourself', 'failed-precondition');
    }
    
    // Verify the user to promote is a member of this team
    const { data: memberToPromote, error: memberError } = await supabase
        .from('team_members')
        .select('id, user_id, player_name, is_captain')
        .eq('team_id', teamId)
        .eq('user_id', userIdToPromote)
        .single();
    
    if (memberError || !memberToPromote) {
        throw new AppError(404, 'Player not found in team', 'not-found');
    }
    
    // Check if the member is already captain
    if (memberToPromote.is_captain) {
        throw new AppError(400, 'Player is already captain', 'failed-precondition');
    }
    
    // Start transaction to promote the new captain
    try {
        // 1. Update current captain to member (remove captain status)
        await supabase
            .from('team_members')
            .update({ is_captain: false })
            .eq('team_id', teamId)
            .eq('user_id', uid);
        
        // 2. Update new captain to captain
        await supabase
            .from('team_members')
            .update({ is_captain: true })
            .eq('id', memberToPromote.id);
        
        // 3. Update team captain_id and uid
        await supabase
            .from('teams')
            .update({
                captain_id: userIdToPromote,
                uid: userIdToPromote
            })
            .eq('id', teamId);
        
        console.log(`Captain role transferred from ${uid} to ${userIdToPromote} in team ${teamId}`);
        
        return corsResponse({ success: true });
    } catch (error) {
        console.error('Error promoting captain:', error);
        throw new AppError(500, 'Failed to promote captain', 'internal-error');
    }
}

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleCaptainPromote));

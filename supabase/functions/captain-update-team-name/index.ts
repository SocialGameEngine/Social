// Allow captains to update their team name (only in lobby phase)
import { createHandler, requireString, corsResponse, getSession, AppError } from '../_shared/utils.ts';

async function handleCaptainUpdateTeamName(req: Request, uid: string, supabase: any): Promise<Response> {
    const { sessionId, teamId, teamName } = await req.json();
    
    requireString(sessionId, 'sessionId');
    requireString(teamId, 'teamId');
    requireString(teamName, 'teamName');
    
    // Get and validate session
    const session = await getSession(supabase, sessionId);
    
    // Only allow team name changes in lobby phase
    if (session.status !== 'lobby') {
        throw new AppError(400, 'Team name can only be changed before the game starts', 'failed-precondition');
    }
    
    // Validate team name length
    const trimmedName = teamName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 15) {
        throw new AppError(400, 'Team name must be between 2 and 15 characters', 'invalid-argument');
    }
    
    // Verify team exists
    const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('uid, team_name')
        .eq('id', teamId)
        .eq('session_id', sessionId)
        .single();
    
    if (teamError || !team) {
        throw new AppError(404, 'Team not found', 'not-found');
    }
    
    // Check if caller is the captain by looking in team_members table
    const { data: captainMember, error: captainError } = await supabase
        .from('team_members')
        .select('is_captain')
        .eq('team_id', teamId)
        .eq('user_id', uid)
        .eq('is_captain', true)
        .single();
    
    // Also check if they're the team owner (uid matches)
    const isTeamOwner = team.uid === uid;
    const isCaptain = captainMember !== null && !captainError;
    
    if (!isTeamOwner && !isCaptain) {
        throw new AppError(403, 'Only the team captain can change the team name', 'permission-denied');
    }
    
    // Check if team name is already taken in this session
    const { data: existingTeam, error: checkError } = await supabase
        .from('teams')
        .select('id')
        .eq('session_id', sessionId)
        .eq('team_name', trimmedName)
        .neq('id', teamId)
        .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new AppError(500, 'Error checking team name availability', 'internal');
    }
    
    if (existingTeam) {
        throw new AppError(400, 'Team name is already taken', 'already-exists');
    }
    
    // Update the team name
    const { error: updateError } = await supabase
        .from('teams')
        .update({ team_name: trimmedName })
        .eq('id', teamId);
    
    if (updateError) {
        throw new AppError(500, 'Failed to update team name', 'internal');
    }
    
    console.log(`Captain ${uid} updated team ${teamId} name to "${trimmedName}"`);
    
    return corsResponse({ success: true });
}

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleCaptainUpdateTeamName));

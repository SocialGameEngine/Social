// Allow captains to kick members from their own team
import { createHandler, requireString, corsResponse, getSession, AppError } from '../_shared/utils.ts';

async function handleCaptainKick(req: Request, uid: string, supabase: any): Promise<Response> {
    const { sessionId, teamId, userIdToKick } = await req.json();
    
    requireString(sessionId, 'sessionId');
    requireString(teamId, 'teamId');
    requireString(userIdToKick, 'userIdToKick');
    
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
      throw new AppError(403, 'Only the team captain can kick members', 'permission-denied');
    }
    
    // Captain cannot kick themselves
    if (userIdToKick === uid) {
      throw new AppError(400, 'Cannot kick yourself', 'failed-precondition');
    }
    
    // Verify the user to kick is a member of this team
    const { data: memberToKick, error: memberError } = await supabase
      .from('team_members')
      .select('id, user_id, player_name')
      .eq('team_id', teamId)
      .eq('user_id', userIdToKick)
      .single();
    
    if (memberError || !memberToKick) {
      throw new AppError(404, 'Player not found in team', 'not-found');
    }
    
    // Remove the member
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberToKick.id);
    
    if (deleteError) throw deleteError;
    
    console.log(`Captain ${uid} kicked ${memberToKick.player_name} (${userIdToKick}) from team ${teamId}`);
    
    return corsResponse({ success: true });
}

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleCaptainKick));

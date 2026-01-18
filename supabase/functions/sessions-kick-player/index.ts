// Kick a player from a session
import { createHandler, requireString, corsResponse, getSession, AppError } from '../_shared/utils.ts';

async function handleKickPlayer(req: Request, uid: string, supabase: any): Promise<Response> {
    const { sessionId, teamId, userId } = await req.json();
    
    requireString(sessionId, 'sessionId');
    requireString(teamId, 'teamId');
    requireString(userId, 'userId');
    
  // Get and validate session + host permissions
  const session = await getSession(supabase, sessionId);
    
    if (session.host_uid !== uid) {
      throw new AppError(403, 'Only the host can kick players', 'permission-denied');
    }
    
    // Get team
    const { data: team, error: teamError } = await supabase
      .from('teams')
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
    
    // Get the team member to check if they're the captain
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('user_id, is_captain')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();
    
    if (memberError || !member) {
      throw new AppError(404, 'Player not found in team', 'not-found');
    }
    
    // Remove the player from team_members
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);
    
    if (deleteError) throw deleteError;
    
    // If kicked player was captain, handle captain promotion
    if (member.is_captain) {
      console.log('Kicked player was captain, checking for remaining members');
      
      // Get remaining team members
      const { data: remainingMembers } = await supabase
        .from('team_members')
        .select('id, user_id')
        .eq('team_id', teamId)
        .order('joined_at', { ascending: true });
      
      if (remainingMembers && remainingMembers.length > 0) {
        // Promote first remaining member to captain
        const newCaptain = remainingMembers[0];
        console.log('Promoting new captain:', newCaptain.user_id);
        
        // Update team with new captain
        await supabase
          .from('teams')
          .update({
            captain_id: newCaptain.user_id,
            uid: newCaptain.user_id
          })
          .eq('id', teamId);
        
        // Update team_members to mark new captain
        await supabase
          .from('team_members')
          .update({ is_captain: true })
          .eq('id', newCaptain.id);
        
        console.log('Successfully promoted new captain');
      } else {
        // No members left, clear captain fields (team becomes invisible)
        console.log('No members left, clearing captain fields');
        
        await supabase
          .from('teams')
          .update({
            captain_id: null,
            uid: null
          })
          .eq('id', teamId);
        
        console.log('Team is now empty and invisible');
      }
    }
    
    return corsResponse({ success: true });
  }

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleKickPlayer));
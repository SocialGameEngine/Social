// Submit an answer for a prompt
// @ts-nocheck - Deno runtime types not available in IDE
import { createHandler, requireString, corsResponse, getSession, validateSessionPhase, AppError } from '../_shared/utils.ts';
import { moderateContent } from '../_shared/moderation.ts';

async function handleSubmitAnswer(req: Request, uid: string, supabase: any): Promise<Response> {
  const { sessionId, text } = await req.json();

  console.log('answers-submit: Received request', { uid, sessionId, textLength: text?.length });

  requireString(sessionId, 'sessionId');
  const cleanedText = requireString(text, 'text').slice(0, 200);

  console.log('answers-submit: Validation passed', { sessionId, cleanedTextLength: cleanedText.length });

  // Get and validate session
  const session = await getSession(supabase, sessionId);
  validateSessionPhase(session, 'answer');

  console.log('answers-submit: Session validated', { sessionId, phase: session.status });
    
    // Get user's team - check both team_members (new schema) and teams (old schema)
    console.log('answers-submit: Looking up team', { sessionId, uid });
    
    let team = null;
    
    // First try team_members table (new schema)
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select('team_id, teams!inner(id, session_id)')
      .eq('user_id', uid)
      .eq('teams.session_id', sessionId)
      .order('joined_at', { ascending: false })
      .limit(1);
    
    console.log('answers-submit: Team members lookup result', { 
      hasTeams: !!teamMembers, 
      hasError: !!teamError, 
      error: teamError?.message, 
      teamCount: teamMembers?.length 
    });

    if (!teamError && teamMembers && teamMembers.length > 0) {
      team = { id: teamMembers[0].team_id };
      console.log('answers-submit: Found team via team_members', { teamId: team.id });
    } else {
      // Fallback to teams table (old schema)
      const { data: directTeams, error: directError } = await supabase
        .from('teams')
        .select('id')
        .eq('uid', uid)
        .eq('session_id', sessionId)
        .limit(1);
      
      console.log('answers-submit: Direct teams lookup result', { 
        hasTeams: !!directTeams, 
        hasError: !!directError, 
        error: directError?.message, 
        teamCount: directTeams?.length 
      });
      
      if (!directError && directTeams && directTeams.length > 0) {
        team = directTeams[0];
        console.log('answers-submit: Found team via teams table', { teamId: team.id });
      }
    }

    if (!team) {
      throw new AppError(404, 'Team not found', 'not-found');
    }
    
    // Find which group this team is in for current round
    const roundIndex = session.round_index || 0;
    const rounds = session.rounds || [];
    console.log('answers-submit: Round data', {
      roundIndex,
      roundsLength: rounds.length,
      sessionRounds: session.rounds,
      sessionRoundIndex: session.round_index
    });

    const currentRound = rounds[roundIndex];

    console.log('answers-submit: Current round', { currentRound: !!currentRound, currentRoundData: currentRound });

    if (!currentRound) {
      throw new AppError(400, 'Invalid round', 'failed-precondition');
    }

    let groupId = 'g0';
    console.log('answers-submit: Looking for team in groups', { teamId: team.id, groupsCount: currentRound.groups?.length });
    for (const group of currentRound.groups) {
      console.log('answers-submit: Checking group', { groupId: group.id, teamIds: group.teamIds });
      if (group.teamIds.includes(team.id)) {
        groupId = group.id;
        console.log('answers-submit: Found team in group', { groupId });
        break;
      }
    }
    
    // Content moderation (block list + OpenAI)
    console.log('answers-submit: Running content moderation');
    const prompt = currentRound.groups.find((g: any) => g.id === groupId)?.prompt || '';
    const moderationResult = await moderateContent(cleanedText, prompt);
    
    if (!moderationResult.allowed) {
      console.log('answers-submit: Content rejected', { reason: moderationResult.reason, details: moderationResult.details });
      throw new AppError(400, moderationResult.reason || 'BLOCKED_CONTENT', moderationResult.reason || 'content-rejected');
    }
    
    console.log('answers-submit: Content approved');
    
    // Check if already answered (for logging/tracking purposes)
    console.log('answers-submit: Checking for existing answer', { sessionId, teamId: team.id, roundIndex });
    const { data: existingAnswer } = await supabase
      .from('answers')
      .select('id, created_at')
      .eq('session_id', sessionId)
      .eq('team_id', team.id)
      .eq('round_index', roundIndex)
      .single();

    console.log('answers-submit: Existing answer check', { hasExistingAnswer: !!existingAnswer, existingAnswerId: existingAnswer?.id });

    const isUpdate = !!existingAnswer;
    
    // Use upsert to either create new answer or update existing one
    const answerData = {
      session_id: sessionId,
      team_id: team.id,
      round_index: roundIndex,
      group_id: groupId,
      text: cleanedText,
      masked: false,
      updated_at: new Date().toISOString(),
    };

    console.log('answers-submit: Upserting answer', {
      sessionId,
      teamId: team.id,
      roundIndex,
      groupId,
      textLength: cleanedText.length,
      isUpdate
    });

    const { error: upsertError } = await supabase
      .from('answers')
      .upsert(answerData, {
        onConflict: 'session_id,team_id,round_index'
      });

    console.log('answers-submit: Upsert result', { hasError: !!upsertError, error: upsertError?.message });

    if (upsertError) throw upsertError;

  console.log('answers-submit: Success', { isUpdate });
  return corsResponse({ success: true, isUpdate });
}

Deno.serve(createHandler(handleSubmitAnswer));



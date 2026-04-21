// Allow captains to kick members from their own team
import { createHandler, requireString, corsResponse, AppError } from '../_shared/utils.ts';
import { getTopCommentSession } from '../_shared/top-comment-utils.ts';

async function handleCaptainKick(req: Request, uid: string, supabase: any): Promise<Response> {
    const { sessionId, teamId, userIdToKick } = await req.json();
    
    requireString(sessionId, 'sessionId');
    requireString(teamId, 'teamId');
    requireString(userIdToKick, 'userIdToKick');
    
    await getTopCommentSession(supabase, sessionId);
    throw new AppError(400, 'Captain controls are disabled in top-comment', 'failed-precondition');
}

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleCaptainKick));

// Allow captains to promote another member to captain role
import { createHandler, requireString, corsResponse, AppError } from '../_shared/utils.ts';
import { getTopCommentSession } from '../_shared/top-comment-utils.ts';

async function handleCaptainPromote(req: Request, uid: string, supabase: any): Promise<Response> {
    const { sessionId, teamId, userIdToPromote } = await req.json();
    
    requireString(sessionId, 'sessionId');
    requireString(teamId, 'teamId');
    requireString(userIdToPromote, 'userIdToPromote');
    
    await getTopCommentSession(supabase, sessionId);
    throw new AppError(400, 'Captain controls are disabled in top-comment', 'failed-precondition');
}

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleCaptainPromote));

// Set the prompt library for a session
import { createHandler, requireString, corsResponse, AppError } from '../_shared/utils.ts';
import { getTopCommentSession } from '../_shared/top-comment-utils.ts';
import { getPromptLibrary } from '../_shared/prompts.ts';
import type { Session } from '../_shared/types.ts';

async function handleSetPromptLibrary(req: Request, uid: string, supabase: any): Promise<Response> {
    const { sessionId, promptLibraryId } = await req.json();
    
    requireString(sessionId, 'sessionId');
    requireString(promptLibraryId, 'promptLibraryId');
    
  // Get and validate session (also checks host permissions)
  const session = await getTopCommentSession(supabase, sessionId);
    
    if (session.host_uid !== uid) {
      throw new AppError(403, 'Only the host can change settings', 'permission-denied');
    }
    
  // Validate session is in lobby phase
    if (session.status !== 'lobby') {
      throw new AppError(400, 'Can only change prompt library in lobby', 'failed-precondition');
    }
    
    // Get new prompt library and shuffle
    const library = await getPromptLibrary(promptLibraryId);
    const promptDeck = [...library.prompts].sort(() => Math.random() - 0.5);
    
    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('top_comment_sessions')
      .update({
        prompt_library_id: promptLibraryId,
        prompt_deck: promptDeck,
        prompt_cursor: 0,
      })
      .eq('id', sessionId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    return corsResponse({ session: updatedSession as Session });
  }

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleSetPromptLibrary));
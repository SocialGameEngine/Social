// Get analytics for a session
import { createHandler, requireString, corsResponse, AppError } from '../_shared/utils.ts';

async function handleGetAnalytics(req: Request, uid: string, supabase: any): Promise<Response> {
    const { sessionId } = await req.json();
    
    requireString(sessionId, 'sessionId');
    
  // Verify user is host
    const { data: session, error: sessionError } = await supabase
      .from('top_comment_sessions')
      .select('host_uid')
      .eq('id', sessionId)
      .single();
    
    if (sessionError || !session) {
      throw new AppError(404, 'Session not found', 'not-found');
    }
    
    if (session.host_uid !== uid) {
      throw new AppError(403, 'Only the host can view analytics', 'permission-denied');
    }
    
    // Get analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('top_comment_session_analytics')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    if (analyticsError) {
      // Return default if not found
      return corsResponse({
        analytics: {
          joinedCount: 0,
          answerRate: 0,
          voteRate: 0,
          duration: 0,
        },
      });
    }
    
    return corsResponse({
      analytics: {
        joinedCount: analytics.joined_count,
        answerRate: analytics.answer_rate,
        voteRate: analytics.vote_rate,
        duration: analytics.duration,
      },
    });
  }

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleGetAnalytics));
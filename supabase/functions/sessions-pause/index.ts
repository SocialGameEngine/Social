// Pause/Resume session timer
import { createHandler, requireString, corsResponse, getSession, AppError } from '../_shared/utils.ts';
import type { Session } from '../_shared/types.ts';

async function handlePauseSession(req: Request, uid: string, supabase: any): Promise<Response> {
  const { sessionId, pause } = await req.json();

  requireString(sessionId, 'sessionId');

  // Get session
  const session = await getSession(supabase, sessionId);

  // Verify host
  if (session.host_uid !== uid) {
    throw new AppError(403, 'Only the host can pause the game', 'permission-denied');
  }

  const now = new Date().toISOString();
  let endsAt = session.ends_at;
  let pausedAt = session.paused_at;
  let remainingMsAtPause = session.total_paused_ms || 0; // Rename: this will store remaining time when pause

  // Get the correct timer duration based on current phase
  let timerDuration = session.settings?.answerSecs || 90;
  if (session.status === 'vote') {
    timerDuration = session.settings?.voteSecs || 90;
  } else if (session.status === 'results') {
    timerDuration = session.settings?.resultsSecs || 12;
  }

  if (pause) {
    // Pausing: calculate and store remaining time at pause
    if (session.ends_at && !session.paused_at) {
      const endTime = new Date(session.ends_at).getTime();
      remainingMsAtPause = Math.max(0, endTime - Date.now());
    }
    pausedAt = now;
    endsAt = null; // Clear ends_at when paused
  } else {
    // Resuming: use stored remaining time
    if (remainingMsAtPause > 0) {
      endsAt = new Date(Date.now() + remainingMsAtPause).toISOString();
      remainingMsAtPause = 0; // Reset after use
    } else {
      // Fallback: use full timer duration
      endsAt = new Date(Date.now() + timerDuration * 1000).toISOString();
    }
    pausedAt = null;
  }

  // Update session using atomic stored procedure
  // This ensures all fields update in a single transaction
  // preventing intermediate states from being sent to real-time subscriptions

  const { data: updatedSession, error: updateError } = await supabase
    .rpc('pause_session_atomic', {
      p_session_id: sessionId,
      p_pause: pause,
      p_paused_at: pausedAt,
      p_ends_at: endsAt,
      p_total_paused_ms: remainingMsAtPause,
    })
    .single();

  if (updateError) {
    throw updateError;
  }

  return corsResponse({ session: updatedSession as Session });
}

Deno.serve(createHandler(handlePauseSession));
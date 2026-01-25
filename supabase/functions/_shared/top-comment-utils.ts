// Top-comment specific shared utilities with correct table names
import { AppError } from './utils.ts';

export async function getTopCommentSession(supabase: any, sessionId: string) {
  const { data: session, error } = await supabase
    .from('top_comment_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !session) {
    throw new AppError(404, 'Session not found', 'not-found');
  }

  return session;
}

export async function getActiveTopCommentPlayers(
  supabase: any,
  sessionId: string,
): Promise<string[]> {
  const { data: players, error: playersError } = await supabase
    .from('top_comment_players')
    .select('id')
    .eq('session_id', sessionId)
    .not('user_id', 'is', null);

  if (playersError) {
    throw playersError;
  }

  return (players ?? []).map((p: { id: string }) => p.id);
}

export async function validateTopCommentSessionPhase(session: any, requiredPhase: string) {
  if (session.status !== requiredPhase) {
    throw new AppError(400, `Session must be in ${requiredPhase} phase`, 'failed-precondition');
  }
}
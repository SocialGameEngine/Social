import type { Session } from '../../../shared/types';

/**
 * Phase state machine that drives display copy / CTA wording across the room.
 * Originally lived on the legacy PhaseController; kept after Wave R7 deletion
 * because a handful of Sociale components (button skin, display copy helpers)
 * still mirror this vocabulary.
 */
export type SessionDisplayState =
  | 'idle'
  | 'forming'
  | 'waiting_on_host'
  | 'countdown'
  | 'joined'
  | 'answer'
  | 'answered'
  | 'vote'
  | 'voted'
  | 'reveal'
  | 'results'
  | 'ended';

export function getIsMainEventMode(session: Session | null): boolean {
  if (!session) return false;
  const status = session.status;
  return status === 'lobby' || status === 'answer' || status === 'vote' || status === 'results';
}

/** Room main column highlight when the canonical game is a Sociale (mirrors session "live" phases). */
export function getIsMainEventModeFromSociale(
  sociale: { status: string } | null | undefined,
): boolean {
  if (!sociale) return false;
  const s = sociale.status;
  return s === 'draft' || s === 'lobby' || s === 'active' || s === 'paused';
}

import type { GamePhase } from '../types';
import type { Sociale } from '../../../domain/types/sociale.types';
import type { ActiveSocialeRoundStateRow } from '../hooks/useActiveSocialeRoundState';

/**
 * Maps Sociale + DB round state to the same coarse phases used by Session /room UI.
 */
export function deriveSocialeRoomGamePhase(
  sociale: Sociale | null | undefined,
  activeRoundState: ActiveSocialeRoundStateRow | null | undefined
): GamePhase {
  if (!sociale) return 'lobby';

  const s = sociale.status;
  if (s === 'draft' || s === 'lobby') return 'lobby';
  if (s === 'completed' || s === 'cancelled') return 'ended';

  if (s === 'active' || s === 'paused') {
    const raw =
      activeRoundState?.phase ??
      (sociale.runtimeState as { currentPhase?: string } | undefined)?.currentPhase ??
      sociale.currentPhase ??
      'answer';
    const p = String(raw).toLowerCase();
    if (p === 'setup' || p === 'answer') return 'answer';
    if (p === 'vote') return 'vote';
    if (p === 'reveal') return 'reveal';
    if (p === 'results' || p === 'discussion') return 'results';
    if (p === 'break') return 'break';
    return 'answer';
  }

  return 'lobby';
}

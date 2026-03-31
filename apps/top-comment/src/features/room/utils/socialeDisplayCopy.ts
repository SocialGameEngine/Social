import type { SessionDisplayState } from '../components/PhaseController';
import { getSessionDisplayCopy } from './sessionDisplayCopy';

/**
 * Room /player/ UI copy — same structure as sessions, "GAME" → "SOCIALE".
 */
export function getSocialeDisplayCopy(
  state: SessionDisplayState,
  ctx: Parameters<typeof getSessionDisplayCopy>[1] = {}
) {
  const base = getSessionDisplayCopy(state, ctx);
  const swap = (s: string) =>
    s.replace(/\bGAME\b/g, 'SOCIALE').replace(/\bgame\b/g, 'Sociale');
  return {
    ...base,
    headlineText: swap(base.headlineText),
    supportText: swap(base.supportText),
    statusBadgeText: swap(base.statusBadgeText),
    joinedCountText: base.joinedCountText ? swap(base.joinedCountText) : base.joinedCountText,
  };
}

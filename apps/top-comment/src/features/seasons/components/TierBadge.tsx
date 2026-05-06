// Small inline badge showing a player's seasonal tier.
// Used in leaderboards and profile cards.

import { getTierColor, getTierEmoji } from '../../../domain/seasons/seasonalLeagues';
import type { SeasonStanding } from '../../../domain/seasons/seasonalLeagues';

interface TierBadgeProps {
  tier: SeasonStanding['tier'];
  size?: 'sm' | 'md';
}

export function TierBadge({ tier, size = 'sm' }: TierBadgeProps) {
  const color = getTierColor(tier);
  const emoji = getTierEmoji(tier);

  const textSize = size === 'sm' ? 'text-[11px]' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold ${textSize} ${padding}`}
      style={{
        color,
        backgroundColor: `${color}20`,
        border: `1px solid ${color}50`,
      }}
    >
      <span>{emoji}</span>
      <span>{tier}</span>
    </span>
  );
}

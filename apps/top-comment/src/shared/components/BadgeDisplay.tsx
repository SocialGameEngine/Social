import { RARITY_COLORS, getBadgeById } from "../data/badges";
import type { PlayerBadge } from "../../services/badgeService";

interface BadgeDisplayProps {
  badges: PlayerBadge[];
  maxShow?: number;
}

export function BadgeDisplay({ badges, maxShow = 3 }: BadgeDisplayProps) {
  if (badges.length === 0) return null;

  const shown = badges.slice(0, maxShow);
  const overflow = badges.length - maxShow;

  return (
    <div className="flex items-center gap-0.5">
      {shown.map((pb) => {
        const def = getBadgeById(pb.badgeId);
        if (!def) return null;
        return (
          <span
            key={pb.id}
            className={`inline-flex items-center justify-center w-5 h-5 rounded-full border text-xs ${RARITY_COLORS[def.rarity]} cursor-default`}
            title={`${def.name}: ${def.description}`}
          >
            {def.emoji}
          </span>
        );
      })}
      {overflow > 0 && (
        <span className="text-[9px] text-slate-400 ml-0.5">+{overflow}</span>
      )}
    </div>
  );
}

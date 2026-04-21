import { BADGE_DEFINITIONS, RARITY_COLORS, RARITY_BG } from "../data/badges";
import type { PlayerBadge } from "../../services/badgeService";

interface BadgeCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  myBadges: PlayerBadge[];
}

const CATEGORIES = ['gameplay', 'social', 'loyalty', 'special'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  gameplay: 'Gameplay',
  social: 'Social',
  loyalty: 'Loyalty',
  special: 'Special',
};

export function BadgeCollectionModal({ isOpen, onClose, myBadges }: BadgeCollectionModalProps) {
  if (!isOpen) return null;

  const earnedIds = new Set(myBadges.map((b) => b.badgeId));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <div>
            <h2 className="text-lg font-bold text-pink-400">Badge Collection</h2>
            <p className="text-xs text-slate-400">{earnedIds.size} / {BADGE_DEFINITIONS.length} earned</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Badge Grid */}
        <div className="overflow-y-auto p-5 space-y-5 max-h-modal-scroll">
          {CATEGORIES.map((cat) => {
            const badges = BADGE_DEFINITIONS.filter((b) => b.category === cat);
            return (
              <div key={cat}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
                  {CATEGORY_LABELS[cat]}
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {badges.map((badge) => {
                    const earned = earnedIds.has(badge.id);
                    return (
                      <div
                        key={badge.id}
                        className={`rounded-xl border-2 p-3 transition-all ${
                          earned
                            ? `${RARITY_COLORS[badge.rarity]} ${RARITY_BG[badge.rarity]}`
                            : 'border-slate-700/50 bg-slate-800/30 opacity-50'
                        }`}
                      >
                        <div className="text-2xl mb-1">{earned ? badge.emoji : '🔒'}</div>
                        <p className={`text-xs font-bold ${earned ? 'text-white' : 'text-slate-500'}`}>
                          {badge.name}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{badge.description}</p>
                        <p className={`text-[9px] font-semibold uppercase mt-1 ${
                          badge.rarity === 'legendary' ? 'text-yellow-400' :
                          badge.rarity === 'epic' ? 'text-purple-400' :
                          badge.rarity === 'rare' ? 'text-blue-400' :
                          'text-slate-500'
                        }`}>
                          {badge.rarity}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Single chest upgrade card component.
// Shows rarity color, emoji, name, description, and a select button.

import { getRarityColor, getRarityLabel } from '../../../domain/sociale/chestUpgrades';
import type { ChestUpgrade } from '../../../domain/sociale/chestUpgrades';

interface UpgradeCardProps {
  upgrade: ChestUpgrade;
  selected: boolean;
  onSelect: (upgrade: ChestUpgrade) => void;
  disabled?: boolean;
}

export function UpgradeCard({ upgrade, selected, onSelect, disabled = false }: UpgradeCardProps) {
  const rarityColor = getRarityColor(upgrade.rarity);
  const rarityLabel = getRarityLabel(upgrade.rarity);

  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(upgrade)}
      disabled={disabled}
      className={`
        relative w-full rounded-2xl border-2 p-5 text-left transition-all duration-200
        ${selected
          ? 'bg-white/15 scale-[1.02] shadow-lg'
          : 'bg-white/5 hover:bg-white/10'
        }
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
      `}
      style={{
        borderColor: selected ? rarityColor : `${rarityColor}60`,
        boxShadow: selected ? `0 0 20px ${rarityColor}40` : undefined,
      }}
    >
      {/* Rarity badge */}
      <span
        className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
        style={{ color: rarityColor, backgroundColor: `${rarityColor}20` }}
      >
        {rarityLabel}
      </span>

      {/* Icon */}
      <div className="text-4xl mb-3">{upgrade.emoji}</div>

      {/* Name */}
      <div
        className="text-base font-black mb-1"
        style={{ color: rarityColor }}
      >
        {upgrade.name}
      </div>

      {/* Description */}
      <div className="text-sm text-white/70 leading-snug">
        {upgrade.description}
      </div>

      {/* Selected indicator */}
      {selected && (
        <div
          className="absolute bottom-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-black"
          style={{ backgroundColor: rarityColor }}
        >
          ✓
        </div>
      )}
    </button>
  );
}

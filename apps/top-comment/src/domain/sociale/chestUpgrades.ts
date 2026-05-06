// =============================================================================
// CHEST UPGRADES SYSTEM (Roguelike)
// =============================================================================
// Intermediate rounds every N rounds where all players select upgrades
// that provide buffs for upcoming rounds.

export interface ChestUpgrade {
  id: string;
  name: string;
  description: string;
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  effect: UpgradeEffect;
}

export interface UpgradeEffect {
  type: 
    | 'time_bonus'      // Extra seconds to answer
    | 'point_multiplier' // Multiply points earned
    | 'shield'          // Protect from one wrong answer
    | 'double_or_nothing' // 2x points if correct, 0 if wrong
    | 'steal_points'    // Steal points from random player
    | 'vote_magnet'     // Extra votes on your answers
    | 'skip_round'      // Skip one round (keep points)
    | 'reveal_answer'   // See correct answer before submitting
    | 'second_chance'   // Can change answer once
    | 'bonus_points';   // Flat bonus points
  
  value?: number;       // Numeric value for the effect
  duration?: number;    // How many rounds it lasts (0 = instant)
  appliesTo?: 'next' | 'all_remaining' | 'instant';
}

export interface ChestUpgradePool {
  common: ChestUpgrade[];
  rare: ChestUpgrade[];
  epic: ChestUpgrade[];
  legendary: ChestUpgrade[];
}

/**
 * Default upgrade pool
 */
export const DEFAULT_UPGRADE_POOL: ChestUpgradePool = {
  common: [
    {
      id: 'time_5',
      name: '+5 Seconds',
      description: 'Extra 5 seconds on next round',
      emoji: '⏱️',
      rarity: 'common',
      effect: { type: 'time_bonus', value: 5, duration: 1, appliesTo: 'next' },
    },
    {
      id: 'points_25',
      name: 'Quick Cash',
      description: 'Instant 25 points',
      emoji: '💰',
      rarity: 'common',
      effect: { type: 'bonus_points', value: 25, duration: 0, appliesTo: 'instant' },
    },
    {
      id: 'vote_boost',
      name: 'Charisma',
      description: '+1 vote appeal next round',
      emoji: '✨',
      rarity: 'common',
      effect: { type: 'vote_magnet', value: 1, duration: 1, appliesTo: 'next' },
    },
  ],
  rare: [
    {
      id: 'multiplier_1.5',
      name: 'Point Boost',
      description: '1.5x points for next 2 rounds',
      emoji: '📈',
      rarity: 'rare',
      effect: { type: 'point_multiplier', value: 1.5, duration: 2, appliesTo: 'next' },
    },
    {
      id: 'shield',
      name: 'Safety Net',
      description: 'Protect from one wrong answer',
      emoji: '🛡️',
      rarity: 'rare',
      effect: { type: 'shield', value: 1, duration: 3, appliesTo: 'next' },
    },
    {
      id: 'time_10',
      name: 'Time Master',
      description: '+10 seconds for next 2 rounds',
      emoji: '⏰',
      rarity: 'rare',
      effect: { type: 'time_bonus', value: 10, duration: 2, appliesTo: 'next' },
    },
  ],
  epic: [
    {
      id: 'double_nothing',
      name: 'High Roller',
      description: 'Next round: 2x points or nothing',
      emoji: '🎲',
      rarity: 'epic',
      effect: { type: 'double_or_nothing', value: 2, duration: 1, appliesTo: 'next' },
    },
    {
      id: 'second_chance',
      name: 'Mulligan',
      description: 'Change your answer once next round',
      emoji: '🔄',
      rarity: 'epic',
      effect: { type: 'second_chance', value: 1, duration: 1, appliesTo: 'next' },
    },
    {
      id: 'steal_50',
      name: 'Pickpocket',
      description: 'Steal 50 points from random player',
      emoji: '🦹',
      rarity: 'epic',
      effect: { type: 'steal_points', value: 50, duration: 0, appliesTo: 'instant' },
    },
  ],
  legendary: [
    {
      id: 'reveal',
      name: 'Oracle',
      description: 'See correct answer before submitting',
      emoji: '🔮',
      rarity: 'legendary',
      effect: { type: 'reveal_answer', value: 1, duration: 1, appliesTo: 'next' },
    },
    {
      id: 'multiplier_2',
      name: 'Mega Boost',
      description: '2x points for rest of game',
      emoji: '🚀',
      rarity: 'legendary',
      effect: { type: 'point_multiplier', value: 2, duration: 999, appliesTo: 'all_remaining' },
    },
    {
      id: 'skip',
      name: 'Ghost Mode',
      description: 'Skip next round, keep your points',
      emoji: '👻',
      rarity: 'legendary',
      effect: { type: 'skip_round', value: 1, duration: 1, appliesTo: 'next' },
    },
  ],
};

/**
 * Rarity weights for random selection
 */
const RARITY_WEIGHTS = {
  common: 60,
  rare: 30,
  epic: 8,
  legendary: 2,
};

/**
 * Generate random upgrade options for a player
 */
export function generateUpgradeOptions(
  pool: ChestUpgradePool = DEFAULT_UPGRADE_POOL,
  count: number = 3
): ChestUpgrade[] {
  const options: ChestUpgrade[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    const rarity = selectRarity();
    const availableUpgrades = pool[rarity].filter(u => !usedIds.has(u.id));
    
    if (availableUpgrades.length === 0) {
      // Fallback to common if no upgrades available
      const commonUpgrades = pool.common.filter(u => !usedIds.has(u.id));
      if (commonUpgrades.length > 0) {
        const upgrade = commonUpgrades[Math.floor(Math.random() * commonUpgrades.length)];
        options.push(upgrade);
        usedIds.add(upgrade.id);
      }
    } else {
      const upgrade = availableUpgrades[Math.floor(Math.random() * availableUpgrades.length)];
      options.push(upgrade);
      usedIds.add(upgrade.id);
    }
  }

  return options;
}

/**
 * Select rarity based on weights
 */
function selectRarity(): 'common' | 'rare' | 'epic' | 'legendary' {
  const total = Object.values(RARITY_WEIGHTS).reduce((sum, w) => sum + w, 0);
  const roll = Math.random() * total;
  
  let cumulative = 0;
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    cumulative += weight;
    if (roll < cumulative) {
      return rarity as 'common' | 'rare' | 'epic' | 'legendary';
    }
  }
  
  return 'common';
}

/**
 * Check if it's time for a chest round
 */
export function isChestRound(
  currentRoundIndex: number,
  chestEveryNRounds: number = 5
): boolean {
  if (chestEveryNRounds <= 0) return false;
  if (currentRoundIndex === 0) return false; // Not on first round
  return currentRoundIndex % chestEveryNRounds === 0;
}

/**
 * Apply upgrade effect to a value
 */
export function applyUpgradeEffect(
  baseValue: number,
  effect: UpgradeEffect,
  effectType: UpgradeEffect['type']
): number {
  if (effect.type !== effectType) return baseValue;
  
  switch (effect.type) {
    case 'time_bonus':
      return baseValue + (effect.value || 0);
    case 'point_multiplier':
      return baseValue * (effect.value || 1);
    case 'bonus_points':
      return baseValue + (effect.value || 0);
    default:
      return baseValue;
  }
}

/**
 * Get rarity color for UI
 */
export function getRarityColor(rarity: ChestUpgrade['rarity']): string {
  switch (rarity) {
    case 'common': return '#9CA3AF'; // Gray
    case 'rare': return '#3B82F6'; // Blue
    case 'epic': return '#A855F7'; // Purple
    case 'legendary': return '#F59E0B'; // Orange/Gold
    default: return '#9CA3AF';
  }
}

/**
 * Get rarity label
 */
export function getRarityLabel(rarity: ChestUpgrade['rarity']): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

/**
 * Track active upgrades for a player
 */
export interface ActiveUpgrade {
  upgrade: ChestUpgrade;
  roundsRemaining: number;
  appliedAt: number; // Round index when applied
}

/**
 * Manage active upgrades
 */
export class UpgradeManager {
  private activeUpgrades: Map<string, ActiveUpgrade[]> = new Map();

  /**
   * Add upgrade for a player
   */
  addUpgrade(socialiteId: string, upgrade: ChestUpgrade, currentRound: number): void {
    if (!this.activeUpgrades.has(socialiteId)) {
      this.activeUpgrades.set(socialiteId, []);
    }

    const active: ActiveUpgrade = {
      upgrade,
      roundsRemaining: upgrade.effect.duration || 0,
      appliedAt: currentRound,
    };

    this.activeUpgrades.get(socialiteId)!.push(active);
  }

  /**
   * Get active upgrades for a player
   */
  getActiveUpgrades(socialiteId: string): ActiveUpgrade[] {
    return this.activeUpgrades.get(socialiteId) || [];
  }

  /**
   * Tick down upgrade durations after a round
   */
  advanceRound(socialiteId: string): void {
    const upgrades = this.activeUpgrades.get(socialiteId);
    if (!upgrades) return;

    // Decrement remaining rounds and filter expired
    const active = upgrades
      .map(u => ({ ...u, roundsRemaining: u.roundsRemaining - 1 }))
      .filter(u => u.roundsRemaining > 0);

    if (active.length > 0) {
      this.activeUpgrades.set(socialiteId, active);
    } else {
      this.activeUpgrades.delete(socialiteId);
    }
  }

  /**
   * Check if player has specific upgrade type active
   */
  hasUpgrade(socialiteId: string, type: UpgradeEffect['type']): boolean {
    const upgrades = this.getActiveUpgrades(socialiteId);
    return upgrades.some(u => u.upgrade.effect.type === type);
  }

  /**
   * Get total effect value for a type
   */
  getTotalEffect(socialiteId: string, type: UpgradeEffect['type']): number {
    const upgrades = this.getActiveUpgrades(socialiteId);
    return upgrades
      .filter(u => u.upgrade.effect.type === type)
      .reduce((sum, u) => sum + (u.upgrade.effect.value || 0), 0);
  }
}

// =============================================================================
// SEASONAL LEAGUES SYSTEM
// =============================================================================
// Monthly competitive leagues with tier-based rankings and rewards.
// Single global league per calendar month.

export interface Season {
  id: string;
  name: string;
  startsAt: Date;
  endsAt: Date;
  status: 'upcoming' | 'active' | 'completed';
  createdAt: Date;
}

export interface SeasonStanding {
  id: string;
  seasonId: string;
  membershipId: string;
  totalScore: number;
  gamesPlayed: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  finalRank: number | null;
}

export interface TierThresholds {
  diamond: number; // Top X%
  gold: number;
  silver: number;
  bronze: number; // Everyone else
}

export const DEFAULT_TIER_THRESHOLDS: TierThresholds = {
  diamond: 5,   // Top 5%
  gold: 10,     // Top 10%
  silver: 25,   // Top 25%
  bronze: 100,  // Everyone else
};

/**
 * Generate season name from date
 */
export function generateSeasonName(date: Date): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  
  return `${month} ${year}`;
}

/**
 * Get season date range for a given month
 */
export function getSeasonDateRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Get current season date range
 */
export function getCurrentSeasonRange(): { start: Date; end: Date } {
  const now = new Date();
  return getSeasonDateRange(now.getFullYear(), now.getMonth());
}

/**
 * Check if a date is within a season
 */
export function isInSeason(date: Date, season: Season): boolean {
  return date >= season.startsAt && date <= season.endsAt;
}

/**
 * Calculate tier based on rank and total players
 */
export function calculateTier(
  rank: number,
  totalPlayers: number,
  thresholds: TierThresholds = DEFAULT_TIER_THRESHOLDS
): 'Bronze' | 'Silver' | 'Gold' | 'Diamond' {
  const percentile = (rank / totalPlayers) * 100;
  
  if (percentile <= thresholds.diamond) return 'Diamond';
  if (percentile <= thresholds.gold) return 'Gold';
  if (percentile <= thresholds.silver) return 'Silver';
  return 'Bronze';
}

/**
 * Get tier color for UI
 */
export function getTierColor(tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond'): string {
  switch (tier) {
    case 'Diamond': return '#60A5FA'; // Blue
    case 'Gold': return '#FBBF24'; // Yellow/Gold
    case 'Silver': return '#D1D5DB'; // Gray/Silver
    case 'Bronze': return '#CD7F32'; // Bronze
    default: return '#9CA3AF';
  }
}

/**
 * Get tier emoji
 */
export function getTierEmoji(tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond'): string {
  switch (tier) {
    case 'Diamond': return '💎';
    case 'Gold': return '🥇';
    case 'Silver': return '🥈';
    case 'Bronze': return '🥉';
    default: return '🏅';
  }
}

/**
 * Get tier label
 */
export function getTierLabel(tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond'): string {
  return tier;
}

/**
 * Calculate season progress (0-1)
 */
export function getSeasonProgress(season: Season): number {
  const now = new Date();
  const total = season.endsAt.getTime() - season.startsAt.getTime();
  const elapsed = now.getTime() - season.startsAt.getTime();
  
  return Math.max(0, Math.min(1, elapsed / total));
}

/**
 * Get days remaining in season
 */
export function getDaysRemaining(season: Season): number {
  const now = new Date();
  const diff = season.endsAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Format season date range
 */
export function formatSeasonRange(season: Season): string {
  const start = season.startsAt.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  const end = season.endsAt.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  
  return `${start} - ${end}`;
}

/**
 * Generate leaderboard from standings
 */
export function generateLeaderboard(
  standings: SeasonStanding[],
  thresholds: TierThresholds = DEFAULT_TIER_THRESHOLDS
): SeasonStanding[] {
  // Sort by total score (descending)
  const sorted = [...standings].sort((a, b) => b.totalScore - a.totalScore);
  
  // Assign ranks and tiers
  return sorted.map((standing, index) => {
    const rank = index + 1;
    const tier = calculateTier(rank, sorted.length, thresholds);
    
    return {
      ...standing,
      finalRank: rank,
      tier,
    };
  });
}

/**
 * Get rank change from previous season
 */
export function getRankChange(
  currentRank: number,
  previousRank: number | null
): { change: number; direction: 'up' | 'down' | 'new' | 'same' } {
  if (previousRank === null) {
    return { change: 0, direction: 'new' };
  }
  
  const change = previousRank - currentRank;
  
  if (change > 0) {
    return { change, direction: 'up' };
  } else if (change < 0) {
    return { change: Math.abs(change), direction: 'down' };
  } else {
    return { change: 0, direction: 'same' };
  }
}

/**
 * Calculate season rewards based on tier
 */
export function calculateSeasonRewards(tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond'): {
  badge: string;
  title: string;
  bonusPoints: number;
} {
  switch (tier) {
    case 'Diamond':
      return {
        badge: '💎 Diamond',
        title: 'Diamond League Champion',
        bonusPoints: 1000,
      };
    case 'Gold':
      return {
        badge: '🥇 Gold',
        title: 'Gold League Master',
        bonusPoints: 500,
      };
    case 'Silver':
      return {
        badge: '🥈 Silver',
        title: 'Silver League Competitor',
        bonusPoints: 250,
      };
    case 'Bronze':
      return {
        badge: '🥉 Bronze',
        title: 'Bronze League Participant',
        bonusPoints: 100,
      };
  }
}

/**
 * Check if season should be auto-created
 */
export function shouldCreateSeason(existingSeasons: Season[]): boolean {
  const now = new Date();
  const currentRange = getCurrentSeasonRange();
  
  // Check if there's already a season for current month
  const hasCurrentSeason = existingSeasons.some(season => 
    isInSeason(now, season)
  );
  
  return !hasCurrentSeason;
}

/**
 * Create new season for current month
 */
export function createSeasonForCurrentMonth(): Omit<Season, 'id' | 'createdAt'> {
  const range = getCurrentSeasonRange();
  
  return {
    name: generateSeasonName(range.start),
    startsAt: range.start,
    endsAt: range.end,
    status: 'active',
  };
}

/**
 * Update season status based on dates
 */
export function updateSeasonStatus(season: Season): Season['status'] {
  const now = new Date();
  
  if (now < season.startsAt) {
    return 'upcoming';
  } else if (now > season.endsAt) {
    return 'completed';
  } else {
    return 'active';
  }
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'gameplay' | 'social' | 'loyalty' | 'special';
  criteria: {
    type: 'count' | 'streak' | 'milestone';
    metric: string;
    value: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Gameplay
  { id: 'first_win', name: 'First Victory', description: 'Win your first round', emoji: '🏆', category: 'gameplay', criteria: { type: 'count', metric: 'wins', value: 1 }, rarity: 'common' },
  { id: 'win_streak_3', name: 'Hot Streak', description: 'Win 3 rounds in a row', emoji: '🔥', category: 'gameplay', criteria: { type: 'streak', metric: 'wins', value: 3 }, rarity: 'rare' },
  { id: 'top_scorer', name: 'Top Scorer', description: 'Accumulate 1000 total points', emoji: '⭐', category: 'gameplay', criteria: { type: 'milestone', metric: 'total_score', value: 1000 }, rarity: 'epic' },

  // Social
  { id: 'social_butterfly', name: 'Social Butterfly', description: 'Send 50 chat messages', emoji: '🦋', category: 'social', criteria: { type: 'count', metric: 'chat_messages', value: 50 }, rarity: 'common' },
  { id: 'challenger', name: 'Challenger', description: 'Send 10 challenges', emoji: '⚔️', category: 'social', criteria: { type: 'count', metric: 'challenges_sent', value: 10 }, rarity: 'rare' },
  { id: 'crowd_favorite', name: 'Crowd Favorite', description: 'Receive 100 reactions', emoji: '👏', category: 'social', criteria: { type: 'count', metric: 'reactions_received', value: 100 }, rarity: 'epic' },

  // Loyalty
  { id: 'regular', name: 'Regular', description: 'Play 5 sessions', emoji: '🍺', category: 'loyalty', criteria: { type: 'count', metric: 'sessions_played', value: 5 }, rarity: 'common' },
  { id: 'veteran', name: 'Veteran', description: 'Play 20 sessions', emoji: '🎖️', category: 'loyalty', criteria: { type: 'count', metric: 'sessions_played', value: 20 }, rarity: 'rare' },
  { id: 'legend', name: 'Legend', description: 'Play 50 sessions', emoji: '👑', category: 'loyalty', criteria: { type: 'count', metric: 'sessions_played', value: 50 }, rarity: 'legendary' },

  // Special
  { id: 'question_author', name: 'Question Author', description: 'Get a submitted question approved', emoji: '✍️', category: 'special', criteria: { type: 'count', metric: 'submissions_approved', value: 1 }, rarity: 'rare' },
  { id: 'fibbage_master', name: 'Fibbage Master', description: 'Fool 10 players in Headline Fibbage', emoji: '🎭', category: 'special', criteria: { type: 'count', metric: 'fibbage_fools', value: 10 }, rarity: 'epic' },
];

export const RARITY_COLORS: Record<string, string> = {
  common: 'border-slate-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-yellow-500',
};

export const RARITY_BG: Record<string, string> = {
  common: 'bg-slate-500/10',
  rare: 'bg-blue-500/10',
  epic: 'bg-purple-500/10',
  legendary: 'bg-yellow-500/10',
};

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((b) => b.id === id);
}

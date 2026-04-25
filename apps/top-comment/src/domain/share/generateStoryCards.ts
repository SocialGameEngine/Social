// =============================================================================
// WRAPPED STORY CARD GENERATION
// =============================================================================
// Generates 8-card sequence for wrapped-style recap, analyzing session data
// to create engaging story moments similar to Spotify Wrapped.

export interface SessionData {
  totalScore: number;
  roundsPlayed: number;
  correctAnswers: number;
  totalAnswers: number;
  longestStreak: number;
  fastestAnswerMs?: number;
  slowestAnswerMs?: number;
  rankPosition: number;
  previousRank?: number;
  totalPlayers: number;
  votesReceived: number;
  votesGiven: number;
  perfectRounds: number;
  
  // Round-by-round data
  roundScores: number[];
  roundAccuracy: boolean[];
  
  // Category breakdown
  categoryStats?: {
    category: string;
    correct: number;
    total: number;
    accuracy: number;
  }[];
  
  // Chest/upgrades (if applicable)
  upgradesTaken?: string[];
  
  // Venue info
  venueName?: string;
  sessionDate: Date;
}

export interface StoryCard {
  type: 'intro' | 'stat' | 'achievement' | 'finale';
  title: string;
  subtitle?: string;
  mainValue: string | number;
  secondaryValue?: string;
  emoji: string;
  gradient: {
    from: string;
    via?: string;
    to: string;
  };
  visualData?: {
    type: 'bar' | 'line' | 'dots' | 'arc';
    data: number[] | boolean[];
  };
}

/**
 * Generate 8-card wrapped story sequence
 */
export function generateStoryCards(data: SessionData): StoryCard[] {
  const cards: StoryCard[] = [];

  // Card 1: Intro
  cards.push(generateIntroCard(data));

  // Card 2: Biggest Round
  cards.push(generateBiggestRoundCard(data));

  // Card 3: Accuracy Stats
  cards.push(generateAccuracyCard(data));

  // Card 4: Fastest Answer
  cards.push(generateSpeedCard(data));

  // Card 5: Longest Streak
  cards.push(generateStreakCard(data));

  // Card 6: Category King
  cards.push(generateCategoryCard(data));

  // Card 7: Rank Arc
  cards.push(generateRankArcCard(data));

  // Card 8: Final Position
  cards.push(generateFinaleCard(data));

  return cards;
}

function generateIntroCard(data: SessionData): StoryCard {
  return {
    type: 'intro',
    title: 'Your Session Wrapped',
    subtitle: data.venueName || 'Social Game Engine',
    mainValue: data.roundsPlayed,
    secondaryValue: 'rounds played',
    emoji: '🎮',
    gradient: {
      from: 'purple-600',
      via: 'pink-500',
      to: 'orange-400',
    },
  };
}

function generateBiggestRoundCard(data: SessionData): StoryCard {
  const maxScore = Math.max(...data.roundScores);
  const maxRoundIndex = data.roundScores.indexOf(maxScore);
  
  return {
    type: 'stat',
    title: 'Biggest Round',
    subtitle: `Round ${maxRoundIndex + 1}`,
    mainValue: maxScore,
    secondaryValue: 'points',
    emoji: '💥',
    gradient: {
      from: 'orange-500',
      via: 'red-500',
      to: 'pink-600',
    },
    visualData: {
      type: 'bar',
      data: data.roundScores,
    },
  };
}

function generateAccuracyCard(data: SessionData): StoryCard {
  const accuracy = data.totalAnswers > 0 
    ? Math.round((data.correctAnswers / data.totalAnswers) * 100)
    : 0;

  return {
    type: 'stat',
    title: 'Accuracy',
    subtitle: `${data.correctAnswers} of ${data.totalAnswers} correct`,
    mainValue: `${accuracy}%`,
    emoji: accuracy >= 80 ? '🎯' : accuracy >= 60 ? '✨' : '🎲',
    gradient: {
      from: 'blue-500',
      via: 'cyan-400',
      to: 'teal-400',
    },
    visualData: {
      type: 'dots',
      data: data.roundAccuracy,
    },
  };
}

function generateSpeedCard(data: SessionData): StoryCard {
  if (!data.fastestAnswerMs) {
    return {
      type: 'stat',
      title: 'Speed',
      subtitle: 'No timed answers',
      mainValue: '—',
      emoji: '⏱️',
      gradient: {
        from: 'yellow-400',
        via: 'orange-400',
        to: 'red-500',
      },
    };
  }

  const seconds = (data.fastestAnswerMs / 1000).toFixed(1);
  
  return {
    type: 'stat',
    title: 'Fastest Answer',
    subtitle: 'Lightning reflexes',
    mainValue: `${seconds}s`,
    emoji: '⚡',
    gradient: {
      from: 'yellow-400',
      via: 'orange-400',
      to: 'red-500',
    },
  };
}

function generateStreakCard(data: SessionData): StoryCard {
  return {
    type: 'achievement',
    title: 'Longest Streak',
    subtitle: data.longestStreak >= 5 ? 'On fire!' : 'Keep it going',
    mainValue: data.longestStreak,
    secondaryValue: 'in a row',
    emoji: data.longestStreak >= 5 ? '🔥' : '📈',
    gradient: {
      from: 'red-500',
      via: 'orange-500',
      to: 'yellow-400',
    },
  };
}

function generateCategoryCard(data: SessionData): StoryCard {
  if (!data.categoryStats || data.categoryStats.length === 0) {
    return {
      type: 'stat',
      title: 'Categories',
      subtitle: 'No category data',
      mainValue: '—',
      emoji: '📚',
      gradient: {
        from: 'green-500',
        via: 'emerald-500',
        to: 'teal-500',
      },
    };
  }

  // Find best category
  const bestCategory = data.categoryStats.reduce((best, cat) => 
    cat.accuracy > best.accuracy ? cat : best
  );

  return {
    type: 'achievement',
    title: 'Category King',
    subtitle: bestCategory.category,
    mainValue: `${Math.round(bestCategory.accuracy * 100)}%`,
    secondaryValue: `${bestCategory.correct}/${bestCategory.total} correct`,
    emoji: '👑',
    gradient: {
      from: 'green-500',
      via: 'emerald-500',
      to: 'teal-500',
    },
  };
}

function generateRankArcCard(data: SessionData): StoryCard {
  const rankChange = data.previousRank 
    ? data.previousRank - data.rankPosition 
    : 0;

  let title = 'Rank Journey';
  let subtitle = '';
  let emoji = '📊';

  if (rankChange > 0) {
    title = 'Climbed the Ranks';
    subtitle = `+${rankChange} positions`;
    emoji = '🚀';
  } else if (rankChange < 0) {
    title = 'Tough Competition';
    subtitle = `${rankChange} positions`;
    emoji = '💪';
  } else {
    subtitle = 'Held your ground';
  }

  return {
    type: 'stat',
    title,
    subtitle,
    mainValue: `#${data.rankPosition}`,
    secondaryValue: `of ${data.totalPlayers}`,
    emoji,
    gradient: {
      from: 'indigo-500',
      via: 'purple-500',
      to: 'pink-500',
    },
    visualData: {
      type: 'arc',
      data: [data.previousRank || data.rankPosition, data.rankPosition],
    },
  };
}

function generateFinaleCard(data: SessionData): StoryCard {
  let title = 'Final Score';
  let emoji = '🏆';

  if (data.rankPosition === 1) {
    title = 'Champion!';
    emoji = '👑';
  } else if (data.rankPosition <= 3) {
    title = 'Podium Finish!';
    emoji = '🥇';
  } else if (data.rankPosition <= data.totalPlayers / 2) {
    title = 'Top Half!';
    emoji = '⭐';
  }

  return {
    type: 'finale',
    title,
    subtitle: `Ranked #${data.rankPosition} of ${data.totalPlayers}`,
    mainValue: data.totalScore.toLocaleString(),
    secondaryValue: 'points',
    emoji,
    gradient: {
      from: 'purple-600',
      via: 'pink-500',
      to: 'orange-400',
    },
  };
}

/**
 * Calculate session highlights for quick stats
 */
export function calculateSessionHighlights(data: SessionData) {
  const accuracy = data.totalAnswers > 0 
    ? (data.correctAnswers / data.totalAnswers) * 100 
    : 0;

  return {
    totalScore: data.totalScore,
    roundsPlayed: data.roundsPlayed,
    accuracy: Math.round(accuracy),
    longestStreak: data.longestStreak,
    rankPosition: data.rankPosition,
    totalPlayers: data.totalPlayers,
    perfectRounds: data.perfectRounds,
    votesReceived: data.votesReceived,
  };
}

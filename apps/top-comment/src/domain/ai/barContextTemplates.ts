// =============================================================================
// BAR CONTEXT TEMPLATES
// =============================================================================
// Template-based bar context generation for V1 (no AI costs)
// Provides atmospheric context based on game state and venue dynamics

export interface BarContextInput {
  venueName?: string;
  totalPlayers: number;
  currentRound: number;
  totalRounds: number;
  topScore: number;
  averageScore: number;
  closestMargin: number;
  longestStreak: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: 'weekday' | 'weekend';
}

export interface BarContext {
  atmosphere: string;
  crowdEnergy: string;
  gameMomentum: string;
  playerDynamics: string;
}

/**
 * Generate bar context from templates (V1 - no AI)
 */
export function generateBarContextFromTemplates(input: BarContextInput): BarContext {
  return {
    atmosphere: selectAtmosphere(input),
    crowdEnergy: selectCrowdEnergy(input),
    gameMomentum: selectGameMomentum(input),
    playerDynamics: selectPlayerDynamics(input),
  };
}

function selectAtmosphere(input: BarContextInput): string {
  const { timeOfDay, dayOfWeek, venueName } = input;
  
  const templates = {
    morning: {
      weekday: [
        `Early birds at ${venueName || 'the venue'} bringing their A-game`,
        'Coffee and competition - the perfect morning blend',
        'Starting the day with some friendly rivalry',
      ],
      weekend: [
        `Brunch crowd at ${venueName || 'the venue'} getting competitive`,
        'Weekend warriors warming up with trivia',
        'Mimosas and mind games - a perfect Saturday',
      ],
    },
    afternoon: {
      weekday: [
        `Lunch break showdown at ${venueName || 'the venue'}`,
        'Midday mental workout in full swing',
        'Afternoon energy building up',
      ],
      weekend: [
        `Weekend vibes at ${venueName || 'the venue'}`,
        'Afternoon crowd bringing the heat',
        'Perfect weather for some friendly competition',
      ],
    },
    evening: {
      weekday: [
        `After-work crowd at ${venueName || 'the venue'} letting loose`,
        'Happy hour just got competitive',
        'Evening energy ramping up',
      ],
      weekend: [
        `Prime time at ${venueName || 'the venue'}`,
        'Weekend night energy at peak levels',
        'The place is buzzing with excitement',
      ],
    },
    night: {
      weekday: [
        `Late night warriors at ${venueName || 'the venue'}`,
        'Night owls showing off their knowledge',
        'The energy is electric tonight',
      ],
      weekend: [
        `Saturday night fever at ${venueName || 'the venue'}`,
        'The crowd is absolutely electric',
        'Peak weekend energy in full effect',
      ],
    },
  };

  const options = templates[timeOfDay][dayOfWeek];
  return options[Math.floor(Math.random() * options.length)];
}

function selectCrowdEnergy(input: BarContextInput): string {
  const { totalPlayers, currentRound, totalRounds } = input;
  
  const progressRatio = currentRound / totalRounds;
  
  if (totalPlayers >= 20) {
    if (progressRatio < 0.3) {
      return 'Massive crowd settling in - the energy is building';
    } else if (progressRatio < 0.7) {
      return 'The packed house is absolutely roaring';
    } else {
      return 'Everyone on the edge of their seats for the finale';
    }
  } else if (totalPlayers >= 10) {
    if (progressRatio < 0.3) {
      return 'Solid crowd getting warmed up';
    } else if (progressRatio < 0.7) {
      return 'The room is buzzing with competitive energy';
    } else {
      return 'Tension mounting as we approach the finish';
    }
  } else if (totalPlayers >= 5) {
    if (progressRatio < 0.3) {
      return 'Intimate group bringing focused energy';
    } else if (progressRatio < 0.7) {
      return 'Small but mighty - the competition is fierce';
    } else {
      return 'Every point matters in this tight group';
    }
  } else {
    return 'Exclusive showdown - quality over quantity';
  }
}

function selectGameMomentum(input: BarContextInput): string {
  const { currentRound, totalRounds, closestMargin, longestStreak } = input;
  
  const progressRatio = currentRound / totalRounds;
  
  if (longestStreak >= 5) {
    return `Someone's on a ${longestStreak}-round hot streak!`;
  }
  
  if (closestMargin <= 50) {
    return 'Neck and neck - this could go either way';
  } else if (closestMargin <= 100) {
    return 'Close race developing at the top';
  }
  
  if (progressRatio < 0.3) {
    return 'Early rounds - anyone can take this';
  } else if (progressRatio < 0.5) {
    return 'Midgame momentum building';
  } else if (progressRatio < 0.8) {
    return 'Crunch time - every answer counts';
  } else {
    return 'Final stretch - it all comes down to this';
  }
}

function selectPlayerDynamics(input: BarContextInput): string {
  const { totalPlayers, closestMargin, topScore, averageScore } = input;
  
  const scoreSpread = topScore - averageScore;
  
  if (scoreSpread > 500) {
    return 'One player dominating, but the pack is hungry';
  } else if (scoreSpread > 200) {
    return 'Leader pulling ahead, but it\'s not over yet';
  } else if (closestMargin <= 50) {
    return 'Too close to call - anyone could win';
  } else if (closestMargin <= 100) {
    return 'Tight race at the top - photo finish incoming';
  }
  
  if (totalPlayers >= 15) {
    return 'Massive field - chaos and glory await';
  } else if (totalPlayers >= 8) {
    return 'Competitive field keeping everyone honest';
  } else {
    return 'Elite group battling for supremacy';
  }
}

/**
 * Generate a single contextual quote
 */
export function generateContextQuote(input: BarContextInput): string {
  const context = generateBarContextFromTemplates(input);
  
  const quotes = [
    context.atmosphere,
    context.crowdEnergy,
    context.gameMomentum,
    context.playerDynamics,
  ];
  
  return quotes[Math.floor(Math.random() * quotes.length)];
}

/**
 * Generate round-specific commentary
 */
export function generateRoundCommentary(
  roundNumber: number,
  totalRounds: number,
  roundType: string
): string {
  const progressRatio = roundNumber / totalRounds;
  
  const typeEmoji: Record<string, string> = {
    prompt: '💬',
    trivia: '🧠',
    picture: '🖼️',
    wager: '🎲',
    photo: '📸',
    bluff: '🃏',
    mole: '🕵️',
    order: '🔢',
    predictive: '🎯',
  };
  
  const emoji = typeEmoji[roundType] || '🎮';
  
  if (progressRatio < 0.2) {
    return `${emoji} Round ${roundNumber} - Just getting started!`;
  } else if (progressRatio < 0.4) {
    return `${emoji} Round ${roundNumber} - Finding our rhythm`;
  } else if (progressRatio < 0.6) {
    return `${emoji} Round ${roundNumber} - Halfway there, heating up`;
  } else if (progressRatio < 0.8) {
    return `${emoji} Round ${roundNumber} - Entering the danger zone`;
  } else if (roundNumber === totalRounds) {
    return `${emoji} FINAL ROUND - Everything on the line!`;
  } else {
    return `${emoji} Round ${roundNumber} - Closing in on the finish`;
  }
}

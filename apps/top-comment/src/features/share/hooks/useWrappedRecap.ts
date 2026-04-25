import { useMemo } from 'react';
import type { SessionData, StoryCard } from '../../../domain/share/generateStoryCards';
import { generateStoryCards, calculateSessionHighlights } from '../../../domain/share/generateStoryCards';

interface UseWrappedRecapOptions {
  socialeId: string;
  socialiteId: string;
  sessionStats?: SessionData;
}

/**
 * Hook for generating wrapped-style recap from session data
 */
export function useWrappedRecap({ sessionStats }: UseWrappedRecapOptions) {
  // Generate story cards from session data
  const storyCards: StoryCard[] = useMemo(() => {
    if (!sessionStats) return [];
    return generateStoryCards(sessionStats);
  }, [sessionStats]);

  // Calculate quick highlights
  const highlights = useMemo(() => {
    if (!sessionStats) return null;
    return calculateSessionHighlights(sessionStats);
  }, [sessionStats]);

  return {
    storyCards,
    highlights,
    isReady: !!sessionStats && storyCards.length > 0,
  };
}

/**
 * Transform Sociale session data into SessionData format
 * This would typically fetch from Supabase and aggregate the data
 */
export function transformSocialeToSessionData(
  socialeData: any,
  responsesData: any[],
  votesData: any[],
  scoreEventsData: any[]
): SessionData {
  // Calculate round-by-round scores
  const roundScores: number[] = [];
  const roundAccuracy: boolean[] = [];
  
  // Group score events by round
  const scoresByRound = new Map<number, number>();
  scoreEventsData.forEach(event => {
    const roundIndex = event.round_index || 0;
    scoresByRound.set(roundIndex, (scoresByRound.get(roundIndex) || 0) + event.points);
  });

  // Group responses by round for accuracy
  const responsesByRound = new Map<number, any[]>();
  responsesData.forEach(response => {
    const roundIndex = response.round_index || 0;
    if (!responsesByRound.has(roundIndex)) {
      responsesByRound.set(roundIndex, []);
    }
    responsesByRound.get(roundIndex)!.push(response);
  });

  // Build round arrays
  const totalRounds = socialeData.current_round_index || 0;
  for (let i = 0; i < totalRounds; i++) {
    roundScores.push(scoresByRound.get(i) || 0);
    
    const roundResponses = responsesByRound.get(i) || [];
    const wasCorrect = roundResponses.some(r => r.is_correct === true);
    roundAccuracy.push(wasCorrect);
  }

  // Calculate totals
  const totalScore = roundScores.reduce((sum, score) => sum + score, 0);
  const correctAnswers = roundAccuracy.filter(Boolean).length;
  const totalAnswers = roundAccuracy.length;

  // Calculate streak
  let longestStreak = 0;
  let currentStreak = 0;
  roundAccuracy.forEach(correct => {
    if (correct) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  // Calculate fastest answer
  const answerTimes = responsesData
    .map(r => r.response_time_ms)
    .filter(t => t != null && t > 0);
  const fastestAnswerMs = answerTimes.length > 0 
    ? Math.min(...answerTimes) 
    : undefined;

  // Count votes received
  const votesReceived = votesData.filter(v => 
    v.voted_for_response_id && responsesData.some(r => r.id === v.voted_for_response_id)
  ).length;

  // Count perfect rounds (all correct in a round)
  const perfectRounds = roundAccuracy.filter(Boolean).length;

  // Category stats (if available)
  const categoryStats = calculateCategoryStats(responsesData);

  return {
    totalScore,
    roundsPlayed: totalRounds,
    correctAnswers,
    totalAnswers,
    longestStreak,
    fastestAnswerMs,
    rankPosition: socialeData.rank_position || 1,
    previousRank: socialeData.previous_rank,
    totalPlayers: socialeData.total_players || 1,
    votesReceived,
    votesGiven: votesData.length,
    perfectRounds,
    roundScores,
    roundAccuracy,
    categoryStats,
    venueName: socialeData.venue_name,
    sessionDate: new Date(socialeData.created_at),
  };
}

function calculateCategoryStats(responses: any[]) {
  const categoryMap = new Map<string, { correct: number; total: number }>();

  responses.forEach(response => {
    const category = response.category || 'General';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { correct: 0, total: 0 });
    }
    const stats = categoryMap.get(category)!;
    stats.total++;
    if (response.is_correct) {
      stats.correct++;
    }
  });

  return Array.from(categoryMap.entries()).map(([category, stats]) => ({
    category,
    correct: stats.correct,
    total: stats.total,
    accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
  }));
}

import { useState, useEffect } from 'react';
import { FullscreenModal } from '../../../../shared/components/FullscreenModal';
import { Button } from '../../../../components/Button';
import { interactionService } from '../../../../services/interactionService';
import type { Interaction } from '../../../../domain/types/interaction.types';

interface TriviaResultsLeaderboardProps {
  interaction: Interaction;
  isOpen: boolean;
  onClose: () => void;
}

interface LeaderboardEntry {
  memberName: string;
  isCorrect: boolean;
  responseTime: number;
  points: number;
  rank: number;
}

export function TriviaResultsLeaderboard({ interaction, isOpen, onClose }: TriviaResultsLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !interaction.id) return;

    loadLeaderboard();
  }, [isOpen, interaction.id]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Get trivia reveal data
      const reveal = await interactionService.getTriviaReveal(interaction.id, '');
      if (!reveal) {
        setError('Results not available yet');
        setIsLoading(false);
        return;
      }

      // Get all submissions for this trivia
      const submission = await interactionService.getTriviaSubmission(interaction.id, '');
      
      // Process submissions into leaderboard entries
      const entries: LeaderboardEntry[] = submission ? [{
        memberName: `Player 1`, // In real app, this would be the actual member name
        isCorrect: checkIfCorrect(submission.payload, reveal),
        responseTime: submission.latencyMs || 0,
        points: calculatePoints(checkIfCorrect(submission.payload, reveal), submission.latencyMs || 0, reveal.statistics.totalResponses),
        rank: 0 // Will be calculated below
      }] : [];

      // Sort by points (descending), then by response time (ascending)
      entries.sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points;
        return a.responseTime - b.responseTime;
      });

      // Assign ranks
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      setLeaderboard(entries);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setError('Failed to load results');
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfCorrect = (payload: any, reveal: any): boolean => {
    if (!payload || !reveal) return false;

    if (payload.format === 'multiple_choice') {
      return payload.selected_option_id === reveal.correctAnswer;
    } else if (payload.format === 'written_answer') {
      return payload.is_correct === true;
    }

    return false;
  };

  const calculatePoints = (isCorrect: boolean, responseTime: number, totalResponses: number): number => {
    if (!isCorrect) return 0;

    // Base points for correct answer
    let points = 100;

    // Bonus for speed (faster = more points)
    if (responseTime < 5000) { // Under 5 seconds
      points += 50;
    } else if (responseTime < 10000) { // Under 10 seconds
      points += 25;
    } else if (responseTime < 20000) { // Under 20 seconds
      points += 10;
    }

    // Bonus for being among first responders
    if (totalResponses <= 5) {
      points += 20;
    } else if (totalResponses <= 10) {
      points += 10;
    }

    return points;
  };

  const getRankEmoji = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-orange-400';
      default: return 'text-slate-300';
    }
  };

  return (
    <FullscreenModal isOpen={isOpen} onClose={onClose} title="Trivia Results">
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8 text-slate-400">
            <div className="text-4xl mb-4">⏳</div>
            <p>Loading results...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">❌</div>
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-cyan-400">{leaderboard.length}</div>
                <div className="text-sm text-slate-400">Total Players</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">
                  {leaderboard.filter(entry => entry.isCorrect).length}
                </div>
                <div className="text-sm text-slate-400">Correct Answers</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-400">
                  {Math.round((leaderboard.filter(entry => entry.isCorrect).length / leaderboard.length) * 100)}%
                </div>
                <div className="text-sm text-slate-400">Success Rate</div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Leaderboard</h3>
              {leaderboard.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-4xl mb-4">📊</div>
                  <p>No results available yet</p>
                </div>
              ) : (
                leaderboard.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      entry.rank <= 3
                        ? 'bg-gradient-to-r from-slate-800 to-slate-700 border-cyan-500/30'
                        : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    {/* Rank */}
                    <div className={`text-2xl font-bold ${getRankColor(entry.rank)}`}>
                      {getRankEmoji(entry.rank)}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-medium">{entry.memberName}</span>
                        {entry.isCorrect && (
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full">
                            Correct
                          </span>
                        )}
                        {!entry.isCorrect && (
                          <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">
                            Incorrect
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        {entry.responseTime > 0 ? `${Math.round(entry.responseTime / 1000)}s` : 'N/A'}
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <div className="text-xl font-bold text-cyan-400">{entry.points}</div>
                      <div className="text-xs text-slate-400">points</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={loadLeaderboard} variant="secondary" className="flex-1">
                Refresh Results
              </Button>
              <Button onClick={onClose} className="flex-1">
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </FullscreenModal>
  );
}

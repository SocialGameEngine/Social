import { useState, useEffect } from "react";
import type { InteractionResponse } from "../../../../shared/types";
import { useVotes } from "../../../../hooks/useVotes";
import { Button } from "../../../../components/Button";

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  interaction: {
    id: string;
    question: string;
  };
  responses: InteractionResponse[];
}

export function ResultsModal({
  isOpen,
  onClose,
  interaction,
  responses,
}: ResultsModalProps) {
  const { votes } = useVotes({ interactionId: interaction.id });
  const [sortedResults, setSortedResults] = useState<Array<{
    response: InteractionResponse;
    voteCount: number;
    percentage: number;
  }>>([]);

  useEffect(() => {
    if (!responses.length || !votes.length) {
      setSortedResults([]);
      return;
    }

    // Count votes per response
    const voteCounts = new Map<string, number>();
    votes.forEach(vote => {
      voteCounts.set(vote.responseId, (voteCounts.get(vote.responseId) || 0) + 1);
    });

    // Calculate results
    const totalVotes = votes.length;
    const results = responses.map(response => ({
      response,
      voteCount: voteCounts.get(response.id) || 0,
      percentage: totalVotes > 0 ? ((voteCounts.get(response.id) || 0) / totalVotes) * 100 : 0
    }));

    // Sort by vote count (descending)
    setSortedResults(results.sort((a, b) => b.voteCount - a.voteCount));
  }, [responses, votes]);

  if (!isOpen) return null;

  const totalVotes = votes.length;

  return (
    <div className="fixed inset-0 z-[100] flex sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl overflow-y-auto shadow-2xl bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900">
          <h2 className="text-lg font-bold text-white">Voting Results</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-3 sm:space-y-8 sm:p-5">
          {/* Question */}
          <div className="chaos-interaction-card px-3 py-3 text-center sm:px-4 sm:py-4 shadow-xl border-2 border-black/80">
            <p className="text-xl font-black tracking-tight drop-shadow-lg sm:text-2xl text-black">
              {interaction.question}
            </p>
            <p className="text-sm font-medium text-black/60 mt-2">
              {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} cast
            </p>
          </div>

          {/* Results */}
          <div className="space-y-3">
            {sortedResults.map((result, index) => (
              <div
                key={result.response.id}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  index === 0
                    ? "border-yellow-500 bg-yellow-500/10"
                    : "border-slate-600/50 bg-slate-800/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {index === 0 && (
                        <span className="text-lg">🥇</span>
                      )}
                      {index === 1 && (
                        <span className="text-lg">🥈</span>
                      )}
                      {index === 2 && (
                        <span className="text-lg">🥉</span>
                      )}
                      <p className="text-white font-medium">{result.response.text}</p>
                    </div>
                    <p className="text-sm text-slate-400">
                      — {result.response.playerName || "Anonymous"}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-2xl font-black text-white">
                      {result.voteCount}
                    </div>
                    <div className="text-sm text-slate-400">
                      {result.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        index === 0 ? "bg-yellow-500" : "bg-slate-500"
                      }`}
                      style={{ width: `${result.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Close Button */}
          <Button
            onClick={onClose}
            fullWidth
            size="sm"
            className="chaos-cta-button font-black text-xs sm:text-sm"
          >
            Close Results
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ResultsModal;

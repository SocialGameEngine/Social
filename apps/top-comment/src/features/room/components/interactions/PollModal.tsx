import { useState, useEffect, useCallback } from 'react';
import { Modal, Button } from '@social/ui';
import { useTheme } from '../../../../shared/providers/ThemeProvider';
import { interactionService } from '../../../../services/interactionService';
import type { Interaction, PollResults } from '../../../../domain/types/interaction.types';

interface PollModalProps {
  interaction: Interaction;
  membershipId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PollModal({ interaction, membershipId, isOpen, onClose }: PollModalProps) {
  const { isDark } = useTheme();
  const [results, setResults] = useState<PollResults | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadResults = useCallback(async () => {
    try {
      const data = await interactionService.getPollResults(interaction.id, membershipId);
      setResults(data);
    } catch (error) {
      console.error('Failed to load poll results:', error);
    } finally {
      setIsLoading(false);
    }
  }, [interaction.id, membershipId]);

  useEffect(() => {
    if (isOpen) {
      loadResults();
      const interval = setInterval(loadResults, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen, loadResults]);

  const handleVote = async (optionIndex: number) => {
    if (isVoting) return;

    setIsVoting(true);
    try {
      await interactionService.submitPollVote(interaction.id, membershipId, optionIndex);
      await loadResults();
    } catch (error: any) {
      console.error('Failed to submit vote:', error);
      alert(error.message || 'Failed to submit vote');
    } finally {
      setIsVoting(false);
    }
  };

  const isClosed = interaction.status === 'closed';

  return (
    <Modal open={isOpen} onClose={onClose} isDark={isDark} title="Poll">
      <div className="flex flex-col gap-4 p-6 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span className="text-3xl">📊</span>
          <div className="flex-1">
            <h3 className={`text-xl font-bold ${!isDark ? 'text-slate-900' : 'text-white'}`}>
              {interaction.question}
            </h3>
            {interaction.description && (
              <p className={`text-sm mt-2 ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                {interaction.description}
              </p>
            )}
            <div className={`flex items-center gap-3 mt-2 text-xs ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>{results?.totalVotes || 0} vote{results?.totalVotes !== 1 ? 's' : ''}</span>
              {isClosed && <span className="font-bold text-red-500">CLOSED</span>}
            </div>
          </div>
        </div>

        {/* Poll Options - Horizontal Bar Chart */}
        <div className="flex flex-col gap-2">
          {isLoading ? (
            <div className={`text-center py-8 text-sm ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Loading poll...
            </div>
          ) : (
            results?.options.map((option, index) => {
              const isSelected = option.isSelected;
              const maxVotes = Math.max(...(results.options.map(o => o.voteCount) || [1]));
              const barWidth = maxVotes > 0 ? (option.voteCount / maxVotes) * 100 : 0;

              return (
                <button
                  key={index}
                  onClick={() => !isClosed && handleVote(index)}
                  disabled={isClosed || isVoting}
                  className={`relative overflow-hidden rounded-lg border transition-all ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : !isDark
                      ? 'border-slate-300 bg-white hover:border-slate-400'
                      : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                  } ${isClosed ? 'cursor-default' : 'cursor-pointer'} ${
                    isVoting ? 'opacity-50' : ''
                  }`}
                >
                  {/* Vote bar background */}
                  <div
                    className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                      isSelected
                        ? 'bg-cyan-500/30'
                        : !isDark
                        ? 'bg-slate-200'
                        : 'bg-slate-600'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />

                  {/* Content */}
                  <div className="relative flex items-center justify-between px-4 py-3">
                    <span className={`text-sm font-medium text-left flex-1 ${
                      !isDark ? 'text-slate-900' : 'text-white'
                    }`}>
                      {option.text}
                    </span>
                    
                    {/* Vote count on the right */}
                    <div className="flex items-center gap-2 ml-4">
                      <span className={`text-sm font-bold ${
                        isSelected
                          ? 'text-cyan-500'
                          : !isDark
                          ? 'text-slate-600'
                          : 'text-slate-300'
                      }`}>
                        {option.voteCount}
                      </span>
                      {option.percentage > 0 && (
                        <span className={`text-xs font-medium ${
                          !isDark ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          ({option.percentage.toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Vote Status */}
        {!isLoading && results && (
          <div className={`text-center text-sm ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            {isClosed ? (
              <span className="font-semibold">Poll closed</span>
            ) : results.userVote !== undefined ? (
              <span>Click any option to change your vote</span>
            ) : (
              <span>Tap an option to vote</span>
            )}
          </div>
        )}

        {/* Close Button */}
        <div className="flex gap-3 mt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default PollModal;

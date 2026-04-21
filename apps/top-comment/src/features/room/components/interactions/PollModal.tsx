import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../../../components/Button';
import { FullscreenModal } from '../../../../shared/components/FullscreenModal';
import { interactionService } from '../../../../services/interactionService';
import type { Interaction, PollResults } from '../../../../domain/types/interaction.types';

interface PollModalProps {
  interaction: Interaction;
  membershipId?: string;
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom?: () => void;
}

export function PollModal({ interaction, membershipId, isOpen, onClose, onJoinRoom }: PollModalProps) {
  const [results, setResults] = useState<PollResults | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadResults = useCallback(async () => {
    try {
      const data = await interactionService.getPollResults(interaction.id, membershipId || '');
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

  const handleSubmitVote = async (selectedOption: number) => {
    if (!membershipId) return;

    setIsVoting(true);
    try {
      await interactionService.submitPollVote(interaction.id, membershipId, selectedOption);
      await loadResults();
    } catch (error: any) {
      console.error('Failed to submit vote:', error);
      alert(error.message || 'Failed to submit vote');
    } finally {
      setIsVoting(false);
    }
  };

  const isClosed = interaction.status === 'closed';

  if (!isOpen) return null;

  return (
    <FullscreenModal
      isOpen={isOpen}
      onClose={onClose}
      title="Poll"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-3xl">📊</span>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">
            {interaction.question}
          </h3>
          {interaction.description && (
            <p className="text-sm mt-2 text-slate-400">
              {interaction.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span>{results?.totalVotes || 0} vote{results?.totalVotes !== 1 ? 's' : ''}</span>
            {isClosed && <span className="font-bold text-red-500">CLOSED</span>}
          </div>
        </div>
      </div>

      {/* Poll Options - Horizontal Bar Chart */}
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="text-center py-8 text-sm text-slate-400">
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
                onClick={() => !isClosed && handleSubmitVote(index)}
                disabled={isClosed || isVoting}
                className={`relative overflow-hidden rounded-lg border transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                } ${isClosed ? 'cursor-default' : 'cursor-pointer'} ${
                  isVoting ? 'opacity-50' : ''
                }`}
              >
                {/* Vote bar background */}
                <div
                  className={`progress-width-var absolute left-0 top-0 h-full transition-all duration-500 ${
                    isSelected
                      ? 'bg-cyan-500/30'
                      : 'bg-slate-600'
                  }`}
                  style={{ '--progress-width': `${barWidth}%` } as React.CSSProperties}
                />

                {/* Content */}
                <div className="relative flex items-center justify-between px-4 py-3">
                  <span className={`text-sm font-medium text-left flex-1 text-white`}>
                    {option.text}
                  </span>
                  
                  {/* Vote count on the right */}
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`text-sm font-bold ${
                      isSelected
                        ? 'text-cyan-500'
                        : 'text-slate-400'
                    }`}>
                      {option.voteCount}
                    </span>
                    {option.percentage > 0 && (
                      <span className={`text-xs font-medium ${
                        'text-slate-400'
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
        <div className="text-center text-sm text-slate-400">
          {!membershipId ? (
            <div className="py-2">
              <p className="mb-2">👋 Join this room to vote in the poll!</p>
              <Button onClick={onJoinRoom} size="sm">
                Join Room
              </Button>
            </div>
          ) : isClosed ? (
            <span className="font-semibold">Poll closed</span>
          ) : results.userVote !== undefined ? (
            <span>Click any option to change your vote</span>
          ) : (
            <span>Tap an option to vote</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-slate-700/50 pt-4">
        <Button
          variant="secondary"
          onClick={onClose}
          className="w-full"
        >
          Close
        </Button>
      </div>
    </FullscreenModal>
  );
}

export default PollModal;

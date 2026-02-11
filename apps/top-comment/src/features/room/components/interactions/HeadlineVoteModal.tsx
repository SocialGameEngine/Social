import { useState, useEffect } from 'react';
import { Button } from '../../../../components/Button';
import { interactionService } from '../../../../services/interactionService';
import type { Interaction, RoomMembership } from '../../../../shared/types';

interface HeadlineVoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  interaction: Interaction;
  membership: RoomMembership | null;
}

export function HeadlineVoteModal({ isOpen, onClose, interaction, membership }: HeadlineVoteModalProps) {
  const [votingOptions, setVotingOptions] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !interaction || !membership) return;
    
    // TODO: Replace with actual RPC call
    interactionService.getVotingOptions(interaction.id, membership.id).then(options => {
      setVotingOptions(options);
    }).catch(() => {
      setError('Failed to load voting options');
    });
  }, [isOpen, interaction, membership]);

  const handleSubmit = async () => {
    if (!selectedOption || !membership) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Implement vote submission
      await interactionService.submitHeadlineVote(interaction.id, membership.id, selectedOption);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !interaction || !membership) return null;

  const settings = interaction.settings as any;
  const headlineBlank = settings?.headlineBlank || interaction.question;

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg overflow-y-auto shadow-2xl bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900">
          <h2 className="text-lg font-bold text-white">🎭 Vote for the Real Answer</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
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
          {/* Headline Card */}
          <div className="chaos-interaction-card p-4 shadow-xl border-2 border-black/80">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">
                {headlineBlank}
              </div>
              <div className="text-sm text-gray-600">
                {settings?.sourceName} • {settings?.publishedAt ? new Date(settings.publishedAt).toLocaleDateString() : ''}
              </div>
            </div>
          </div>

          {/* Voting Options */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Which do you think is the real answer?</h3>
            
            {votingOptions.map((option, index) => (
              <label
                key={option.id || index}
                className="flex items-center p-3 bg-slate-800 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors"
              >
                <input
                  type="radio"
                  name="vote"
                  value={option.id}
                  checked={selectedOption === option.id}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  className="mr-3"
                  disabled={isSubmitting}
                />
                <span className="text-white">{option.text}</span>
              </label>
            ))}

            {error && (
              <div className="text-red-400 text-sm">{error}</div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedOption || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Voting...' : 'Submit Vote'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeadlineVoteModal;

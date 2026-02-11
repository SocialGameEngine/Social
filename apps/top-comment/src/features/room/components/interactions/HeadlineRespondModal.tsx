import { useState, useCallback, useEffect } from 'react';
import { Button } from '../../../../components/Button';
import { interactionService } from '../../../../services/interactionService';
import type { Interaction, RoomMembership } from '../../../../shared/types';

interface HeadlineRespondModalProps {
  isOpen: boolean;
  onClose: () => void;
  interaction: Interaction;
  membership: RoomMembership | null;
}

const CHAR_LIMIT = 140;

export function HeadlineRespondModal({ isOpen, onClose, interaction, membership }: HeadlineRespondModalProps) {
  const [lie, setLie] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingResponse, setExistingResponse] = useState<string | null>(null);

  // Load existing response if any
  useEffect(() => {
    if (!isOpen || !interaction || !membership) return;
    
    interactionService.getMyResponse(interaction.id, membership.id).then(response => {
      setExistingResponse(response?.text || null);
      setLie(response?.text || '');
    });
  }, [isOpen, interaction, membership]);

  // Update lie when existingResponse changes
  useEffect(() => {
    setLie(existingResponse || '');
  }, [existingResponse]);

  const handleSubmit = useCallback(async () => {
    const trimmed = lie.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await interactionService.submitResponse(interaction.id, membership!.id, trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit lie');
    } finally {
      setIsSubmitting(false);
    }
  }, [lie, interaction, membership, onClose]);

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
          <h2 className="text-lg font-bold text-white">🎭 Fill in the Blank</h2>
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

          {/* Response Form */}
          <div className="space-y-4">
            <div>
              <label htmlFor="lie" className="block text-sm font-medium text-slate-300 mb-2">
                Your Lie {existingResponse && '(update)'}
              </label>
              <textarea
                id="lie"
                value={lie}
                onChange={(e) => setLie(e.target.value)}
                placeholder="Enter a believable lie to fill in the blank..."
                maxLength={CHAR_LIMIT}
                rows={3}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                disabled={isSubmitting}
              />
              <div className="text-xs text-slate-400 mt-1">
                {lie.length}/{CHAR_LIMIT} characters
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm">{error}</div>
            )}

            <div className="flex gap-3">
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
                disabled={!lie.trim() || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : (existingResponse ? 'Update Lie' : 'Submit Lie')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeadlineRespondModal;

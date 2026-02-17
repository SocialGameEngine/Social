import { useState, useEffect } from 'react';
import { Button } from '../../../../components/Button';
import { interactionService } from '../../../../services/interactionService';
import type { Interaction, RoomMembership } from '../../../../shared/types';

interface HeadlineResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  interaction: Interaction;
  membership: RoomMembership | null;
}

export function HeadlineResultsModal({ isOpen, onClose, interaction, membership }: HeadlineResultsModalProps) {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !interaction || !membership) return;
    
    setLoading(true);
    // TODO: Replace with actual RPC call
    interactionService.getHeadlineResults(interaction.id, membership.id).then(data => {
      setResults(data);
      setLoading(false);
    }).catch(() => {
      setError('Failed to load results');
      setLoading(false);
    });
  }, [isOpen, interaction, membership]);

  if (!isOpen || !interaction || !membership) return null;

  const settings = interaction.settings as any;
  const headlineBlank = settings?.headlineBlank || interaction.question;

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg overflow-y-auto shadow-2xl bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900">
          <h2 className="text-lg font-bold text-white">🎭 Results</h2>
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

          {/* Results */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-slate-400">Loading results...</div>
            ) : error ? (
              <div className="text-red-400 text-center">{error}</div>
            ) : results ? (
              <div className="space-y-4">
                {/* Real Answer */}
                <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-400 mb-2">✅ Real Answer:</h3>
                  <p className="text-white">{results.realAnswer}</p>
                </div>

                {/* Vote Results */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">Vote Results:</h3>
                  {results.options?.map((option: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-slate-800 rounded">
                      <span className="text-white">{option.text}</span>
                      <span className="text-slate-400">{option.voteCount} votes</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400">No results available</div>
            )}

            <div className="pt-4">
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeadlineResultsModal;

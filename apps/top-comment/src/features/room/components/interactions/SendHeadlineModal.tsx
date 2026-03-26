import React, { useState } from 'react';

interface SendHeadlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: {
    headlineId: string;
    headlineBlank: string;
    sourceName: string;
    publishedAt: string;
    answerSeconds?: number;
    votingSeconds?: number;
  }) => void;
}

// Sample headlines for MVP - in production these would come from a database
const SAMPLE_HEADLINES = [
  {
    id: 'headline_1',
    blank: 'Tech CEO sues former employee over leaked ____',
    source: 'TechCrunch',
    publishedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'headline_2', 
    blank: 'Local man discovers ____ in his backyard, calls it "life-changing"',
    source: 'Local News',
    publishedAt: '2024-01-10T14:30:00Z',
  },
  {
    id: 'headline_3',
    blank: 'Scientists reveal that eating ____ every day can improve memory',
    source: 'Health Journal',
    publishedAt: '2024-01-08T09:15:00Z',
  },
];

export default function SendHeadlineModal({ isOpen, onClose, onSubmit }: SendHeadlineModalProps) {
  const [selectedHeadline, setSelectedHeadline] = useState(SAMPLE_HEADLINES[0]);
  const [answerSeconds, setAnswerSeconds] = useState(90);
  const [votingSeconds, setVotingSeconds] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        headlineId: selectedHeadline.id,
        headlineBlank: selectedHeadline.blank,
        sourceName: selectedHeadline.source,
        publishedAt: selectedHeadline.publishedAt,
        answerSeconds,
        votingSeconds,
      });
      onClose();
    } catch (error) {
      console.error('Failed to create headline interaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />
      
      {/* Modal Content */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl overflow-y-auto shadow-2xl bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900">
          <h2 className="text-lg font-bold text-white">Start Headline Fibbage</h2>
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
        <div className="space-y-4 p-4 sm:p-5">
        
        <form onSubmit={handleSubmit}>
          {/* Headline Selection */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wide text-cyan-200 mb-2">
              Choose a Headline
            </label>
            <div className="space-y-3">
              {SAMPLE_HEADLINES.map((headline) => (
                <label
                  key={headline.id}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedHeadline.id === headline.id
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="headline"
                    value={headline.id}
                    checked={selectedHeadline.id === headline.id}
                    onChange={() => setSelectedHeadline(headline)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div>
                      <div className="font-semibold text-white">
                        {headline.blank}
                      </div>
                      <div className="text-sm text-slate-400">
                        {headline.source} • {new Date(headline.publishedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Timing Settings */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-1">
                Answer Time (seconds)
              </label>
              <input
                type="number"
                min="30"
                max="300"
                value={answerSeconds}
                onChange={(e) => setAnswerSeconds(parseInt(e.target.value) || 90)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-1">
                Voting Time (seconds)
              </label>
              <input
                type="number"
                min="30"
                max="180"
                value={votingSeconds}
                onChange={(e) => setVotingSeconds(parseInt(e.target.value) || 60)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="mb-6 p-4 bg-slate-800 rounded-lg">
            <h3 className="text-sm font-medium text-cyan-200 mb-2">Preview</h3>
            <div className="text-lg font-semibold text-white mb-1">
              {selectedHeadline.blank}
            </div>
            <div className="text-sm text-slate-400">
              {selectedHeadline.source} • {new Date(selectedHeadline.publishedAt).toLocaleDateString()}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {answerSeconds}s to write lies • {votingSeconds}s to vote
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 border-t border-slate-700/50 bg-slate-900 p-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-md hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Starting...' : 'Start Headline'}
              </button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Button } from '@social/ui';
import { HostModal } from './HostModal';

interface HostSendHeadlineModalProps {
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

export default function HostSendHeadlineModal({ isOpen, onClose, onSubmit }: HostSendHeadlineModalProps) {
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

  return (
    <HostModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Start Headline Fibbage"
      maxWidth="2xl"
      disabled={isSubmitting}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📰</span>
          <h2 className="text-2xl font-bold text-white">
            Start Headline Fibbage
          </h2>
        </div>

        <p className="text-sm text-slate-400">
          Send a headline with a blank word for members to fill in with funny lies.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Headline Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-cyan-200">
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-cyan-200">
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
              <label className="text-sm font-semibold text-cyan-200">
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
          <div className="p-4 bg-slate-800 rounded-lg">
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

          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <Button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Starting...' : 'Start Headline'}
            </Button>
          </div>
        </form>
      </div>
    </HostModal>
  );
}

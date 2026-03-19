import { useState } from 'react';
import { Button } from '@social/ui';
import { HostModal } from './HostModal';
import type { TopicSortBy } from '../../../domain/types/interaction.types';

interface HostCreateTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: string, description?: string, sortBy?: TopicSortBy) => Promise<void>;
}

export function HostCreateTopicModal({ isOpen, onClose, onSubmit }: HostCreateTopicModalProps) {
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [sortBy, setSortBy] = useState<TopicSortBy>('newest');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!question.trim()) {
      setError('Question is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(question.trim(), description.trim(), sortBy);
      onClose();
    } catch (error) {
      setError('Failed to create topic');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setQuestion('');
      setDescription('');
      setSortBy('newest');
      setError('');
      onClose();
    }
  };

  return (
    <HostModal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Create Topic"
      maxWidth="lg"
      disabled={isSubmitting}
    >
      <div className="space-y-6">
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/50">
            <p className="text-sm text-red-500 font-semibold">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="text-3xl">💬</span>
          <h2 className="text-2xl font-bold text-white">
            Create Topic
          </h2>
        </div>

        <p className="text-sm text-slate-400">
          Ask an open-ended question for your room to discuss. Members can submit responses and upvote others.
        </p>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-cyan-200">
              Question *
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What is the most embarrassing song you listen to?"
              maxLength={200}
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-xs text-slate-400">
              {question.length}/200
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-cyan-200">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context or instructions..."
              maxLength={500}
              rows={3}
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
            <span className="text-xs text-slate-400">
              {description.length}/500
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-cyan-200">
              Default Sort
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('newest')}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2 rounded-lg border-2 font-semibold transition-colors ${
                  sortBy === 'newest'
                    ? 'border-cyan-500 bg-cyan-500 text-white'
                    : 'border-slate-600 bg-slate-700 text-slate-200 hover:border-slate-500'
                }`}
              >
                Newest First
              </button>
              <button
                onClick={() => setSortBy('upvotes')}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2 rounded-lg border-2 font-semibold transition-colors ${
                  sortBy === 'upvotes'
                    ? 'border-cyan-500 bg-cyan-500 text-white'
                    : 'border-slate-600 bg-slate-700 text-slate-200 hover:border-slate-500'
                }`}
              >
                Most Upvoted
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-700">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!question.trim() || isSubmitting}
            isLoading={isSubmitting}
            className="flex-1"
          >
            Create Topic
          </Button>
        </div>
      </div>
    </HostModal>
  );
}

export default HostCreateTopicModal;

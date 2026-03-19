import { useState } from 'react';
import { Button } from '@social/ui';
import type { TopicSortBy } from '../../../../domain/types/interaction.types';

interface CreateTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: string, description?: string, sortBy?: TopicSortBy) => Promise<void>;
}

function CreateTopicModal({ isOpen, onClose, onSubmit }: CreateTopicModalProps) {
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
      await onSubmit(question.trim(), description.trim() || undefined, sortBy);
      setQuestion('');
      setDescription('');
      setSortBy('newest');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create topic');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!isSubmitting ? handleClose : undefined}
      />
      
      {/* Modal Content */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg overflow-y-auto shadow-2xl bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900">
          <h2 className="text-lg font-bold text-white">Create Topic</h2>
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
          <div className="flex items-center gap-3">
            <span className="text-3xl">💬</span>
            <h2 className="text-2xl font-bold text-white">
              Create Topic
            </h2>
          </div>

          <p className="text-sm text-slate-400">
            Ask an open-ended question for your room to discuss. Members can submit responses and upvote others.
          </p>

        <form onSubmit={handleSubmit}>
          {error && (
          <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/50">
            <p className="text-sm text-red-500 font-semibold">{error}</p>
          </div>
        )}

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

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-slate-700/50 bg-slate-900 p-4">
          <div className="flex gap-3">
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
        </form>
        </div>
      </div>
    </div>
  );
}

export default CreateTopicModal;

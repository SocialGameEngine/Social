import { useState } from 'react';
import { Modal, Button } from '@social/ui';
import { useTheme } from '../../../../shared/providers/ThemeProvider';
import type { TopicSortBy } from '../../../../domain/types/interaction.types';

interface CreateTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: string, description?: string, sortBy?: TopicSortBy) => Promise<void>;
}

function CreateTopicModal({ isOpen, onClose, onSubmit }: CreateTopicModalProps) {
  const { isDark } = useTheme();
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

  return (
    <Modal open={isOpen} onClose={handleClose} isDark={isDark} title="Create Topic">
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">💬</span>
          <h2 className={`text-2xl font-bold ${!isDark ? 'text-slate-900' : 'text-white'}`}>
            Create Topic
          </h2>
        </div>

        <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          Ask an open-ended question for your room to discuss. Members can submit responses and upvote others.
        </p>

        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/50">
            <p className="text-sm text-red-500 font-semibold">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className={`text-sm font-semibold ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
            Question *
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What is the most embarrassing song you listen to?"
            maxLength={200}
            disabled={isSubmitting}
            className={`px-3 py-2 rounded-lg border ${
              !isDark
                ? 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
                : 'border-slate-600 bg-slate-700 text-white placeholder-slate-500'
            } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
          />
          <span className={`text-xs ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {question.length}/200
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <label className={`text-sm font-semibold ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add context or instructions..."
            maxLength={500}
            rows={3}
            disabled={isSubmitting}
            className={`px-3 py-2 rounded-lg border resize-none ${
              !isDark
                ? 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
                : 'border-slate-600 bg-slate-700 text-white placeholder-slate-500'
            } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
          />
          <span className={`text-xs ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {description.length}/500
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <label className={`text-sm font-semibold ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
            Default Sort
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('newest')}
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 rounded-lg border-2 font-semibold transition-colors ${
                sortBy === 'newest'
                  ? 'border-cyan-500 bg-cyan-500 text-white'
                  : !isDark
                  ? 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
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
                  : !isDark
                  ? 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                  : 'border-slate-600 bg-slate-700 text-slate-200 hover:border-slate-500'
              }`}
            >
              Most Upvoted
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-2">
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
    </Modal>
  );
}

export default CreateTopicModal;

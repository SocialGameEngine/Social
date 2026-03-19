import { useState } from 'react';
import { Button } from '@social/ui';
import { HostModal } from './HostModal';

interface HostCreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: string, options: string[], description?: string) => Promise<void>;
}

export function HostCreatePollModal({ isOpen, onClose, onSubmit }: HostCreatePollModalProps) {
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!question.trim()) {
      setError('Question is required');
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      setError('At least 2 options are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(question.trim(), validOptions, description.trim());
      onClose();
    } catch (error) {
      setError('Failed to create poll');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setQuestion('');
      setDescription('');
      setOptions(['', '']);
      setError('');
      onClose();
    }
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <HostModal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Create Poll"
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
          <span className="text-3xl">📊</span>
          <h2 className="text-2xl font-bold text-white">
            Create Poll
          </h2>
        </div>

        <p className="text-sm text-slate-400">
          Create a poll for your room to gather opinions and votes.
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
              placeholder="Barbie or Oppenheimer?"
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
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description to your poll"
              maxLength={200}
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-xs text-slate-400">
              {description.length}/200
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-cyan-200">
              Options
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={addOption}
              disabled={isSubmitting}
            >
              + Add Option
            </Button>
          </div>
          
          <div className="flex flex-col gap-2">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  maxLength={100}
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                    disabled={isSubmitting}
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
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
            disabled={!question.trim() || options.filter(opt => opt.trim()).length < 2 || isSubmitting}
            isLoading={isSubmitting}
            className="flex-1"
          >
            Create Poll
          </Button>
        </div>
      </div>
    </HostModal>
  );
}

export default HostCreatePollModal;

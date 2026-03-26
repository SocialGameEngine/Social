import { useState } from 'react';
import { Button } from '@social/ui';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: string, options: string[], description?: string) => Promise<void>;
}

function CreatePollModal({ isOpen, onClose, onSubmit }: CreatePollModalProps) {
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim()) {
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(question.trim(), validOptions.map(opt => opt.trim()), description.trim() || undefined);
      setQuestion('');
      setDescription('');
      setOptions(['', '']);
      onClose();
    } catch (err: any) {
      console.error('Failed to create poll:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setQuestion('');
      setDescription('');
      setOptions(['', '']);
      onClose();
    }
  };

  const addOption = () => {
    if (options.length < 5) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!isSubmitting ? handleClose : undefined}
      />
      
      {/* Modal Content */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg overflow-y-auto shadow-2xl bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900">
          <h2 className="text-lg font-bold text-white">Create Poll</h2>
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
            <span className="text-3xl">📊</span>
            <h2 className="text-2xl font-bold text-white">
              Create Poll
            </h2>
          </div>

          <p className="text-sm text-slate-400">
            Create a poll for your room to gather opinions and votes.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={!question.trim() || options.filter(opt => opt.trim()).length < 2 || isSubmitting}
                  isLoading={isSubmitting}
                  className="flex-1"
                >
                  Create Poll
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreatePollModal;

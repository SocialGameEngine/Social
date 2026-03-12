import { useState } from 'react';
import { Modal, Button } from '@social/ui';
import { useTheme } from '../../../../shared/providers/ThemeProvider';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: string, options: string[], description?: string) => Promise<void>;
}

function CreatePollModal({ isOpen, onClose, onSubmit }: CreatePollModalProps) {
  const { isDark } = useTheme();
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
      await onSubmit(question.trim(), validOptions.map(opt => opt.trim()), description.trim() || undefined);
      setQuestion('');
      setDescription('');
      setOptions(['', '']);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create poll');
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

  return (
    <Modal open={isOpen} onClose={handleClose} isDark={isDark} title="Create Poll">
      <div className="flex flex-col gap-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📊</span>
          <h2 className={`text-2xl font-bold ${!isDark ? 'text-slate-900' : 'text-white'}`}>
            Create Poll
          </h2>
        </div>

        <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          Create a multiple choice poll with 2-5 options. Members can vote and change their vote anytime.
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
            placeholder="Barbie or Oppenheimer?"
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
            placeholder="Add context..."
            maxLength={500}
            rows={2}
            disabled={isSubmitting}
            className={`px-3 py-2 rounded-lg border resize-none ${
              !isDark
                ? 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
                : 'border-slate-600 bg-slate-700 text-white placeholder-slate-500'
            } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className={`text-sm font-semibold ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
              Options * (2-5)
            </label>
            {options.length < 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={addOption}
                disabled={isSubmitting}
              >
                + Add Option
              </Button>
            )}
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
                  className={`flex-1 px-3 py-2 rounded-lg border ${
                    !isDark
                      ? 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
                      : 'border-slate-600 bg-slate-700 text-white placeholder-slate-500'
                  } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
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
            disabled={!question.trim() || options.filter(opt => opt.trim()).length < 2 || isSubmitting}
            isLoading={isSubmitting}
            className="flex-1"
          >
            Create Poll
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CreatePollModal;

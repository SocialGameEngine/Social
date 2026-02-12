import { useState, useCallback } from 'react';

const CATEGORIES = ['Funny', 'Deep', 'Controversial', 'Random', 'Icebreaker'];

interface SubmitQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (questionText: string, category?: string) => Promise<void>;
}

export function SubmitQuestionModal({ isOpen, onClose, onSubmit }: SubmitQuestionModalProps) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed, category ?? undefined);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  }, [text, category, onSubmit]);

  const handleClose = () => {
    setText('');
    setCategory(null);
    setSubmitted(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 bg-slate-800 border border-slate-700 rounded-xl shadow-xl">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-white">Submit a Question</h3>
        </div>

        {submitted ? (
          <div className="p-6 text-center space-y-4">
            <div className="text-3xl">✅</div>
            <p className="text-sm text-slate-300">Your question has been submitted for review!</p>
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                Your Question
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 200))}
                placeholder="Type a question for the host to use..."
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                maxLength={200}
                autoFocus
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs ${text.length >= 200 ? 'text-rose-400' : 'text-slate-500'}`}>
                  {text.length}/200
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                Category <span className="text-slate-500">(optional)</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(category === c ? null : c)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                      category === c
                        ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                        : 'border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-rose-400">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!text.trim() || isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

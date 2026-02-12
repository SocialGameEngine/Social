import { useState, useCallback } from 'react';

const CHALLENGE_PROMPTS = [
  "Who can write the funniest response?",
  "Best one-liner wins!",
  "Most creative answer takes it all!",
  "Convince the crowd you're right!",
];

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (question: string, pointsWager?: number) => Promise<void>;
  targetName: string;
}

export function ChallengeModal({ isOpen, onClose, onSend, targetName }: ChallengeModalProps) {
  const [question, setQuestion] = useState('');
  const [wager, setWager] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = useCallback(async () => {
    const trimmed = question.trim();
    if (!trimmed) return;

    setIsSending(true);
    setError(null);
    try {
      await onSend(trimmed, wager > 0 ? wager : undefined);
      setQuestion('');
      setWager(0);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send challenge');
    } finally {
      setIsSending(false);
    }
  }, [question, wager, onSend, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 bg-slate-800 border border-slate-700 rounded-xl shadow-xl">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-white">Challenge {targetName}</h3>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
              Challenge Prompt
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, 200))}
              placeholder="Type your challenge prompt..."
              rows={2}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
              maxLength={200}
              autoFocus
            />
            <div className="flex justify-end mt-1">
              <span className={`text-xs ${question.length >= 200 ? 'text-rose-400' : 'text-slate-500'}`}>
                {question.length}/200
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Quick prompts</p>
            <div className="flex flex-wrap gap-1.5">
              {CHALLENGE_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setQuestion(p)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-slate-600 text-slate-300 hover:border-amber-400/50 hover:text-amber-300 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
              Points Wager <span className="text-slate-500">(optional)</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={wager}
              onChange={(e) => setWager(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0</span>
              <span className="text-amber-400 font-medium">{wager} pts</span>
              <span>100</span>
            </div>
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!question.trim() || isSending}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? 'Sending...' : 'Send Challenge'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

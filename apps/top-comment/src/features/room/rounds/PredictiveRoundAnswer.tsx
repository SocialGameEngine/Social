// Predictive round answer phase.
// Standard text input. Answer goes to host for manual approve/reject.
// Shows a "pending review" state after submission.

import { useState } from 'react';

interface PredictiveRoundAnswerProps {
  prompt: string | null;
  onSubmit: (answer: string) => void;
  isDark: boolean;
}

export function PredictiveRoundAnswer({ prompt, onSubmit, isDark }: PredictiveRoundAnswerProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    const trimmed = answer.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <div className="space-y-4">
      {/* Predictive badge */}
      <div className="flex justify-center">
        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
          isDark ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-50 text-purple-600 border border-purple-200'
        }`}>
          🔮 Predictive Round
        </span>
      </div>

      {prompt && (
        <p className={`text-center text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {prompt}
        </p>
      )}

      <p className={`text-xs text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        The host will review and approve answers
      </p>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Make your prediction…"
        rows={3}
        className={`w-full px-4 py-3 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 ${
          isDark
            ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
        }`}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!answer.trim()}
        className="w-full rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-white font-black py-3 text-sm uppercase tracking-wider transition-colors"
      >
        Submit Prediction
      </button>
    </div>
  );
}

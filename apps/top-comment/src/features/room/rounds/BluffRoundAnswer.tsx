// Bluff round answer phase.
// Standard text answer + a "this is a bluff" toggle.
// Encoded as JSON: { answer: string, isBluff: boolean }

import { useState } from 'react';

interface BluffRoundAnswerProps {
  prompt: string | null;
  onSubmit: (encoded: string) => void;
  isDark: boolean;
}

export function BluffRoundAnswer({ prompt, onSubmit, isDark }: BluffRoundAnswerProps) {
  const [answer, setAnswer] = useState('');
  const [isBluff, setIsBluff] = useState(false);

  const handleSubmit = () => {
    const trimmed = answer.trim();
    if (trimmed) onSubmit(JSON.stringify({ answer: trimmed, isBluff }));
  };

  return (
    <div className="space-y-4">
      {prompt && (
        <p className={`text-center text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {prompt}
        </p>
      )}

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your response…"
        rows={3}
        className={`w-full px-4 py-3 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
          isDark
            ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
        }`}
      />

      {/* Bluff toggle */}
      <button
        type="button"
        onClick={() => setIsBluff(b => !b)}
        className={`w-full rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all ${
          isBluff
            ? 'border-orange-500 bg-orange-500/20 text-orange-300'
            : isDark
              ? 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
              : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400'
        }`}
      >
        {isBluff ? '🃏 Marked as Bluff' : '🃏 This is a Bluff'}
      </button>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!answer.trim()}
        className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-white font-black py-3 text-sm uppercase tracking-wider transition-colors"
      >
        Submit
      </button>
    </div>
  );
}

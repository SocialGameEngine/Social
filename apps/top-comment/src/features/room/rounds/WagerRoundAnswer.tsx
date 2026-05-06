// Wager round answer phase.
// Player first sets a wager (1-100 pts), then submits a text answer.
// Encoded as JSON: { wager: number, answer: string }

import { useState } from 'react';

interface WagerRoundAnswerProps {
  prompt: string | null;
  currentScore: number;
  onSubmit: (encoded: string) => void;
  isDark: boolean;
}

export function WagerRoundAnswer({ prompt, currentScore, onSubmit, isDark }: WagerRoundAnswerProps) {
  const maxWager = Math.max(1, currentScore);
  const [wager, setWager] = useState(Math.floor(maxWager / 2));
  const [answer, setAnswer] = useState('');
  const [step, setStep] = useState<'wager' | 'answer'>('wager');

  const handleWagerNext = () => {
    if (wager > 0) setStep('answer');
  };

  const handleSubmit = () => {
    const trimmed = answer.trim();
    if (trimmed) {
      onSubmit(JSON.stringify({ wager, answer: trimmed }));
    }
  };

  if (step === 'wager') {
    return (
      <div className="space-y-6">
        {prompt && (
          <p className={`text-center text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {prompt}
          </p>
        )}

        <div className="space-y-4">
          <div className="text-center">
            <p className={`text-xs font-black uppercase tracking-widest mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Your Wager
            </p>
            <p className={`text-6xl font-black ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`}>
              {wager}
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              of {currentScore} pts
            </p>
          </div>

          <input
            type="range"
            min={1}
            max={maxWager}
            value={wager}
            onChange={(e) => setWager(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />

          <div className="flex justify-between text-xs text-white/40">
            <span>1</span>
            <span>{maxWager}</span>
          </div>

          <button
            type="button"
            onClick={handleWagerNext}
            disabled={wager < 1}
            className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-white font-black py-3 text-sm uppercase tracking-wider transition-colors"
          >
            Lock Wager →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-xl p-3 text-center text-sm ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Wagering </span>
        <span className={`font-black ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`}>{wager} pts</span>
      </div>

      {prompt && (
        <p className={`text-center text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {prompt}
        </p>
      )}

      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        placeholder="Type your answer…"
        className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
          isDark
            ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
        }`}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!answer.trim()}
        className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-white font-black py-3 text-sm uppercase tracking-wider transition-colors"
      >
        Submit Answer
      </button>
    </div>
  );
}

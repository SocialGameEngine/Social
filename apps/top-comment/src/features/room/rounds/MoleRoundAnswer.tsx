// Mole round answer phase.
// Standard text answer + optional "I suspect a mole" accusation.
// Encoded as JSON: { answer: string, accusedId: string | null }

import { useState } from 'react';
import type { Socialite } from '../../../domain/types/sociale.types';

interface MoleRoundAnswerProps {
  prompt: string | null;
  socialites: Socialite[];
  currentSocialiteId: string | null;
  onSubmit: (encoded: string) => void;
  isDark: boolean;
}

export function MoleRoundAnswer({
  prompt,
  socialites,
  currentSocialiteId,
  onSubmit,
  isDark,
}: MoleRoundAnswerProps) {
  const [answer, setAnswer] = useState('');
  const [accusedId, setAccusedId] = useState<string | null>(null);

  const others = socialites.filter(
    (s) => s.id !== currentSocialiteId && s.isActive && !s.isBanned,
  );

  const handleSubmit = () => {
    const trimmed = answer.trim();
    if (trimmed) onSubmit(JSON.stringify({ answer: trimmed, accusedId }));
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

      {/* Mole accusation */}
      {others.length > 0 && (
        <div className="space-y-2">
          <p className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Suspect a Mole? (optional)
          </p>
          <div className="flex flex-wrap gap-2">
            {others.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setAccusedId(accusedId === s.id ? null : s.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                  accusedId === s.id
                    ? 'border-red-500 bg-red-500/20 text-red-300'
                    : isDark
                      ? 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                }`}
              >
                🕵️ {s.displayName}
              </button>
            ))}
          </div>
        </div>
      )}

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

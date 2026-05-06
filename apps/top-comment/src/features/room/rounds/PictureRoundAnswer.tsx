// Picture round answer phase.
// Shows a host-uploaded image from sociale-photos storage, then collects a text answer.

import { useState } from 'react';
import { supabase } from '../../../supabase/client';

interface PictureRoundAnswerProps {
  content: string | null;          // storage path or signed URL
  prompt?: string | null;          // optional question overlay
  onSubmit: (answer: string) => void;
  isDark: boolean;
}

export function PictureRoundAnswer({ content, prompt, onSubmit, isDark }: PictureRoundAnswerProps) {
  const [answer, setAnswer] = useState('');
  const [imageError, setImageError] = useState(false);

  // content can be a full URL or a storage path (photos/xxx.jpg)
  const imageUrl = content?.startsWith('http')
    ? content
    : content
      ? supabase.storage.from('sociale-photos').getPublicUrl(content).data.publicUrl
      : null;

  const handleSubmit = () => {
    const trimmed = answer.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <div className="space-y-5">
      {/* Image */}
      {imageUrl && !imageError ? (
        <div className="rounded-2xl overflow-hidden border border-white/10">
          <img
            src={imageUrl}
            alt="Round image"
            className="w-full max-h-72 object-contain bg-black"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className={`rounded-2xl h-40 flex items-center justify-center text-4xl ${
          isDark ? 'bg-slate-800' : 'bg-slate-100'
        }`}>
          🖼️
        </div>
      )}

      {prompt && (
        <p className={`text-center text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {prompt}
        </p>
      )}

      <div className="space-y-3">
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
    </div>
  );
}

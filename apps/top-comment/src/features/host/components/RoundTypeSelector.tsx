/**
 * P1-12: Round type selector for custom-mode game creation.
 * Shows an 8-type grid with emoji + name + description.
 * Selected type is highlighted in cyan.
 */

export type RoundTypeId =
  | 'trivia_multiple_choice'
  | 'topic'
  | 'picture'
  | 'wager'
  | 'bluff'
  | 'mole'
  | 'order'
  | 'predictive';

const ROUND_TYPES = [
  { id: 'trivia_multiple_choice' as const, name: 'Trivia',   emoji: '🧠', description: 'Multiple choice questions' },
  { id: 'topic'                  as const, name: 'Topic',    emoji: '💬', description: 'Open-ended discussion' },
  { id: 'picture'                as const, name: 'Picture',  emoji: '🖼',  description: 'Image-based round' },
  { id: 'wager'                  as const, name: 'Wager',    emoji: '🎲', description: 'Bet on your answer' },
  { id: 'bluff'                  as const, name: 'Bluff',    emoji: '🃏', description: 'Spot the fake answer' },
  { id: 'mole'                   as const, name: 'Mole',     emoji: '🕵️', description: 'Find the imposter' },
  { id: 'order'                  as const, name: 'Order',    emoji: '📋', description: 'Rank in sequence' },
  { id: 'predictive'             as const, name: 'Predict',  emoji: '🔮', description: 'Forecast outcomes' },
];

interface RoundTypeSelectorProps {
  value: RoundTypeId;
  onChange: (type: RoundTypeId) => void;
  isDark?: boolean;
}

export function RoundTypeSelector({ value, onChange, isDark }: RoundTypeSelectorProps) {
  return (
    <div>
      <label className={`text-sm font-semibold block mb-2 ${isDark ? 'text-cyan-100' : 'text-slate-700'}`}>
        Default Round Type
      </label>
      <div className="grid grid-cols-4 gap-2">
        {ROUND_TYPES.map(rt => {
          const selected = rt.id === value;
          return (
            <button
              key={rt.id}
              type="button"
              onClick={() => onChange(rt.id)}
              aria-pressed={selected}
              className={`
                flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-center transition-all
                ${selected
                  ? 'border-cyan-400 bg-cyan-900/30 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.3)]'
                  : isDark
                    ? 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }
              `}
            >
              <span className="text-xl leading-none">{rt.emoji}</span>
              <span className="text-xs font-bold">{rt.name}</span>
              <span className={`text-[10px] leading-tight ${selected ? 'text-cyan-300' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {rt.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default RoundTypeSelector;

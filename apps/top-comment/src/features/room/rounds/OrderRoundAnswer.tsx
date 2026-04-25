// Order round answer phase.
// Shows a list of items to drag into the correct order.
// Without @dnd-kit installed, falls back to up/down arrow buttons.
// Encoded as JSON: string[] (ordered item IDs)

import { useState } from 'react';

interface OrderItem {
  id: string;
  text: string;
}

interface OrderRoundAnswerProps {
  /** items comes from currentRound.settings.items: { id, text }[] */
  items: OrderItem[];
  prompt: string | null;
  onSubmit: (encoded: string) => void;
  isDark: boolean;
}

export function OrderRoundAnswer({ items: initialItems, prompt, onSubmit, isDark }: OrderRoundAnswerProps) {
  const [items, setItems] = useState<OrderItem[]>(initialItems);

  const move = (index: number, direction: -1 | 1) => {
    const next = [...items];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= next.length) return;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    setItems(next);
  };

  const handleSubmit = () => {
    onSubmit(JSON.stringify(items.map((i) => i.id)));
  };

  return (
    <div className="space-y-4">
      {prompt && (
        <p className={`text-center text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {prompt}
        </p>
      )}

      <p className={`text-xs text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Arrange in the correct order
      </p>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <span className={`text-lg font-black w-6 text-center ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
              {i + 1}
            </span>
            <span className="flex-1 text-sm font-medium">{item.text}</span>
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="text-white/50 hover:text-white disabled:opacity-20 text-xs leading-none"
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                className="text-white/50 hover:text-white disabled:opacity-20 text-xs leading-none"
                aria-label="Move down"
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={items.length === 0}
        className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-white font-black py-3 text-sm uppercase tracking-wider transition-colors"
      >
        Submit Order
      </button>
    </div>
  );
}

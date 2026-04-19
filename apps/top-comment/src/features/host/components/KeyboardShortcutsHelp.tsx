import { useState } from 'react';

const SHORTCUTS = [
  { key: 'Space', action: 'Advance Phase' },
  { key: 'P', action: 'Pause / Resume' },
  { key: 'E', action: 'End Sociale' },
  { key: 'N', action: 'New Sociale' },
  { key: '⌘K', action: 'Command Palette' },
] as const;

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 border-t border-slate-700 pt-3">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 transition-colors w-full"
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Keyboard Shortcuts
        <svg
          className={`ml-auto w-3.5 h-3.5 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
          {SHORTCUTS.map(({ key, action }) => (
            <div key={key} className="flex items-center gap-2 col-span-2">
              <kbd className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-slate-700 text-cyan-300 border border-slate-600 min-w-[2rem] justify-center">
                {key}
              </kbd>
              <span className="text-xs text-slate-400">{action}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

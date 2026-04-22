import { useEffect } from 'react';

export interface HostHotkeyHandlers {
  /**
   * Keypad 1-9 → fire soundboard cue at that index (0-indexed into the cues
   * array). Returns `true` if the hotkey should consume the key event.
   */
  onSound?: (index: number) => void;
  /** 'u' / 'U' → toggle all-eyes-up. */
  onAttentionToggle?: () => void;
  /** 'l' / 'L' → toggle lock-it-in. */
  onLockInToggle?: () => void;
  /** 'b' / 'B' → start a break. */
  onBreak?: () => void;
}

/**
 * P1-4 hotkey binder for the host. Safely bails when focus is in an input or
 * contenteditable surface so typing in modals never fires cues.
 *
 * Deliberately tiny — we want hosts to be able to pound 1/2/3/4 during reveal
 * without thinking about modifiers. Shift/Alt/Ctrl/Meta are ignored so global
 * OS shortcuts still take precedence.
 */
export function useHostHotkeys(handlers: HostHotkeyHandlers) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.metaKey || e.ctrlKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      if (target?.isContentEditable) return;

      if (handlers.onSound && /^[1-9]$/.test(e.key)) {
        const idx = Number(e.key) - 1;
        handlers.onSound(idx);
        e.preventDefault();
        return;
      }
      // P1-4 letter aliases: D rum C cheer B boo F fail A applause L lobby Y confetti.
      if (handlers.onSound && e.key.length === 1) {
        const letterMap: Record<string, number> = {
          d: 0,
          c: 1,
          b: 2,
          f: 3,
          a: 4,
          l: 5,
          y: 8,
        };
        const idx = letterMap[e.key.toLowerCase()];
        if (idx !== undefined) {
          handlers.onSound(idx);
          e.preventDefault();
          return;
        }
      }
      if (handlers.onAttentionToggle && (e.key === 'u' || e.key === 'U')) {
        handlers.onAttentionToggle();
        e.preventDefault();
        return;
      }
      if (handlers.onLockInToggle && (e.key === 'l' || e.key === 'L')) {
        handlers.onLockInToggle();
        e.preventDefault();
        return;
      }
      if (handlers.onBreak && (e.key === 'b' || e.key === 'B')) {
        handlers.onBreak();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    handlers.onSound,
    handlers.onAttentionToggle,
    handlers.onLockInToggle,
    handlers.onBreak,
  ]);
}

export default useHostHotkeys;

import { useEffect, useCallback } from 'react';

export interface HostKeyboardActions {
  onPrimaryAction?: () => void;
  onPauseToggle?: () => void;
  onToggleHelp?: () => void;
}

function isTyping(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function useHostKeyboardShortcuts(
  actions: HostKeyboardActions,
  enabled: boolean = true
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      if (isTyping()) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          actions.onPrimaryAction?.();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          actions.onPauseToggle?.();
          break;
        case '?':
          e.preventDefault();
          actions.onToggleHelp?.();
          break;
        default:
          break;
      }
    },
    [enabled, actions]
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

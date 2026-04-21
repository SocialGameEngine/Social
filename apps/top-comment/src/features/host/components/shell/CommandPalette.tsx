/**
 * CommandPalette - Keyboard-driven command interface (Cmd+K)
 * 
 * Features:
 * - Fuzzy search for commands
 * - Keyboard navigation
 * - Recent commands
 * - Context-aware command filtering
 * - Accessible with screen readers
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { SessionStatus } from '../../../../shared/types';

// ============================================================================
// Types
// ============================================================================

export interface Command {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  icon?: React.ReactNode;
  category: 'session' | 'participants' | 'settings' | 'navigation';
  action: () => void;
  disabled?: boolean;
  hidden?: boolean;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
  sessionPhase?: SessionStatus;
  recentCommandIds?: string[];
  onCommandExecuted?: (commandId: string) => void;
}

// ============================================================================
// Fuzzy Search
// ============================================================================

function fuzzyMatch(query: string, text: string): { match: boolean; score: number } {
  if (!query) return { match: true, score: 0 };
  
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Exact match
  if (textLower.includes(queryLower)) {
    return { match: true, score: 100 - textLower.indexOf(queryLower) };
  }
  
  // Fuzzy match - all query chars must appear in order
  let queryIndex = 0;
  let score = 0;
  let consecutiveBonus = 0;
  
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      score += 10 + consecutiveBonus;
      consecutiveBonus += 5;
      queryIndex++;
    } else {
      consecutiveBonus = 0;
    }
  }
  
  return {
    match: queryIndex === queryLower.length,
    score: queryIndex === queryLower.length ? score : 0,
  };
}

// ============================================================================
// Component
// ============================================================================

export function CommandPalette({
  isOpen,
  onClose,
  commands,
  recentCommandIds = [],
  onCommandExecuted,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter and sort commands
  const filteredCommands = useMemo(() => {
    const visibleCommands = commands.filter(cmd => !cmd.hidden);
    
    if (!query) {
      // Show recent commands first, then by category
      const recent = recentCommandIds
        .map(id => visibleCommands.find(cmd => cmd.id === id))
        .filter((cmd): cmd is Command => !!cmd);
      
      const others = visibleCommands.filter(cmd => !recentCommandIds.includes(cmd.id));
      
      return [...recent, ...others];
    }
    
    // Fuzzy search
    return visibleCommands
      .map(cmd => ({
        cmd,
        ...fuzzyMatch(query, `${cmd.label} ${cmd.description || ''}`),
      }))
      .filter(item => item.match)
      .sort((a, b) => b.score - a.score)
      .map(item => item.cmd);
  }, [commands, query, recentCommandIds]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    
    for (const cmd of filteredCommands) {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    }
    
    return groups;
  }, [filteredCommands]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          Math.min(prev + 1, filteredCommands.length - 1)
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        const selectedCommand = filteredCommands[selectedIndex];
        if (selectedCommand && !selectedCommand.disabled) {
          selectedCommand.action();
          onCommandExecuted?.(selectedCommand.id);
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filteredCommands, selectedIndex, onClose, onCommandExecuted]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector('[data-selected="true"]');
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Global keyboard shortcut to open
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // This would need to be handled by parent
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categoryLabels: Record<string, string> = {
    session: 'Session',
    participants: 'Participants',
    settings: 'Settings',
    navigation: 'Navigation',
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Palette */}
      <div 
        className="relative w-full max-w-lg bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
          <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-white placeholder-slate-400 focus:outline-none"
            aria-label="Command search"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
            aria-activedescendant={filteredCommands[selectedIndex]?.id}
          />
          <kbd className="px-2 py-1 text-xs font-medium text-slate-400 bg-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div 
          ref={listRef}
          id="command-list"
          role="listbox"
          className="max-h-80 overflow-y-auto py-2"
        >
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400">
              No commands found
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category}>
                <div className="px-4 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {categoryLabels[category] || category}
                </div>
                {cmds.map((cmd) => {
                  const globalIndex = filteredCommands.indexOf(cmd);
                  const isSelected = globalIndex === selectedIndex;
                  
                  return (
                    <button
                      key={cmd.id}
                      id={cmd.id}
                      role="option"
                      aria-selected={isSelected}
                      data-selected={isSelected}
                      disabled={cmd.disabled}
                      onClick={() => {
                        if (!cmd.disabled) {
                          cmd.action();
                          onCommandExecuted?.(cmd.id);
                          onClose();
                        }
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected 
                          ? 'bg-cyan-500/20 text-white' 
                          : 'text-slate-300 hover:bg-slate-700/50'
                      } ${cmd.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {/* Icon */}
                      {cmd.icon && (
                        <span className="flex-shrink-0 w-5 h-5 text-slate-400">
                          {cmd.icon}
                        </span>
                      )}
                      
                      {/* Label and description */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{cmd.label}</div>
                        {cmd.description && (
                          <div className="text-sm text-slate-400 truncate">
                            {cmd.description}
                          </div>
                        )}
                      </div>
                      
                      {/* Shortcut */}
                      {cmd.shortcut && (
                        <kbd className="flex-shrink-0 px-2 py-1 text-xs font-medium text-slate-400 bg-slate-700 rounded">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-700 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">↵</kbd>
              <span>to select</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Hook for managing command palette state
// ============================================================================

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  const recordCommand = useCallback((commandId: string) => {
    setRecentCommands(prev => {
      const filtered = prev.filter(id => id !== commandId);
      return [commandId, ...filtered].slice(0, 5);
    });
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    recentCommands,
    recordCommand,
  };
}

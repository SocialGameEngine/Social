/**
 * HostTopStatusBar - Top status bar for host panel
 * 
 * Displays:
 * - Room/session code
 * - Connection status (green/yellow/red dot)
 * - Timer display
 * - Overflow menu access
 * 
 * Features:
 * - Safe-area top inset
 * - aria-live for status announcements
 * - 44-56px height for touch targets
 */

import { useState, useRef, useEffect } from 'react';
import type { ConnectionStatus, SessionMode } from '../../types/host-panel.types';

interface HostTopStatusBarProps {
  roomCode: string;
  phaseName: string;
  connectionStatus: ConnectionStatus;
  isPaused: boolean;
  isRecording?: boolean;
  mode?: SessionMode;
  roundIndex?: number;
  totalRounds?: number;
  onMenuOpen?: () => void;
  onSettingsOpen?: () => void;
}

const CONNECTION_COLORS: Record<ConnectionStatus, string> = {
  connected: 'bg-green-400',
  reconnecting: 'bg-yellow-400 animate-pulse',
  offline: 'bg-red-400',
  error: 'bg-red-500',
};

const CONNECTION_LABELS: Record<ConnectionStatus, string> = {
  connected: 'Connected',
  reconnecting: 'Reconnecting...',
  offline: 'Offline',
  error: 'Connection error',
};

export function HostTopStatusBar({
  roomCode,
  phaseName,
  connectionStatus,
  isPaused,
  isRecording = false,
  mode,
  roundIndex,
  totalRounds,
  onMenuOpen,
  onSettingsOpen,
}: HostTopStatusBarProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  
  return (
    <div className="host-status-bar flex items-center justify-between px-4 py-2 bg-slate-900/95 backdrop-blur-sm border-b border-cyan-400/20">
      {/* Left section: Room code and status */}
      <div className="flex items-center gap-3">
        {/* Connection status indicator */}
        <div 
          className="flex items-center gap-2"
          role="status"
          aria-live="polite"
        >
          <span 
            className={`w-2.5 h-2.5 rounded-full ${CONNECTION_COLORS[connectionStatus]}`}
            aria-hidden="true"
          />
          <span className="sr-only">{CONNECTION_LABELS[connectionStatus]}</span>
        </div>

        {/* Room code */}
        <div className="flex flex-col">
          <span className="text-xs font-medium text-cyan-300 uppercase tracking-wider">
            Room
          </span>
          <span className="text-sm font-bold text-white tracking-wide">
            {roomCode || '------'}
          </span>
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-red-400 uppercase">REC</span>
          </div>
        )}

        {/* Rehearsal mode indicator */}
        {mode === 'rehearsal' && (
          <div className="px-2 py-1 bg-amber-500/20 rounded-full">
            <span className="text-xs font-semibold text-amber-400 uppercase">Rehearsal</span>
          </div>
        )}
      </div>

      {/* Center section: Phase and timer */}
      <div className="flex items-center gap-4">
        {/* Phase indicator */}
        <div className="flex items-center gap-2">
          {isPaused && (
            <span className="px-2 py-0.5 bg-yellow-500/20 rounded text-xs font-semibold text-yellow-400 uppercase">
              Paused
            </span>
          )}
          <span className="text-sm font-semibold text-cyan-100 uppercase tracking-wide">
            {phaseName}
          </span>
        </div>

        
        {/* Round indicator */}
        {totalRounds && (
          <span className="text-xs text-slate-400">
            Round {(roundIndex ?? 0) + 1}{totalRounds ? ` / ${totalRounds}` : ''}
          </span>
        )}
      </div>

      {/* Right section: Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-700/50 active:bg-slate-600/50 transition-colors"
          aria-label="Open menu"
          aria-expanded={showMenu}
          aria-haspopup="menu"
        >
          <svg className="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <div 
            className="absolute right-0 top-full mt-2 w-48 py-2 bg-slate-800 rounded-xl shadow-xl border border-slate-700 z-50"
            role="menu"
          >
            <button
              onClick={() => {
                setShowMenu(false);
                onSettingsOpen?.();
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-700 transition-colors"
              role="menuitem"
            >
              <span className="flex items-center gap-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </span>
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                onMenuOpen?.();
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-700 transition-colors"
              role="menuitem"
            >
              <span className="flex items-center gap-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                More Options
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

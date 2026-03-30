/**
 * HostDesktopShell - Desktop layout for host panel
 * 
 * Features:
 * - Multi-column grid layout (controls | canvas | participants)
 * - Resizable panels with drag handles
 * - Collapsible sidebars
 * - Keyboard shortcuts
 * - Persistent layout preferences
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface HostDesktopShellProps {
  header: React.ReactNode;
  controlsPanel: React.ReactNode;
  mainCanvas: React.ReactNode;
  participantsPanel?: React.ReactNode;
  className?: string;
  defaultLeftWidth?: number;
  defaultRightWidth?: number;
  minPanelWidth?: number;
  maxPanelWidth?: number;
}

const STORAGE_KEY = 'host-desktop-layout';

interface LayoutPrefs {
  leftWidth: number;
  rightWidth: number;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
}

function loadLayoutPrefs(): LayoutPrefs | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveLayoutPrefs(prefs: LayoutPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore
  }
}

export function HostDesktopShell({
  header,
  controlsPanel,
  mainCanvas,
  participantsPanel,
  className = '',
  defaultLeftWidth = 320,
  defaultRightWidth = 280,
  minPanelWidth = 200,
  maxPanelWidth = 500,
}: HostDesktopShellProps) {
  // Load saved preferences
  const savedPrefs = loadLayoutPrefs();
  
  const [leftWidth, setLeftWidth] = useState(savedPrefs?.leftWidth ?? defaultLeftWidth);
  const [rightWidth, setRightWidth] = useState(savedPrefs?.rightWidth ?? defaultRightWidth);
  const [leftCollapsed, setLeftCollapsed] = useState(savedPrefs?.leftCollapsed ?? false);
  const [rightCollapsed, setRightCollapsed] = useState(savedPrefs?.rightCollapsed ?? false);
  const [isDragging, setIsDragging] = useState<'left' | 'right' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Save preferences when they change
  useEffect(() => {
    saveLayoutPrefs({ leftWidth, rightWidth, leftCollapsed, rightCollapsed });
  }, [leftWidth, rightWidth, leftCollapsed, rightCollapsed]);

  // Handle resize drag
  const handleMouseDown = useCallback((side: 'left' | 'right') => {
    setIsDragging(side);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    if (isDragging === 'left') {
      const newWidth = e.clientX - containerRect.left;
      setLeftWidth(Math.max(minPanelWidth, Math.min(maxPanelWidth, newWidth)));
    } else {
      const newWidth = containerRect.right - e.clientX;
      setRightWidth(Math.max(minPanelWidth, Math.min(maxPanelWidth, newWidth)));
    }
  }, [isDragging, minPanelWidth, maxPanelWidth]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  // Attach global mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + [ to toggle left panel
      if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault();
        setLeftCollapsed(prev => !prev);
      }
      // Cmd/Ctrl + ] to toggle right panel
      if ((e.metaKey || e.ctrlKey) && e.key === ']') {
        e.preventDefault();
        setRightCollapsed(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col h-screen bg-slate-900 ${className}`}
    >
      {/* Header */}
      <header className="flex-shrink-0 sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-cyan-400/20">
        {header}
      </header>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Controls */}
        <aside
          className={`flex-shrink-0 bg-slate-800/50 border-r border-slate-700 transition-all duration-200 ${
            leftCollapsed ? 'w-0 overflow-hidden' : ''
          }`}
          style={{ width: leftCollapsed ? 0 : leftWidth }}
        >
          <div className="h-full overflow-y-auto p-4">
            {controlsPanel}
          </div>
        </aside>

        {/* Left resize handle */}
        {!leftCollapsed && (
          <div
            className="flex-shrink-0 w-1 bg-slate-700 hover:bg-cyan-400/50 cursor-col-resize transition-colors relative group"
            onMouseDown={() => handleMouseDown('left')}
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
            {/* Collapse button */}
            <button
              onClick={() => setLeftCollapsed(true)}
              className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-12 bg-slate-700 hover:bg-slate-600 rounded-r-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Collapse left panel"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* Expand left button when collapsed */}
        {leftCollapsed && (
          <button
            onClick={() => setLeftCollapsed(false)}
            className="flex-shrink-0 w-8 bg-slate-800 hover:bg-slate-700 border-r border-slate-700 flex items-center justify-center transition-colors"
            aria-label="Expand left panel"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Main canvas - flexible width */}
        <main className="flex-1 overflow-y-auto p-6 min-w-0">
          {mainCanvas}
        </main>

        {/* Expand right button when collapsed */}
        {rightCollapsed && participantsPanel && (
          <button
            onClick={() => setRightCollapsed(false)}
            className="flex-shrink-0 w-8 bg-slate-800 hover:bg-slate-700 border-l border-slate-700 flex items-center justify-center transition-colors"
            aria-label="Expand right panel"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Right resize handle */}
        {!rightCollapsed && participantsPanel && (
          <div
            className="flex-shrink-0 w-1 bg-slate-700 hover:bg-cyan-400/50 cursor-col-resize transition-colors relative group"
            onMouseDown={() => handleMouseDown('right')}
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
            {/* Collapse button */}
            <button
              onClick={() => setRightCollapsed(true)}
              className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-12 bg-slate-700 hover:bg-slate-600 rounded-l-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Collapse right panel"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Right panel - Participants */}
        {participantsPanel && (
          <aside
            className={`flex-shrink-0 bg-slate-800/50 border-l border-slate-700 transition-all duration-200 ${
              rightCollapsed ? 'w-0 overflow-hidden' : ''
            }`}
            style={{ width: rightCollapsed ? 0 : rightWidth }}
          >
            <div className="h-full overflow-y-auto p-4">
              {participantsPanel}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

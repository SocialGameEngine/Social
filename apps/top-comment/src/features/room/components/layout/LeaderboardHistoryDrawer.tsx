import { createPortal } from 'react-dom';
import { LeaderboardHistoryPanel } from './LeaderboardHistoryPanel';

interface LeaderboardHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string | undefined;
  currentSessionId: string | null;
}

export function LeaderboardHistoryDrawer({ isOpen, onClose, roomId, currentSessionId }: LeaderboardHistoryDrawerProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 sm:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer - slides up from bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[calc(100vh-120px)] flex flex-col bg-slate-900 border-t border-slate-700/50 rounded-t-2xl shadow-2xl animate-slide-up pb-6">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {/* Header with close */}
        <div className="flex items-center justify-between px-4 pb-2 shrink-0">
          <h2 className="text-sm font-semibold text-slate-300">Leaderboard</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Leaderboard content */}
        <div className="flex-1 min-h-0">
          <LeaderboardHistoryPanel roomId={roomId} currentSessionId={currentSessionId} />
        </div>
      </div>
    </div>,
    document.body
  );
}

interface ReconnectionOverlayProps {
  isConnected: boolean;
  secondsSinceLastUpdate: number;
  reconnectAttempts: number;
}

export function ReconnectionOverlay({
  isConnected,
  secondsSinceLastUpdate,
  reconnectAttempts,
}: ReconnectionOverlayProps) {
  if (isConnected) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
      <div className="bg-slate-900/95 border border-amber-500/50 rounded-2xl px-8 py-6 text-center shadow-xl shadow-amber-500/10 max-w-sm mx-4 pointer-events-auto">
        <div className="flex justify-center mb-4">
          <svg className="animate-spin h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-amber-400 mb-1">Reconnecting...</h2>
        <p className="text-sm text-slate-400">
          Last updated {secondsSinceLastUpdate}s ago
        </p>
        {reconnectAttempts > 1 && (
          <p className="text-xs text-slate-500 mt-2">
            Attempt {reconnectAttempts}
          </p>
        )}
      </div>
    </div>
  );
}

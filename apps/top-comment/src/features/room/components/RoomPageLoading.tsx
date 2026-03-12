// Simple loading component - no logic needed since anyone can view rooms

export function RoomPageLoading() {
  // Show loading while room data is loading
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="animate-pulse">Loading room...</div>
    </div>
  );
}

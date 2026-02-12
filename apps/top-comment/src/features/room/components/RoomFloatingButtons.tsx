interface RoomFloatingButtonsProps {
  showLeaderboardDrawer: boolean;
  showChatDrawer: boolean;
  showLobbyDrawer: boolean;
  onToggleLeaderboard: () => void;
  onToggleChat: () => void;
}

export function RoomFloatingButtons({
  showLeaderboardDrawer,
  showChatDrawer,
  onToggleLeaderboard,
  onToggleChat,
}: RoomFloatingButtonsProps) {
  return (
    <div className="fixed right-4 bottom-24 flex flex-col items-end gap-3 z-40">
      {/* Leaderboard Button */}
      <button
        onClick={onToggleLeaderboard}
        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          showLeaderboardDrawer 
            ? 'bg-amber-400 text-white shadow-amber-400/40' 
            : 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-500/30'
        }`}
        aria-label={showLeaderboardDrawer ? 'Close Leaderboard' : 'Open Leaderboard'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>
      
      {/* Chat Button */}
      <button
        onClick={onToggleChat}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          showChatDrawer 
            ? 'bg-cyan-400 text-white shadow-cyan-400/40' 
            : 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-cyan-500/30'
        }`}
        aria-label={showChatDrawer ? 'Close Chat' : 'Open Chat'}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    </div>
  );
}

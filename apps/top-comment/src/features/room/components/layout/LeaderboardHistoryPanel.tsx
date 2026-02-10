import { useState } from 'react';
import { useRoomLeaderboard, type SessionLeaderboard, type SessionLeaderboardEntry } from '../../../../hooks/useRoomLeaderboard';

interface LeaderboardHistoryPanelProps {
  roomId: string | undefined;
  currentSessionId: string | null;
}

function LeaderboardList({ entries }: { entries: SessionLeaderboardEntry[] }) {
  return (
    <ul className="space-y-1">
      {entries.map((entry) => {
        const isCurrentPlayer = false; // We match by playerId which is session-scoped, not userId
        return (
          <li
            key={entry.playerId}
            className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
              isCurrentPlayer ? 'bg-cyan-500/10 border-l-2 border-cyan-400' : 'hover:bg-slate-800/50'
            }`}
          >
            {/* Rank */}
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <span className={`text-sm font-bold ${
                entry.rank === 1 ? 'text-yellow-400' :
                entry.rank === 2 ? 'text-gray-300' :
                entry.rank === 3 ? 'text-amber-600' :
                'text-slate-400'
              }`}>
                {entry.rank}
              </span>
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-cyan-400">
                {entry.displayName?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>

            {/* Name and score */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${
                isCurrentPlayer ? 'text-cyan-300' : 'text-slate-200'
              }`}>
                {entry.displayName}
              </p>
              <p className="text-xs text-slate-500">{entry.score} pts</p>
            </div>

            {/* Trophy for 1st */}
            {entry.rank === 1 && (
              <div className="w-6 h-6 flex items-center justify-center">
                <span className="text-lg">🏆</span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function PastSessionCard({ session }: { session: SessionLeaderboard }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const endedDate = session.endedAt ? new Date(session.endedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
  const winner = session.entries[0];

  return (
    <div className="border border-slate-700/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-slate-500">{endedDate}</span>
          {winner && (
            <span className="text-xs text-yellow-400 truncate">🏆 {winner.displayName}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500">{session.entries.length} players</span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isExpanded && (
        <div className="border-t border-slate-700/50">
          <LeaderboardList entries={session.entries} />
        </div>
      )}
    </div>
  );
}

export function LeaderboardHistoryPanel({ roomId, currentSessionId }: LeaderboardHistoryPanelProps) {
  const { currentLeaderboard, pastLeaderboards, isLoading } = useRoomLeaderboard({
    roomId,
    currentSessionId,
  });
  const [activeView, setActiveView] = useState<'current' | 'past'>('current');

  return (
    <div className="flex flex-col h-full">
      {/* Toggle buttons */}
      <div className="flex border-b border-slate-700/50 shrink-0">
        <button
          onClick={() => setActiveView('current')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeView === 'current'
              ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Current Game
        </button>
        <button
          onClick={() => setActiveView('past')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeView === 'past'
              ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Past Games
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <p className="text-xs text-slate-500 text-center py-8">Loading leaderboards...</p>
        ) : activeView === 'current' ? (
          currentLeaderboard && currentLeaderboard.entries.length > 0 ? (
            <LeaderboardList entries={currentLeaderboard.entries} />
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">
              No active game in this room.
            </p>
          )
        ) : (
          pastLeaderboards.length > 0 ? (
            <div className="p-2 space-y-2 min-h-0">
              {pastLeaderboards.map((session) => (
                <PastSessionCard
                  key={session.sessionId}
                  session={session}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">
              No past games in this room.
            </p>
          )
        )}
      </div>
    </div>
  );
}

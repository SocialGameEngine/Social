import { Link, useParams, Navigate } from "react-router-dom";
import { useAuth } from "../../shared/providers/AuthContext";
import { useRoom } from "../../hooks/useRoom";
import { useVenueAnalytics } from "../../hooks/useVenueAnalytics";
import { StatCards } from "./components/StatCards";
import { SessionHistoryTable } from "./components/SessionHistoryTable";
import { PeakTimesHeatmap } from "./components/PeakTimesHeatmap";
import { PromptLibraryChart } from "./components/PromptLibraryChart";
import { PlayerEngagementTable } from "./components/PlayerEngagementTable";
import { DateRangePicker } from "./components/DateRangePicker";

export function AnalyticsDashboard() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { user } = useAuth();

  const { room, isLoading: roomLoading } = useRoom({ roomCode });

  const {
    summary,
    sessionHistory,
    playerEngagement,
    peakTimes,
    popularLibraries,
    retention,
    isLoading,
    dateRange,
    setDateRange,
    refresh,
  } = useVenueAnalytics({ roomId: room?.id });

  // Access control: must be room host
  const isHost = room?.creatorId === user?.id;
  if (!roomLoading && room && !isHost) {
    return <Navigate to="/" replace />;
  }

  if (roomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="animate-pulse text-cyan-300">Loading analytics...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-pink-400">Room Not Found</h1>
          <p className="text-slate-400">The room code "{roomCode}" doesn't exist.</p>
          <Link to="/host" className="text-cyan-400 hover:text-cyan-300 text-sm mt-4 inline-block">
            ← Back to Host
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link to="/host" className="text-sm font-semibold text-cyan-400 hover:text-cyan-300">
                ← Host
              </Link>
              <button
                onClick={refresh}
                className="text-xs text-slate-400 hover:text-cyan-300 transition-colors"
                title="Refresh data"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <h1 className="text-2xl font-black text-pink-400">
              {room.name || room.code} — Analytics
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Room {room.code} • Created {new Date(room.createdAt).toLocaleDateString()}
            </p>
          </div>
          <DateRangePicker
            dateRange={dateRange}
            setDateRange={(from, to) => setDateRange({ from, to })}
          />
        </div>

        {/* KPI Cards */}
        <StatCards summary={summary} isLoading={isLoading} />

        {/* Session History */}
        <SessionHistoryTable sessions={sessionHistory} isLoading={isLoading} />

        {/* Peak Times + Prompt Libraries */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PeakTimesHeatmap peakTimes={peakTimes} isLoading={isLoading} />
          <PromptLibraryChart libraries={popularLibraries} isLoading={isLoading} />
        </div>

        {/* Player Engagement */}
        <PlayerEngagementTable
          players={playerEngagement}
          retention={retention}
          isLoading={isLoading}
        />
      </div>
    </main>
  );
}

export default AnalyticsDashboard;

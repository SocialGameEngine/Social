import { useState, useEffect, useCallback } from "react";
import {
  getRoomAnalyticsSummary,
  getSessionHistory,
  getPlayerEngagement,
  getPeakTimes,
  getPopularPromptLibraries,
  getRetentionMetrics,
  type RoomAnalyticsSummary,
  type SessionDetail,
  type PlayerEngagement,
  type PeakTimeData,
  type LibraryUsage,
  type RetentionMetrics,
} from "../services/analyticsService";

interface UseVenueAnalyticsProps {
  roomId?: string;
}

export function useVenueAnalytics({ roomId }: UseVenueAnalyticsProps) {
  const [summary, setSummary] = useState<RoomAnalyticsSummary | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionDetail[]>([]);
  const [playerEngagement, setPlayerEngagement] = useState<PlayerEngagement[]>([]);
  const [peakTimes, setPeakTimes] = useState<PeakTimeData[]>([]);
  const [popularLibraries, setPopularLibraries] = useState<LibraryUsage[]>([]);
  const [retention, setRetention] = useState<RetentionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(),
  });

  const fetchAll = useCallback(async () => {
    if (!roomId) return;
    setIsLoading(true);
    try {
      const [s, sh, pe, pt, pl, rm] = await Promise.all([
        getRoomAnalyticsSummary(roomId),
        getSessionHistory(roomId, 100),
        getPlayerEngagement(roomId, 50),
        getPeakTimes(roomId),
        getPopularPromptLibraries(roomId),
        getRetentionMetrics(roomId),
      ]);
      setSummary(s);
      setSessionHistory(sh);
      setPlayerEngagement(pe);
      setPeakTimes(pt);
      setPopularLibraries(pl);
      setRetention(rm);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    summary,
    sessionHistory,
    playerEngagement,
    peakTimes,
    popularLibraries,
    retention,
    isLoading,
    dateRange,
    setDateRange,
    refresh: fetchAll,
  };
}

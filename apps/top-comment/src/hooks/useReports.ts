import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';
import {
  reportService,
  type Report,
  type ReportAction,
} from '../services/reportService';

interface UseReportsOptions {
  roomId: string | undefined;
  isHost: boolean;
}

export function useReports({ roomId, isHost }: UseReportsOptions) {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  // Load reports (host only)
  useEffect(() => {
    if (!roomId || !isHost) {
      setReports([]);
      return;
    }

    setIsLoading(true);
    reportService
      .getReportsForRoom(roomId)
      .then(setReports)
      .catch((err) => console.error('Failed to load reports:', err))
      .finally(() => setIsLoading(false));
  }, [roomId, isHost]);

  // Real-time subscription for new reports
  useEffect(() => {
    if (!roomId || !isHost) return;

    const channel = supabase
      .channel(`reports:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reports',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const raw = payload.new as Record<string, any>;
          const report: Report = {
            id: raw.id,
            roomId: raw.room_id,
            reporterMembershipId: raw.reporter_membership_id,
            reportedMembershipId: raw.reported_membership_id ?? null,
            contentType: raw.content_type,
            contentId: raw.content_id ?? null,
            reason: raw.reason,
            description: raw.description ?? null,
            status: raw.status,
            reviewedBy: raw.reviewed_by ?? null,
            reviewedAt: raw.reviewed_at ?? null,
            actionTaken: raw.action_taken ?? null,
            createdAt: raw.created_at,
          };
          setReports((prev) => [report, ...prev]);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, isHost]);

  const reviewReport = useCallback(
    async (reportId: string, action: ReportAction, reviewerMembershipId: string) => {
      const updated = await reportService.reviewReport(reportId, action, reviewerMembershipId);
      setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
      return updated;
    },
    []
  );

  const dismissReport = useCallback(
    async (reportId: string, reviewerMembershipId: string) => {
      const updated = await reportService.dismissReport(reportId, reviewerMembershipId);
      setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
      return updated;
    },
    []
  );

  return { reports, pendingCount, isLoading, reviewReport, dismissReport };
}
